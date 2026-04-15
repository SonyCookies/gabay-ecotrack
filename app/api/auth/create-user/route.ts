import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ROLES } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    // SECURITY: Ensure the requester is an authorized admin/operator!
    // e.g. verify an authorization token here before proceeding.
    
    const body = await request.json();
    const { email, password, fullName, role, profileData } = body;

    if (![ROLES.OPERATOR, ROLES.COLLECTOR].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // 1. Create auth user
    const userRecord = await adminAuth.createUser({
      email,
      password, // Temporary password
      displayName: fullName,
    });

    // 2. Insert main user (Flat document)
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      fullName,
      email,
      role,
      isVerified: false,
      isActive: true,
      mustChangePassword: true, // They must change on first login
      createdAt: new Date(),
      updatedAt: new Date(),
      ...profileData, // e.g. lguName or fleet identifiers
    });

    return NextResponse.json({ message: "User created successfully", uid: userRecord.uid });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
