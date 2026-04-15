import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminMessaging } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    const userRef = adminDb.collection("users").doc(uid);

    // Fetch user doc to get fcmTokens
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const fcmTokens: string[] = userData?.fcmTokens || [];

    console.log(`[Notification Relay] Found ${fcmTokens.length} registered tokens for UID: ${uid}`);

    if (fcmTokens.length === 0) {
        return NextResponse.json({ error: "No registered devices found. Please enable Push Notifications first." }, { status: 400 });
    }

    // Wrap in a message payload
    const message: any = {
        notification: {
            title: "GABAY Verification",
            body: "System Relay Active: Your device is now connected to the GABAY community network."
        },
        data: {
            url: "/resident/settings",
            type: "verification"
        },
        webpush: {
            headers: {
                Urgency: "high"
            },
            notification: {
                icon: "/logo/gabaylogo.png",
                badge: "/logo/gabaylogo.png",
                tag: "gabay-test",
                requireInteraction: true
            },
            fcm_options: {
                link: "/"
            }
        },
        tokens: fcmTokens,
    };

    // Delay for 5 seconds to allow user to minimize window
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Send the message
    const response = await adminMessaging.sendEachForMulticast(message);
    
    console.log(`[Notification Relay] Multicast Results: Successfully sent ${response.successCount}; ${response.failureCount} failed.`);
    
    const tokensToRemove: string[] = [];
    response.responses.forEach((resp, idx) => {
        if (!resp.success) {
            console.error(`[Notification Relay] Token [${idx}] failed:`, resp.error?.code, resp.error?.message);
            if (resp.error?.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(fcmTokens[idx]);
            }
        } else {
            console.log(`[Notification Relay] Token [${idx}] delivery success. (Snippet: ${fcmTokens[idx].substring(0, 10)}...)`);
        }
    });

    // Cleanup failed tokens from Firestore
    if (tokensToRemove.length > 0) {
        console.log(`[Notification Relay] Cleaning up ${tokensToRemove.length} stale tokens...`);
        const remainingTokens = fcmTokens.filter((t: string) => !tokensToRemove.includes(t));
        await userRef.update({
            fcmTokens: remainingTokens
        });
    }

    return NextResponse.json({ 
        success: true, 
        message: `Dispatched to ${response.successCount} device(s).`,
        failures: response.failureCount 
    });

  } catch (error: any) {
    console.error("Test notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
