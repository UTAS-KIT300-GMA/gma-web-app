import type { Timestamp } from "firebase/firestore";

export const CATEGORIES = ["connect", "grow", "thrive"] as const;
export type Category = (typeof CATEGORIES)[number] | "all";

/** * Matches gma-mobile-app EventDoc; extended for Web Portal workflow
 */
export type EventRecord = {
  eventId: string;
  title: string;
  description: string;
  category: Category;
  categories?: Category[];
  address: string;
  image: string;
  type: "free" | "paid";
  dateTime: Timestamp;
  totalTickets: number;
  attendees?: string[];
  memberPrice: number;
  ticketAccess?: "free_for_all" | "members_only";
  ticketsSold?: number;
  status?: string;
  nonMemberPrice: number;
  ticketPrices?: {
    member: number;
    nonMember: number;
  };

  // --- Admin & Partner Portal Workflow ---
  approvalStatus?: "pending" | "approved" | "rejected";
  submittedBy?: string; // The partnerId of the creator
  rejectionReason?: string; // Feedback for the partner
  interestTags?: string[];
};
