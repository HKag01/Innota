import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { getUserFromToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

import { getGeminiEmbedding } from "@/lib/embedding";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
	try {
		const { query, type } = await req.json();
		const token = req.headers.get("authorization");

		if (!token) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const user = await getUserFromToken(token);
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		if (!query?.trim()) {
			return NextResponse.json(
				{ message: "Query is required" },
				{ status: 400 }
			);
		}

		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const searchesToday = await prisma.searchLog.count({
			where: { userId: user.id, createdAt: { gte: todayStart } },
		});
		if (searchesToday >= 10) {
			return NextResponse.json(
				{ message: "Daily search limit reached" },
				{ status: 429 }
			);
		}

		const queryEmbedding = await getGeminiEmbedding(query);

		const results: any[] = await prisma.$queryRaw`
			SELECT
				cc."chunkText",
				c.id,
				c.title,
				c.description,
				c.link,
				c.type,
				c."fileName",
				c.thumbnail,
				c."createdAt"
			FROM "ContentChunk" AS cc
			JOIN "Content" AS c ON cc."contentId" = c.id
			WHERE c."userId" = ${user.id} AND c.status = 'COMPLETED'
			${
				type && type !== "all-memories"
					? Prisma.sql`AND c.type = ${type}`
					: Prisma.sql``
			}
			ORDER BY cc.embedding <-> ${Prisma.sql`ARRAY[${Prisma.join(
				queryEmbedding
			)}]::vector`}
			LIMIT 5
		`;

		if (!results.length) {
			return NextResponse.json({
				answer: "No relevant memories found",
				content: [],
			});
		}

		// 3️⃣ Build context from chunk text for richer answers
		const contextString = results
			.map(
				(r, i) =>
					`Memory ${i + 1} (Source: ${r.fileName || r.title})\n---\n${
						r.chunkText
					}\n---\n`
			)
			.join("\n");

		// 4️⃣ Generate Gemini answer with improved prompt
		const prompt = `You are a helpful 'second brain' assistant. Based ONLY on the following memories, answer the user's question. Be concise and cite the sources used.

Memories:
${contextString}

Question: "${query}"

Answer:`;

		const aiResp = await ai.models.generateContent({
			model: "gemini-2.0-flash",
			contents: [{ role: "user", parts: [{ text: prompt }] }],
		});

		const answer =
			aiResp.candidates?.[0]?.content?.parts?.[0]?.text ||
			aiResp.text ||
			"No answer generated";

		// 5️⃣ Log search
		await prisma.searchLog.create({ data: { userId: user.id, query } });

		// 6️⃣ Return unique content sources (deduplicated by content ID)
		const uniqueContent = Array.from(
			new Map(results.map((item) => [item.id, item])).values()
		);
		return NextResponse.json({ answer, content: uniqueContent });
	} catch (err) {
		console.error("Vector search error:", err);
		return NextResponse.json(
			{ message: "Error performing vector search" },
			{ status: 500 }
		);
	}
}
