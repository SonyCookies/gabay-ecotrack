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
    
    // Authorization Check: Only Admins can list users
    const callerDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    
    if (!callerData || callerData.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse query params for role filtering
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");

    let query: any = adminDb.collection("users");
    
    if (roleParam) {
      query = query.where("role", "==", roleParam);
    }

    const snapshot = await query.orderBy("createdAt", "desc").get();
    const users = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure date objects are serialized
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("List users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
