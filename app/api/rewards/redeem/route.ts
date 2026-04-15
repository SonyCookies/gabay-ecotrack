import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const residentId = decodedToken.uid;
    const residentName = decodedToken.name || "Resident";

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(residentId);
    const rewardRef = adminDb.collection("reward_items").doc(itemId);

    // Run transaction
    await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const rewardDoc = await transaction.get(rewardRef);

      if (!userDoc.exists) throw new Error("User profile not found.");
      if (!rewardDoc.exists) throw new Error("Reward item no longer exists.");

      const userData = userDoc.data();
      const rewardData = rewardDoc.data();

      const userPoints = userData?.points || 0;
      const itemCost = rewardData?.cost || 0;
      const itemStock = rewardData?.stock || 0;

      if (userPoints < itemCost) {
        throw new Error(`Insufficient points. You need ${itemCost - userPoints} more.`);
      }

      if (itemStock <= 0) {
        throw new Error("This item is currently out of stock.");
      }

      // 1. Deduct user points
      transaction.update(userRef, {
        points: FieldValue.increment(-itemCost)
      });

      // 2. Deduct item stock
      transaction.update(rewardRef, {
        stock: FieldValue.increment(-1)
      });

      // 3. Create point activity record
      const activityRef = adminDb.collection("point_activities").doc();
      transaction.set(activityRef, {
        residentId,
        type: 'redemption',
        amount: -itemCost,
        description: `Claimed ${rewardData?.name}`,
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      // 4. Create redemption request record (for operator visibility)
      const redemptionRef = adminDb.collection("redemption_requests").doc();
      transaction.set(redemptionRef, {
        residentId,
        residentName,
        itemId,
        itemName: rewardData?.name,
        itemCategory: rewardData?.category,
        cost: itemCost,
        status: 'completed', // Auto-approved
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Redemption transaction failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
