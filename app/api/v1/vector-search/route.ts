// app/api/v1/vector-search/route.ts
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

		// Daily rate limit
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

		// 1️⃣ Embed the query
		const queryEmbedding = await getGeminiEmbedding(query);

		// 2️⃣ Vector search (raw SQL because embedding is Unsupported)
		const results = await prisma.$queryRaw`
  SELECT id, title, description, link, type, "fileName", "createdAt"
  FROM "Content"
  WHERE "userId" = ${user.id}
    AND embedding IS NOT NULL
    ${
			type && type !== "all-memories"
				? Prisma.sql`AND type = ${type}`
				: Prisma.sql``
		}
  ORDER BY embedding <-> ${Prisma.sql`ARRAY[${Prisma.join(
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

		// 3️⃣ Build context
		const contextString = results
			.map(
				(r, i) => `Memory ${i + 1}
Title: ${r.title || ""}
Description: ${r.description || ""}
Type: ${r.type || ""}
Link: ${r.link || ""}
Uploaded: ${r.createdAt?.toISOString() || ""}
`
			)
			.join("\n\n");

		// 4️⃣ Generate Gemini answer
		const prompt = `
You are an assistant answering based only on the following user memories:

${contextString}

Question: "${query}"

Answer using ONLY these memories. Cite memory numbers if possible.
`;

		const aiResp = await ai.models.generateContent({
			model: "gemini-1.5-flash",
			contents: [{ role: "user", parts: [{ text: prompt }] }],
		});

		const answer =
			aiResp.candidates?.[0]?.content?.parts?.[0]?.text ||
			aiResp.text ||
			"No answer generated";

		// 5️⃣ Log search
		await prisma.searchLog.create({ data: { userId: user.id, query } });

		// 6️⃣ Return combined answer + sources
		return NextResponse.json({ answer, content: results });
	} catch (err) {
		console.error("Vector search error:", err);
		return NextResponse.json(
			{ message: "Error performing vector search" },
			{ status: 500 }
		);
	}
}
