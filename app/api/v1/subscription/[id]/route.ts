import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const token = req.headers.get("authorization") || "";
	const user = await getUserFromToken(token);
	if (!user) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	// Mock response (replace with Stripe API if needed)
	return NextResponse.json(
		{
			subscriptionId: params.id,
			plan: "Pro",
			status: "active",
			renews_at: "2025-09-01",
		},
		{ status: 200 }
	);
}
