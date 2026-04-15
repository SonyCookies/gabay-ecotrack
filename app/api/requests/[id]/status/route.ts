import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendPickupCompleteEmail } from "@/lib/email";
import { WASTE_TYPE_LABELS } from "@/lib/db/waste-labels";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if user is collector or operator (simplified for now)
    // In a real app, you'd check roles
    
    const body = await request.json();
    const { status, additionalData } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const requestRef = adminDb.collection("pickup_requests").doc(requestId);
    const updateData: any = { 
      status,
      updatedAt: new Date().toISOString()
    };

    if (additionalData?.scheduledDate) {
      // Convert it back to a Date if it's passed as seconds/nanos or ISO
      updateData.scheduledDate = new Date(additionalData.scheduledDate);
    }
    
    if (additionalData?.rating) {
      updateData.rating = additionalData.rating;
    }

    // Capture data needed for the email before the transaction closes
    let emailResidentId: string | undefined;
    let emailWasteType: string = "General";

    // Use a transaction for atomic update of request and user points
    await adminDb.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error("Request not found");
      }

      const requestData = requestDoc.data();
      emailWasteType = requestData?.wasteType ?? "general";
      transaction.update(requestRef, updateData);

      // Award points if collected
      if (status === 'collected' && additionalData?.rating?.score) {
        const residentId = requestData?.residentId;
        emailResidentId = residentId;
        if (residentId) {
          const userRef = adminDb.collection("users").doc(residentId);
          transaction.update(userRef, {
            points: FieldValue.increment(additionalData.rating.score)
          });

          // Create activity record for the resident's ledger
          const activityRef = adminDb.collection("point_activities").doc();
          transaction.set(activityRef, {
            residentId,
            requestId,
            type: 'pickup',
            amount: additionalData.rating.score,
            rating: additionalData.rating.score,
            criteria: additionalData.rating.criteria || [],
            description: `Waste Collection (${additionalData.rating.score === 3 ? 'Best' : additionalData.rating.score === 2 ? 'Good' : 'Ok'})`,
            status: 'completed',
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    // --- Send pickup-complete email (non-blocking) ---
    if (status === 'collected' && emailResidentId && additionalData?.rating?.score) {
      try {
        // Fetch resident email + display name from Firebase Auth
        const userRecord = await adminAuth.getUser(emailResidentId);
        const residentEmail = userRecord.email;
        const residentName = userRecord.displayName ?? "Resident";

        if (residentEmail) {
          const wasteLabel =
            (WASTE_TYPE_LABELS as any)[emailWasteType]?.label ?? emailWasteType;

          await sendPickupCompleteEmail({
            to: residentEmail,
            residentName,
            wasteType: wasteLabel,
            score: additionalData.rating.score,
            criteria: additionalData.rating.criteria ?? {
              segregated: false,
              clean: false,
              packaged: false,
            },
            completedAt: new Date().toISOString(),
          });

          console.log(`[Email] Pickup-complete email sent to ${residentEmail}`);
        }
      } catch (emailErr: any) {
        // Email failure must NOT fail the API response — pickup is already saved.
        console.error("[Email] Failed to send pickup-complete email:", emailErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating request status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
