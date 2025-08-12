import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
	try {
		const { username, password } = await req.json();

		const exists = await prisma.user.findUnique({ where: { username } });
		if (exists) {
			return NextResponse.json(
				{ message: "Username already taken" },
				{ status: 400 }
			);
		}

		const hashed = await bcrypt.hash(password, 5);
		const user = await prisma.user.create({
			data: { username, password: hashed },
		});

		const token = generateToken(user.id);
		return NextResponse.json({ token });
	} catch {
		return NextResponse.json({ message: "Sign up failed" }, { status: 500 });
	}
}
