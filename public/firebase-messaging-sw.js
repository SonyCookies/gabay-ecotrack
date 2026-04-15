// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "[GCP_API_KEY]",
  authDomain: "gabay-ecotrack.firebaseapp.com",
  projectId: "gabay-ecotrack",
  storageBucket: "gabay-ecotrack.firebasestorage.app",
  messagingSenderId: "1008002773857",
  appId: "1:1008002773857:web:fc745487cdb2a06e7d8b20"
});

const messaging = firebase.messaging();

// Handle Background Messages (Firebase High-Level SDK)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] onBackgroundMessage received:', payload);
  
  if (payload.notification) {
    const notificationTitle = payload.notification.title || 'GABAY Update';
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/logo/gabaylogo.png',
      data: payload.data, // Preserve custom data
      tag: 'gabay-alert' // Group notifications
    };

    console.log('[firebase-messaging-sw.js] Displaying SDK notification:', notificationTitle);
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// RAW PUSH LISTENER (Low-Level Fallback)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Raw Push Event Received:', event);
  
  if (!event.data) {
    console.warn('[firebase-messaging-sw.js] Push event has no data.');
    return;
  }

  // If the high-level SDK doesn't handle it, we might want to parse it here
  // But usually onBackgroundMessage is enough if initialized correctly.
  // This listener acts as a definitive proof that the browser received the signal.
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      // Otherwise, open a new window
      return clients.openWindow('/');
    })
  );
});