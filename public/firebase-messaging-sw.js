/* Firebase Messaging service worker placeholder.
 * This file must exist at /firebase-messaging-sw.js for web FCM token registration.
 * FCM handles notification display automatically for notification payloads.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
