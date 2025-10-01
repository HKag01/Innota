import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
	req: Request,
	{ params }: { params: Record<string, string> }
) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);

	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.json(
		{
			subscriptionId: params.id, // safe to use
			plan: "Pro",
			status: "active",
			renews_at: "2025-09-01",
		},
		{ status: 200 }
	);
}
