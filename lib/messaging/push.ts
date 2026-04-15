import { getMessagingObject } from "@/lib/firebase/client";
import { getToken, onMessage } from "firebase/messaging";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async () => {
  const messaging = await getMessagingObject();
  if (!messaging) return null;

  try {
    console.log("[Push Utility] Requesting notification permission...");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Explicitly register the service worker for maximum reliability
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });

      console.log("[Push Utility] Requesting Token with VAPID key...");
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      
      console.log("[Push Utility] Token generated successfully:", token);
      return token;
    }
    console.log("[Push Utility] Permission denied");
    return null;
  } catch (error) {
    console.error("An error occurred while requesting permission ", error);
    return null;
  }
};

export const onMessageListener = async () => {
    const messaging = await getMessagingObject();
    if (!messaging) return null;

    return new Promise((resolve) => {
        console.log("[Push Utility] Setting up foreground message listener...");
        onMessage(messaging, (payload) => {
            console.log("[Push Utility] Foreground message received:", payload);
            resolve(payload);
        });
    });
};
