import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Generate an embedding from Gemini for the given text.
 * Handles variations in Gemini API response shape.
 */
export async function getGeminiEmbedding(text: string): Promise<number[]> {
	if (!text?.trim()) throw new Error("Text is required for embedding");

	const resp = await ai.models.embedContent({
		model: "models/text-embedding-004",
		contents: [{ role: "user", parts: [{ text }] }],
	});

	const rawValues =
		(resp as any)?.embedding?.values ||
		(resp as any)?.embeddings?.[0]?.values ||
		null;

	if (!Array.isArray(rawValues)) {
		console.warn("No embedding values found:", resp);
		throw new Error("No embedding returned");
	}

	const embedding = rawValues.map(Number);

	if (
		embedding.length !== 768 ||
		embedding.some((x) => typeof x !== "number" || Number.isNaN(x))
	) {
		console.warn("Invalid embedding generated:", embedding.length);
		throw new Error("Invalid embedding returned");
	}

	return embedding;
}
