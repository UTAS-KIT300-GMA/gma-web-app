import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "partner" | "general";

/** * Account Status for Portal Governance 
 */
export type AccountStatus = "pending_approval" | "approved" | "rejected";

export type UserProfile = {
  // --- Identity Link ---
  partnerID?: string;          // Maps to Firebase UID
  email: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: Timestamp;

  // --- Partner/Org Specific ---
  orgName?: string;            
  abn?: string;                
  representativeName?: string; 
  status?: AccountStatus;      // Controlled by GMA Admin

  // --- General User (Migrant) Specific ---
  firstName?: string;
  lastName?: string;

  // --- Workflow State ---
  selectedTags?: string[];     
  onboardingComplete?: boolean; 
};