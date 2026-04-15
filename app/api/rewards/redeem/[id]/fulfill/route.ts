import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // In a real app, check for operator role
    // const isOperator = decodedToken.role === 'operator';
    // if (!isOperator) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const redemptionRef = adminDb.collection("redemption_requests").doc(id);
    const redemptionDoc = await redemptionRef.get();

    if (!redemptionDoc.exists) {
      return NextResponse.json({ error: "Redemption record not found" }, { status: 404 });
    }

    const data = redemptionDoc.data();
    if (data?.status === 'claimed') {
        return NextResponse.json({ error: "Reward has already been claimed" }, { status: 400 });
    }

    await redemptionRef.update({
      status: 'claimed',
      fulfilledAt: new Date().toISOString(),
      fulfilledBy: decodedToken.uid
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Fulfillment failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
