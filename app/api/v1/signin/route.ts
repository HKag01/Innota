import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
	try {
		const { username, password } = await req.json();

		const user = await prisma.user.findUnique({ where: { username } });
		if (!user)
			return NextResponse.json(
				{ message: "Invalid credentials" },
				{ status: 400 }
			);

		const valid = await bcrypt.compare(password, user.password);
		if (!valid)
			return NextResponse.json(
				{ message: "Invalid credentials" },
				{ status: 400 }
			);

		const token = generateToken(user.id);
		return NextResponse.json({ token });
	} catch {
		return NextResponse.json({ message: "Sign in failed" }, { status: 500 });
	}
}
