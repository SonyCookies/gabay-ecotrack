import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ROLES } from "@/lib/roles";

export async function GET() {
  const usersToSeed = [
    { email: "admin@gabay.local", password: "Password123!", role: ROLES.ADMIN, fullName: "System Admin" },
    { email: "operator@gabay.local", password: "Password123!", role: ROLES.OPERATOR, fullName: "HQ Operator" },
    { email: "collector@gabay.local", password: "Password123!", role: ROLES.COLLECTOR, fullName: "Field Collector" },
    { email: "resident@gabay.local", password: "Password123!", role: ROLES.RESIDENT, fullName: "Juan Dela Cruz" },
  ];

  const results = [];

  try {
    for (const user of usersToSeed) {
      let userRecord;
      try {
        // Attempt to create user
        userRecord = await adminAuth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.fullName,
        });
        results.push(`Created: ${user.email}`);
      } catch (e: any) {
        if (e.code === 'auth/email-already-exists') {
          userRecord = await adminAuth.getUserByEmail(user.email);
          results.push(`Already existed: ${user.email}`);
        } else {
          throw e; // Bubble up other errors
        }
      }

      // 2. Build flat data object
      const userData: any = {
        uid: userRecord.uid,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: true,
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add role-specific fields directly to the main doc
      if (user.role === ROLES.RESIDENT) {
        userData.ecoPoints = 0;
      } else if (user.role === ROLES.OPERATOR) {
        userData.lguName = "GABAY LGU";
      } else if (user.role === ROLES.COLLECTOR) {
        userData.status = "standby";
      } else if (user.role === ROLES.ADMIN) {
        userData.department = "Executive Branch";
        userData.phone = "+63 917 123 4567";
      }

      // 3. Save to Firestore (Single collection)
      await adminDb.collection("users").doc(userRecord.uid).set(userData, { merge: true });
    }

    return NextResponse.json({ message: "Seeding complete!", results, passwordUsed: "Password123!" });
  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
