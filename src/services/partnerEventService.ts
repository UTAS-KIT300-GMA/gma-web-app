import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  collectionGroup,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { EventRecord } from "../types/event-types";

export type PartnerEventRow = EventRecord & { id: string };
export type EventAttendeeRow = {
  userId: string;
  name: string;
  email?: string;
  ticketsOrdered: number;
};

function sortEventsByDateDesc(events: PartnerEventRow[]): PartnerEventRow[] {
  return [...events].sort((a, b) => {
    const ta = a.dateTime?.toMillis?.() ?? 0;
    const tb = b.dateTime?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

export function getRegistrationCount(event: PartnerEventRow): number {
  if (typeof event.ticketsSold === "number") return event.ticketsSold;
  if (Array.isArray(event.attendees)) return event.attendees.length;
  return 0;
}

export async function getPartnerEvents(
  partnerId: string,
): Promise<PartnerEventRow[]> {
  const q = query(
    collection(db, "events"),
    where("submittedBy", "==", partnerId),
  );

  const snap = await getDocs(q);

  const rows: PartnerEventRow[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<PartnerEventRow, "id">),
  }));

  return sortEventsByDateDesc(rows);
}

export async function deletePartnerEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, "events", eventId));
}

export async function getEventAttendees(
  eventId: string,
): Promise<EventAttendeeRow[]> {
  const bookingsQuery = query(
    collectionGroup(db, "bookings"),
    where("eventId", "==", eventId),
  );

  const bookingSnap = await getDocs(bookingsQuery);

  const attendees = await Promise.all(
    bookingSnap.docs.map(async (bookingDoc) => {
      const bookingData = bookingDoc.data();

      const userRef = bookingDoc.ref.parent.parent;
      const userId = userRef?.id ?? "";

      let name = "Unknown user";
      let email = "";

      if (userRef) {
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          name =
            userData.displayName ||
            `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim() ||
            userData.name ||
            "Unknown user";

          email = userData.email || "";
        }
      }

      return {
        userId,
        name,
        email,
        ticketsOrdered:
          bookingData.ticketsOrdered ||
          bookingData.ticketCount ||
          bookingData.quantity ||
          1,
      };
    }),
  );

  return attendees;
}