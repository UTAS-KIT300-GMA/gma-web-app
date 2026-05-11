import {
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  getDoc,
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
  // All Users' notifications
  | "event_edited"
  | "event_cancelled"

  // Cancellation notifications
  | "event_cancelled_by_partner"
  | "event_cancelled_by_admin"

  // Partner & Admin event submission and approval
  | "event_submitted_for_review"
  | "event_approval_result"
  | "event_reminder_5days"
  | "event_reminder_3days"
  | "partner_approval_result"
  | "partner_sponsor_payment"

  // User reminders
  | "event_reminder_2days"
  | "event_reminder_1day";

type NotificationPayload = {
  kind: NotificationKind;
  title: string;
  body: string;
  targetUserIds: string[];
  data?: Record<string, string>;
};

let swRegistrationPromise: Promise<ServiceWorkerRegistration> | null = null;

/**
 * @summary Registers the Firebase Messaging service worker if not already registered, and returns the registration.
 * This is needed to get the FCM token for push notifications. We register it at the root scope ("/") so it can handle notifications on all pages, 
 * and to ensure it works even if the user registers for notifications from a non-root page.
 */
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

  // Add to notificationQueue for Cloud Functions to process and send out notifications.
  await addDoc(collection(db, "notificationQueue"), {
    ...payload,
    targetUserIds: uniqueTargetUserIds,
    status: "pending",
    createdAt: Timestamp.now(),
  });

  // Also add a copy to each user's notifications subcollection for in-app display and history.
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

// ─── Admin notifications ──────────────────────────────────────────────────────

/**
 * @summary Notifies all admins when a partner submits a new event for review.
 */
export async function notifyAdminsEventSubmitted(
  eventId: string,
  eventTitle: string,
  partnerName: string,
): Promise<void> {
  const adminIds = await getAdminUserIds();
  await queueNotification({
    kind: "event_submitted_for_review",
    title: "New event submitted for review",
    body: `${partnerName} has submitted "${eventTitle}" — tap to review it.`,
    targetUserIds: adminIds,
    data: { eventId },
  });
}

/**
 * @summary Notifies all admins with a list of approved events coming up in 5 days.
 */
export async function notifyAdminsEventReminder5Days(
  events: { eventId: string; eventTitle: string; partnerName: string }[],
): Promise<void> {
  if (events.length === 0) return;
  const adminIds = await getAdminUserIds();
  const eventList = events.map((e) => `• "${e.eventTitle}" by ${e.partnerName}`).join("\n");
  await queueNotification({
    kind: "event_reminder_5days",
    title: `${events.length} event${events.length > 1 ? "s" : ""} coming up in 5 days`,
    body: eventList,
    targetUserIds: adminIds,
    data: { eventId: events[0].eventId },
  });
}

/**
 * @summary Notifies all admins with a list of approved events coming up in 3 days.
 */
export async function notifyAdminsEventReminder3Days(
  events: { eventId: string; eventTitle: string; partnerName: string }[],
): Promise<void> {
  if (events.length === 0) return;
  const adminIds = await getAdminUserIds();
  const eventList = events.map((e) => `• "${e.eventTitle}" by ${e.partnerName}`).join("\n");
  await queueNotification({
    kind: "event_reminder_3days",
    title: `${events.length} event${events.length > 1 ? "s" : ""} starting in 3 days`,
    body: eventList,
    targetUserIds: adminIds,
    data: { eventId: events[0].eventId },
  });
}

// ─── Partner notifications ────────────────────────────────────────────────────

/**
 * @summary Notifies a partner that an admin has edited their event.
 */
export async function notifyPartnerEventEdited(
  partnerId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_edited",
    title: "Your event was updated by admin",
    body: `An admin has made changes to "${eventTitle}". Tap to review the updated details.`,
    targetUserIds: [partnerId],
    data: { eventId },
  });
}

/**
 * @summary Notifies a partner of the approval decision for their partner application.
 */
export async function notifyPartnerApprovalDecision(
  partnerId: string,
  approved: boolean,
): Promise<void> {
  await queueNotification({
    kind: "partner_approval_result",
    title: approved ? "Application approved!" : "Application not approved",
    body: approved
      ? "Welcome! Your partner account is now active. You can start creating and submitting events."
      : "Your partner application wasn't approved this time. Contact support if you have any questions.",
    targetUserIds: [partnerId],
  });
}

/**
 * @summary Notifies a partner of the approval decision for their event submission.
 */
export async function notifyPartnerEventDecision(
  partnerId: string,
  eventId: string,
  eventTitle: string,
  approved: boolean,
  rejectionReason?: string,
): Promise<void> {
  await queueNotification({
    kind: "event_approval_result",
    title: approved ? "Event approved!" : "Event rejected.",
    body: approved
      ? `Great news — "${eventTitle}" has been approved and is now live.`
      : `"${eventTitle}" wasn't approved because${rejectionReason ? `: ${rejectionReason}` : ". Please review the details and resubmit."}`,
    targetUserIds: [partnerId],
    data: { eventId },
  });
}

/**
 * @summary Notifies a partner that their event is coming up in 5 days.
 */
export async function notifyPartnerEventReminder5Days(
  partnerId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_reminder_5days",
    title: "Your event is in 5 days",
    body: `"${eventTitle}" is coming up in 5 days. Time to make sure everything is in order!`,
    targetUserIds: [partnerId],
    data: { eventId },
  });
}

/**
 * @summary Notifies a partner that their event is coming up in 3 days.
 */
export async function notifyPartnerEventReminder3Days(
  partnerId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_reminder_3days",
    title: "Your event starts in 3 days",
    body: `"${eventTitle}" begins in 3 days. Do a final check — is everything ready?`,
    targetUserIds: [partnerId],
    data: { eventId },
  });
}

/**
 * @summary Notifies a partner that a sponsor payment has been processed for their event.
 */
export async function notifyPartnerSponsorPayment(
  partnerId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "partner_sponsor_payment",
    title: "Sponsor payment received",
    body: `A sponsor payment for "${eventTitle}" has been successfully processed.`,
    targetUserIds: [partnerId],
    data: { eventId },
  });
}

// ─── General user notifications ───────────────────────────────────────────────

/**
 * @summary Notifies registered users that an event they signed up for has been edited.
 */
export async function notifyUsersEventEdited(
  userIds: string[],
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_edited",
    title: "Event details updated",
    body: `"${eventTitle}" has some updates. Tap to see the latest details.`,
    targetUserIds: userIds,
    data: { eventId },
  });
}

/**
 * @summary Notifies registered users that an event they signed up for has been cancelled.
 */
export async function notifyUsersEventCancelled(
  userIds: string[],
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_cancelled",
    title: "Event cancelled",
    body: `Unfortunately, "${eventTitle}" has been cancelled. We're sorry for the inconvenience.`,
    targetUserIds: userIds,
    data: { eventId },
  });
}

/**
 * @summary Notifies all admins that a partner has cancelled an event.
 */
export async function notifyAdminsEventCancelled(
  eventId: string,
  eventTitle: string,
  partnerName: string,
): Promise<void> {
  const adminIds = await getAdminUserIds();
  await queueNotification({
    kind: "event_cancelled_by_partner",
    title: "Event cancelled by partner",
    body: `${partnerName} has cancelled "${eventTitle}".`,
    targetUserIds: adminIds,
    data: { eventId },
  });
}

/**
 * @summary Notifies a partner that an admin has cancelled their event.
 */
export async function notifyPartnerEventCancelled(
  partnerId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_cancelled_by_admin",
    title: "Your event was cancelled by admin",
    body: `An admin has cancelled "${eventTitle}".`,
    targetUserIds: [partnerId],
    data: { eventId },
  });
}

/**
 * @summary Reminds a registered user their event is coming up in 2 days.
 */
export async function notifyUserEventReminder2Days(
  userId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_reminder_2days",
    title: "Your event is in 2 days",
    body: `"${eventTitle}" is happening in 2 days. We're looking forward to seeing you there!`,
    targetUserIds: [userId],
    data: { eventId },
  });
}

/**
 * @summary Reminds a registered user their event is tomorrow.
 */
export async function notifyUserEventReminder1Day(
  userId: string,
  eventId: string,
  eventTitle: string,
): Promise<void> {
  await queueNotification({
    kind: "event_reminder_1day",
    title: "See you tomorrow!",
    body: `"${eventTitle}" is tomorrow. Don't forget — we can't wait to see you!`,
    targetUserIds: [userId],
    data: { eventId },
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * @summary Returns IDs of all users who have booked a given event.
 * Checks the attendees array on the event doc first; falls back to querying
 * the users/{uid}/bookings subcollection.
 */
export async function getEventAttendeeIds(eventId: string): Promise<string[]> {
  const q = query(collectionGroup(db, "bookings"), where("eventId", "==", eventId));
  const snap = await getDocs(q);
  return [...new Set(snap.docs.map((d) => d.ref.parent.parent!.id))];
}

/**
 * @summary Returns IDs of all users who have bookmarked a given event.
 * Queries the users/{uid}/bookmarks subcollection via collectionGroup.
 * Requires a Firestore collection-group index on bookmarks.eventId.
 */
export async function getEventBookmarkedUserIds(eventId: string): Promise<string[]> {
  const q = query(collectionGroup(db, "bookmarks"), where("eventId", "==", eventId));
  const snap = await getDocs(q);
  return [...new Set(snap.docs.map((d) => d.ref.parent.parent!.id))];
}

/**
 * @summary Returns the union of booked and bookmarked user IDs for a given event.
 */
export async function getEventInterestedUserIds(eventId: string): Promise<string[]> {
  const [booked, bookmarked] = await Promise.all([
    getEventAttendeeIds(eventId),
    getEventBookmarkedUserIds(eventId),
  ]);
  return [...new Set([...booked, ...bookmarked])];
}

async function getPartnerName(uid?: string): Promise<string> {
  if (!uid) return "A partner";
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return "A partner";
    const d = snap.data();
    return d.orgName || `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() || "A partner";
  } catch {
    return "A partner";
  }
}

/**
 * @summary Checks for approved events in the 5-day and 3-day windows and sends
 * reminder notifications to admins and the submitting partner. Marks each event
 * so reminders are only sent once.
 */
export async function checkAndSendEventReminders(): Promise<void> {
  const now = Timestamp.now();

  const cutoff = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(23, 59, 59, 999);
    return Timestamp.fromDate(d);
  };

  async function processAdminPartnerWindow(withinDays: number, kind: "5days" | "3days") {
    const sentField = kind === "5days" ? "reminder5daySent" : "reminder3daySent";
    const q = query(
      collection(db, "events"),
      where("eventApprovalStatus", "==", "approved"),
      where("dateTime", ">=", now),
      where("dateTime", "<=", cutoff(withinDays)),
    );
    const snap = await getDocs(q);
    const unsent = snap.docs.filter((d) => !d.data()[sentField]);
    if (unsent.length === 0) return;

    const events = await Promise.all(
      unsent.map(async (d) => ({
        eventId: d.id,
        eventTitle: d.data().title as string,
        partnerName: await getPartnerName(d.data().submittedBy),
        submittedBy: d.data().submittedBy as string | undefined,
      })),
    );

    if (kind === "5days") {
      await notifyAdminsEventReminder5Days(events);
      await Promise.all(
        events
          .filter((e) => e.submittedBy)
          .map((e) => notifyPartnerEventReminder5Days(e.submittedBy!, e.eventId, e.eventTitle)),
      );
    } else {
      await notifyAdminsEventReminder3Days(events);
      await Promise.all(
        events
          .filter((e) => e.submittedBy)
          .map((e) => notifyPartnerEventReminder3Days(e.submittedBy!, e.eventId, e.eventTitle)),
      );
    }

    const batch = writeBatch(db);
    unsent.forEach((d) => batch.update(d.ref, { [sentField]: true }));
    await batch.commit();
  }

  async function processUserWindow(withinDays: number, kind: "2days" | "1day") {
    const sentField = kind === "2days" ? "userReminder2daySent" : "userReminder1daySent";
    const notifyFn = kind === "2days" ? notifyUserEventReminder2Days : notifyUserEventReminder1Day;
    const q = query(
      collection(db, "events"),
      where("eventApprovalStatus", "==", "approved"),
      where("dateTime", ">=", now),
      where("dateTime", "<=", cutoff(withinDays)),
    );
    const snap = await getDocs(q);
    const unsent = snap.docs.filter((d) => !d.data()[sentField]);
    if (unsent.length === 0) return;

    await Promise.all(
      unsent.map(async (d) => {
        const eventId = d.id;
        const title = d.data().title as string;
        const attendeeIds = await getEventAttendeeIds(eventId);
        if (attendeeIds.length > 0) {
          await Promise.all(attendeeIds.map((uid) => notifyFn(uid, eventId, title)));
        }
      }),
    );

    const batch = writeBatch(db);
    unsent.forEach((d) => batch.update(d.ref, { [sentField]: true }));
    await batch.commit();
  }

  await processAdminPartnerWindow(5, "5days");
  await processAdminPartnerWindow(3, "3days");
  await processUserWindow(2, "2days");
  await processUserWindow(1, "1day");
}

/**
 * @summary Uses role to skip token registration for non-portal users.
 */
export function canReceivePortalPush(role: UserRole | undefined): boolean {
  return role === "admin" || role === "partner";
}
