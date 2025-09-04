import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	// Get processing status of recent documents
	const recentDocuments = await prisma.content.findMany({
		where: {
			userId: user.id,
			type: "document",
			createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
		},
		select: {
			id: true,
			title: true,
			fileName: true,
			thumbnail: true,
			status: true,
			createdAt: true
		},
		orderBy: { createdAt: "desc" },
		take: 10
	});

	return NextResponse.json({
		canUpload: user.canUploadDocuments,
		recentDocuments
	}, { status: 200 });
}
