import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}
	return NextResponse.json(
		{ canUpload: user.canUploadDocuments },
		{ status: 200 }
	);
}
