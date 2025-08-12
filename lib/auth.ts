import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

export function generateToken(userId: string) {
	return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export async function getUserFromToken(token?: string) {
	if (!token) return null;
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
			userId: string;
		};
		return await prisma.user.findUnique({ where: { id: decoded.userId } });
	} catch {
		return null;
	}
}
