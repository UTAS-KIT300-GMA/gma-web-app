import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export type PartnerEventRow = {
  id: string;
  title: string;
  description?: string;
  address?: string;
  image?: string;
  dateTime?: Timestamp | null;
  category?: string;
  categories?: string[];
  ticketsSold?: number;
  totalTickets?: number;
  attendees?: string[];
  eventApprovalStatus?: "draft" | "pending" | "approved" | "rejected";
  submittedBy?: string;
  ticketAccess?: "free_for_all" | "members_only";
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