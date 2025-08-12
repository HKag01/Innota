import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user)
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

	const { oldPassword, newPassword } = await req.json();
	const match = await bcrypt.compare(oldPassword, user.password);
	if (!match)
		return NextResponse.json(
			{ message: "Old password incorrect" },
			{ status: 400 }
		);

	const hashed = await bcrypt.hash(newPassword, 5);
	await prisma.user.update({
		where: { id: user.id },
		data: { password: hashed },
	});

	return NextResponse.json({ message: "Password updated" });
}
