import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const todayCount = await prisma.content.count({
		where: {
			userId: user.id,
			createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
		},
	});

	return NextResponse.json({ canAddContent: todayCount < 10 });
}
