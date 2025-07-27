// Custom Service Worker for Coal India Messaging Push Notifications

// Import the push notification handling
self.addEventListener("push", async (event) => {
  console.log("[Service Worker] Push notification received");

  if (!event.data) {
    console.log("[Service Worker] No data in push event");
    return;
  }

  try {
    // Parse the notification data
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: notificationData } = data;

    // Default options for notifications
    const options = {
      body: body || "You have a new message",
      icon: icon || "/icon-192x192.png",
      badge: badge || "/icon-192x192.png",
      tag: tag || "coal-india-notification",
      data: notificationData || {},
      vibrate: [100, 50, 100],
      requireInteraction: false,
      renotify: true,
      actions: [
        {
          action: "view",
          title: "View",
          icon: "/icons/check.png",
        },
        {
          action: "close",
          title: "Close",
          icon: "/icons/close.png",
        },
      ],
    };

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(
        title || "Coal India Messaging",
        options
      )
    );
  } catch (error) {
    console.error("[Service Worker] Error parsing push data:", error);
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event.action);

  // Close the notification
  event.notification.close();

  // Handle different actions
  if (event.action === "close") {
    // User clicked close, just close the notification
    return;
  }

  // Default action or 'view' action - open the app
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url.includes("/messaging") && "focus" in client) {
            // If messaging page is open, focus it
            return client.focus();
          }
        }

        // If no messaging window is open, open a new one
        if (clients.openWindow) {
          const url = event.notification.data?.url || "/messaging";
          return clients.openWindow(url);
        }
      })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed:", event.notification.tag);
  // You can track notification dismissals here if needed
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Log when the service worker is activated
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(clients.claim());
});
