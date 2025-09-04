import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";
import { processPdf } from "@/lib/jobs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function GET(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const content = await prisma.content.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			description: true,
			type: true,
			link: true,
			fileName: true,
			thumbnail: true,
			status: true,
			createdAt: true,
		},
	});
	return NextResponse.json({ content });
}

// ---------------- Helper: Generate Title & Description ----------------
async function generateTitleDescription(content: string) {
	const prompt = `
Summarize the following content:
1. Provide a short, clear TITLE (max 8 words)
2. Provide a concise DESCRIPTION (1–2 sentences)

Content:
${content.slice(0, 2000)}

Respond ONLY as JSON: { "title": "...", "description": "..." }
`;

	try {
		const genResp = await ai.models.generateContent({
			model: "gemini-1.5-flash",
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			config: { responseMimeType: "application/json" },
		});

		let jsonText =
			genResp.candidates?.[0]?.content?.parts?.[0]?.text ||
			genResp.text ||
			"{}";

		jsonText = jsonText
			.replace(/^```[a-zA-Z]*\n?/, "") // removes opening triple backticks + optional language
			.replace(/```/g, "") // removes all other triple backticks
			.trim();

		let parsed;
		try {
			parsed = JSON.parse(jsonText);
		} catch {
			parsed = { title: "Untitled Memory", description: content.slice(0, 200) };
		}

		return {
			title:
				typeof parsed.title === "string" ? parsed.title : "Untitled Memory",
			description:
				typeof parsed.description === "string"
					? parsed.description
					: content.slice(0, 200),
		};
	} catch (err) {
		console.warn("Title/description generation failed:", err);
		return { title: "Untitled Memory", description: content.slice(0, 200) };
	}
}

// ---------------- Helper: Extract Remote PDF Text ----------------
async function extractPdfTextFromUrl(url: string) {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch PDF from URL: ${url}`);
	}
	const buffer = Buffer.from(await res.arrayBuffer());
	const data = await pdf(buffer);
	return data.text || "";
}

export async function POST(req: Request) {
	try {
		const token = req.headers.get("authorization") || "";
		const user = await getUserFromToken(token);
		if (!user)
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

		const {
			type,
			link,
			fileName,
			description: userDesc,
			title: userTitle,
			noteContent,
		} = await req.json();

		// ---------- Rate limit ----------
		const todayCount = await prisma.content.count({
			where: {
				userId: user.id,
				createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
			},
		});
		if (todayCount >= 10) {
			return NextResponse.json(
				{ message: "Daily limit reached" },
				{ status: 429 }
			);
		}

		// ---------- Handle different content types ----------
		let tempTitle = userTitle || fileName || "New Memory";
		let tempDescription =
			userDesc || "This memory is currently being processed.";

		// For non-document types, generate title/description immediately
		if (type !== "document") {
			let contentText = userDesc || "";
			if (type === "note" && noteContent) {
				contentText = noteContent;
			}
			if (!contentText.trim()) {
				contentText = fileName || link || "Untitled";
			}

			if (!userTitle || !userDesc) {
				const generated = await generateTitleDescription(contentText);
				if (!userTitle) tempTitle = generated.title;
				if (!userDesc) tempDescription = generated.description;
			}
		}

		// ---------- Create DB row with PENDING status for documents ----------
		const content = await prisma.content.create({
			data: {
				type,
				link,
				fileName,
				description: tempDescription,
				title: tempTitle,
				userId: user.id,
				status: type === "document" ? "PENDING" : "COMPLETED",
			},
		});

		// ---------- Trigger background processing for documents ----------
		if (type === "document" && link) {
			// Don't await - let it run in background
			processPdf(content.id, link).catch((error) => {
				console.error(
					`Background PDF processing failed for ${content.id}:`,
					error
				);
			});
		}

		// ---------- Increment count ----------
		await prisma.user.update({
			where: { id: user.id },
			data: { contentUploadCount: { increment: 1 } },
		});

		// ---------- Return appropriate response ----------
		if (type === "document") {
			return NextResponse.json(
				{
					message: "Document upload received and is being processed.",
					content,
				},
				{ status: 202 } // 202 Accepted
			);
		}

		return NextResponse.json(content);
	} catch (error) {
		console.error("Error handling /content POST:", error);
		return NextResponse.json(
			{ message: "Error saving content" },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const { contentId } = await req.json();
	const existing = await prisma.content.findUnique({
		where: { id: contentId },
	});
	if (!existing || existing.userId !== user.id) {
		return NextResponse.json(
			{ message: "Not found or forbidden" },
			{ status: 404 }
		);
	}
	await prisma.content.delete({ where: { id: contentId } });
	return NextResponse.json({ success: true });
}
