import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
// Note: Depending on your aliases setup, you might need to use relative paths if `@/` doesn't work.
import { ROLES } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, mobileNumber, ...profileData } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: mobileNumber,
    });

    // 2. Create flat user document (Single collection)
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      fullName,
      email,
      mobileNumber: mobileNumber || null,
      role: ROLES.RESIDENT, // Forced to resident
      isVerified: false,
      isActive: true,
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ecoPoints: 0,
      ...profileData, // e.g. region, province, city
    });

    return NextResponse.json({ message: "Registration successful", uid: userRecord.uid });
  } catch (error: any) {
    console.error("Registration edge route error:", error);
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
