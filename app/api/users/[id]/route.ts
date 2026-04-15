import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ROLES } from "@/lib/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUid } = await params;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Authorization Check: Admins and Collectors can look up users
    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || (callerData.role !== ROLES.ADMIN && callerData.role !== ROLES.COLLECTOR)) {
      return NextResponse.json({ error: "Forbidden: Access restricted" }, { status: 403 });
    }

    const userDoc = await adminDb.collection("users").doc(targetUid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userDoc.data());
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUid } = await params;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Authorization Check: Only Admins can delete users
    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }


    if (targetUid === decodedToken.uid) {
      return NextResponse.json({ error: "Action Forbidden: Cannot delete own account" }, { status: 400 });
    }

    // 1. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(targetUid);
    } catch (e: any) {
      console.warn("Auth deletion warning:", e.message);
    }

    // 2. Delete from Firestore users collection
    await adminDb.collection("users").doc(targetUid).delete();

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Authorization Check: Only Admins can update operators
    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, phone, department, fleetId, role, isActive } = body;
    
    const updateData: any = { updatedAt: new Date() };
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (fleetId !== undefined) updateData.fleetId = fleetId;
    if (isActive !== undefined) updateData.isActive = isActive;

    await adminDb.collection("users").doc(id).update(updateData);

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
