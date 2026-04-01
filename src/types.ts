import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "partner" | "general";

export type UserProfile = {
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  selectedTags?: string[];
  onboardingComplete?: boolean;
  photoURL?: string;
};

export type Category = "all" | "connect" | "growth" | "thrive";

/** Matches gma-mobile-app EventDoc; extended for partner workflow */
export type EventRecord = {
  id: string;
  title: string;
  description: string;
  category: Category;
  address: string;
  image: string;
  type: "free" | "paid";
  dateTime: Timestamp;
  totalTickets: number;
  attendees?: string[];
  memberPrice: number;
  nonMemberPrice: number;
  ticketPrices?: { member: number; nonMember: number };
  approvalStatus?: "pending" | "approved" | "rejected";
  submittedBy?: string;
  rejectionReason?: string;
  interestTags?: string[];
};
