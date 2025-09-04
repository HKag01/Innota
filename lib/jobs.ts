// lib/jobs.ts
import { prisma } from "@/lib/prisma";
import { getGeminiEmbedding } from "@/lib/embedding";
import pdf from "pdf-parse";
import { GoogleGenAI } from "@google/genai";

// Initialize necessary clients
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// --- Enhanced OCR using Gemini's multimodal capabilities ---
async function runOcrOnPdf(buffer: Buffer): Promise<string> {
	console.log("Using Gemini's built-in OCR for PDF processing...");
	try {
		// Convert PDF buffer to base64 for Gemini
		const base64Data = buffer.toString("base64");

		const response = await ai.models.generateContent({
			model: "gemini-1.5-flash",
			contents: [
				{
					role: "user",
					parts: [
						{
							inlineData: {
								data: base64Data,
								mimeType: "application/pdf",
							},
						},
						{
							text: "Extract all text content from this PDF document. Return only the text content without any formatting or additional commentary.",
						},
					],
				},
			],
		});

		const extractedText =
			response.candidates?.[0]?.content?.parts?.[0]?.text ||
			response.text ||
			"";

		console.log(`Gemini OCR extracted ${extractedText.length} characters`);
		return extractedText;
	} catch (error) {
		console.error("Gemini OCR failed:", error);
		return "";
	}
}

// --- Generate PDF thumbnail using direct ImageMagick (most reliable) ---
async function generatePdfThumbnail(buffer: Buffer): Promise<string | null> {
	console.log("Generating PDF thumbnail from first page...");
	try {
		const { exec } = require("child_process");
		const { promisify } = require("util");
		const execAsync = promisify(exec);
		const fs = require("fs");
		const path = require("path");
		const os = require("os");

		// Create temporary files
		const tempDir = os.tmpdir();
		const timestamp = Date.now();
		const tempPdfPath = path.join(tempDir, `temp_pdf_${timestamp}.pdf`);
		const tempImagePath = path.join(tempDir, `temp_thumb_${timestamp}.jpeg`);

		// Write PDF buffer to temporary file
		fs.writeFileSync(tempPdfPath, buffer);
		console.log(
			`Temporary PDF written: ${tempPdfPath} (${buffer.length} bytes)`
		);

		// Use ImageMagick to convert first page to thumbnail
		// [0] means first page, -resize for dimensions, -quality for JPEG quality
		const command = `magick "${tempPdfPath}[0]" -background white -flatten -resize 400x533 -quality 85 "${tempImagePath}"`;
		console.log("Running ImageMagick command...");
		console.log(`Command: ${command}`);

		// Execute the command
		const { stdout, stderr } = await execAsync(command);

		if (stderr && !stderr.includes("Warning")) {
			console.warn("ImageMagick stderr:", stderr);
		}

		// Check if image was created
		if (!fs.existsSync(tempImagePath)) {
			throw new Error("Thumbnail image file was not created by ImageMagick");
		}

		// Read the generated image
		const imageBuffer = fs.readFileSync(tempImagePath);

		if (!imageBuffer || imageBuffer.length === 0) {
			throw new Error("Generated thumbnail image is empty");
		}

		console.log(`Thumbnail image generated: ${imageBuffer.length} bytes`);

		// Convert to base64
		const base64Thumbnail = imageBuffer.toString("base64");
		const dataUrl = `data:image/jpeg;base64,${base64Thumbnail}`;

		// Clean up temporary files
		try {
			fs.unlinkSync(tempPdfPath);
			fs.unlinkSync(tempImagePath);
			console.log("Temporary files cleaned up");
		} catch (cleanupError) {
			console.warn("Failed to cleanup temp files:", cleanupError);
		}

		console.log(
			`PDF thumbnail generated successfully (${base64Thumbnail.length} chars)`
		);
		return dataUrl;
	} catch (error) {
		console.error("PDF thumbnail generation failed:", error);
		console.error("Error details:", error.message);

		// Return null instead of throwing to allow PDF processing to continue
		return null;
	}
}

// --- Text Chunking Helper ---
function chunkText(
	text: string,
	chunkSize = 1500,
	chunkOverlap = 200
): string[] {
	if (text.length <= chunkSize) {
		return [text];
	}
	const chunks: string[] = [];
	let i = 0;
	while (i < text.length) {
		const end = Math.min(i + chunkSize, text.length);
		chunks.push(text.slice(i, end));
		i += chunkSize - chunkOverlap;
	}
	return chunks;
}

export async function processPdf(contentId: string, fileUrl: string) {
	// 1. Update status to PROCESSING
	await prisma.content.update({
		where: { id: contentId },
		data: { status: "PROCESSING" },
	});

	try {
		// 2. Fetch the PDF from the URL
		const response = await fetch(fileUrl);
		if (!response.ok)
			throw new Error(`Failed to fetch PDF: ${response.statusText}`);
		const buffer = Buffer.from(await response.arrayBuffer());

		// 3. Generate thumbnail from first page
		const thumbnail = await generatePdfThumbnail(buffer);

		// 4. Attempt direct text extraction
		let contentText = "";
		try {
			const data = await pdf(buffer);
			contentText = data.text || "";
		} catch (parseError) {
			console.warn("pdf-parse failed, will attempt OCR:", parseError);
		}

		// 5. Smart OCR Fallback: If direct extraction is poor, use OCR
		if (contentText.trim().length < 150) {
			// Heuristic check
			contentText = await runOcrOnPdf(buffer);
		}

		if (!contentText.trim()) {
			throw new Error("Failed to extract any text from the PDF.");
		}

		// 5. Chunk the extracted text
		const textChunks = chunkText(contentText);

		// 6. Create chunk records first
		const chunkCreationPromises = textChunks.map((text) => {
			return prisma.contentChunk.create({
				data: {
					contentId: contentId,
					chunkText: text,
				},
				select: { id: true, chunkText: true },
			});
		});

		const createdChunks = await prisma.$transaction(chunkCreationPromises);

		// 7. Generate embeddings and store them using raw SQL
		const embeddingUpdatePromises = createdChunks.map(async (chunk) => {
			const embedding = await getGeminiEmbedding(chunk.chunkText);
			await prisma.$executeRaw`UPDATE "ContentChunk" SET embedding = ${embedding}::vector WHERE id = ${chunk.id}`;
		});

		await Promise.all(embeddingUpdatePromises);

		// 8. Finalize: Update status to COMPLETED and save thumbnail
		await prisma.content.update({
			where: { id: contentId },
			data: {
				status: "COMPLETED",
				thumbnail: thumbnail,
			},
		});

		console.log(`Successfully processed and embedded content ID: ${contentId}`);
	} catch (error) {
		console.error(`Failed to process content ID ${contentId}:`, error);
		// Update status to FAILED
		await prisma.content.update({
			where: { id: contentId },
			data: { status: "FAILED" },
		});
	}
}
