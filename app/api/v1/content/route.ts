import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const content = await prisma.content.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
	});
	return NextResponse.json({ content });
}

export async function POST(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const { type, link, fileName, description } = await req.json();

	// DAILY LIMIT logic
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

	// Uncomment to block document type by canUploadDocuments
	// if (type === "document" && !user.canUploadDocuments) {
	//   return NextResponse.json({ message: "Document upload not allowed" }, { status: 403 });
	// }

	const content = await prisma.content.create({
		data: {
			type,
			link,
			fileName,
			description,
			userId: user.id,
		},
	});

	await prisma.user.update({
		where: { id: user.id },
		data: { contentUploadCount: { increment: 1 } },
	});

	return NextResponse.json(content);
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
