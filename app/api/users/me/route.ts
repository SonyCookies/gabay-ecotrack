import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ROLES } from "@/lib/roles";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    // Fetch user doc directly from users collection (Simplified)
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const data = userDoc.data() || {};
    return NextResponse.json({
      ...data,
      displayName: data.fullName // Sync frontend expectations
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await request.json();
    const { displayName, phone, department, address, notifications, fcmToken } = body;

    // Build update object directly for the user document
    const updateData: any = { 
      uid, 
      updatedAt: new Date() 
    };
    
    if (displayName !== undefined) updateData.fullName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (address !== undefined) updateData.address = address;
    if (notifications !== undefined) updateData.notifications = notifications;

    const userRef = adminDb.collection("users").doc(uid);

    if (fcmToken) {
      // Use Firebase Admin SDK to add token to array uniquely
      await userRef.update({
        fcmTokens: Array.from(new Set([...((await userRef.get()).data()?.fcmTokens || []), fcmToken]))
      });
    }

    // Use .set with { merge: true } for robustness
    await userRef.set(updateData, { merge: true });

    // Return the updated data
    const updatedUserDoc = await adminDb.collection("users").doc(uid).get();
    const result = updatedUserDoc.data() || {};

    return NextResponse.json({
      ...result,
      displayName: result.fullName
    });

  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
