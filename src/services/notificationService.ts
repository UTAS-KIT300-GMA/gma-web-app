import {
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, getFirebaseMessaging } from "../firebase";
import type { UserRole } from "../types/user-types";

type NotificationKind =
  | "partner_approval_result"
  | "event_submitted_for_review"
  | "event_approval_result";

type NotificationPayload = {
  kind: NotificationKind;
  title: string;
  body: string;
  targetUserIds: string[];
  data?: Record<string, string>;
};

let swRegistrationPromise: Promise<ServiceWorkerRegistration> | null = null;

async function ensureMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (swRegistrationPromise) return swRegistrationPromise;
  swRegistrationPromise = navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" },
  );

  return swRegistrationPromise;
}

/**
 * @summary Requests browser notification permission and stores FCM token on the user profile.
 */
export async function registerUserFcmToken(userId: string): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("Missing VITE_FIREBASE_VAPID_KEY, FCM token not registered.");
    return;
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) return;
  const serviceWorkerRegistration =
    "serviceWorker" in navigator ? await ensureMessagingServiceWorker() : undefined;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });
  if (!token) return;

  await updateDoc(doc(db, "users", userId), {
    fcmTokens: arrayUnion(token),
    fcmTokenUpdatedAt: Timestamp.now(),
  });
}

/**
 * @summary Pushes a notification job to Firestore for Cloud Functions delivery.
 */
export async function queueNotification(payload: NotificationPayload): Promise<void> {
  if (payload.targetUserIds.length === 0) return;

  const uniqueTargetUserIds = [...new Set(payload.targetUserIds)];

  await addDoc(collection(db, "notificationQueue"), {
    ...payload,
    targetUserIds: uniqueTargetUserIds,
    status: "pending",
    createdAt: Timestamp.now(),
  });

  const batch = writeBatch(db);
  uniqueTargetUserIds.forEach((userId) => {
    const notifRef = doc(collection(db, "users", userId, "notifications"));
    batch.set(notifRef, {
      kind: payload.kind,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      read: false,
      createdAt: Timestamp.now(),
    });
  });
  await batch.commit();
}

/**
 * @summary Fetches all admin user IDs to target approval requests.
 */
export async function getAdminUserIds(): Promise<string[]> {
  const q = query(collection(db, "users"), where("role", "==", "admin"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

export async function notifyAdminsEventSubmitted(
  eventId: string,
  eventTitle: string,
  partnerName: string,
): Promise<void> {
  const adminIds = await getAdminUserIds();
  await queueNotification({
    kind: "event_submitted_for_review",
    title: "New event pending approval",
    body: `${partnerName} submitted "${eventTitle}" for review.`,
    targetUserIds: adminIds,
    data: { eventId },
  });
}

export async function notifyPartnerApprovalDecision(
  partnerId: string,
  approved: boolean,
): Promise<void> {
  await queueNotification({
    kind: "partner_approval_result",
    title: approved ? "Partner application approved" : "Partner application rejected",
    body: approved
      ? "Your partner account has been approved."
      : "Your partner account application has been rejected.",
    targetUserIds: [partnerId],
  });
}

export async function notifyPartnerEventDecision(
  partnerId: string,
  eventId: string,
  eventTitle: string,
  approved: boolean,
  rejectionReason?: string,
): Promise<void> {
  await queueNotification({
    kind: "event_approval_result",
    title: approved ? "Event approved" : "Event rejected",
    body: approved
      ? `Your event "${eventTitle}" has been approved.`
      : `Your event "${eventTitle}" was rejected${rejectionReason ? `: ${rejectionReason}` : "."}`,
    targetUserIds: [partnerId],
    data: { eventId },
  });
}

/**
 * @summary Uses role to skip token registration for non portal users.
 */
export function canReceivePortalPush(role: UserRole | undefined): boolean {
  return role === "admin" || role === "partner";
}
