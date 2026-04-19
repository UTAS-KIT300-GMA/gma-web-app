import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "partner" | "general";
export type AccountStatus = "pending_approval" | "approved" | "rejected";

export interface UserProfile {
  // --- Stage 1: Auth Only ---
  // (No Firestore document exists yet until email is verified)

  // --- Stage 2: The Application (Core Identity & Legal) ---
  id: string;
  partnerId?: string;          // Maps to Firebase UID
  email: string;
  role: UserRole;
  partnerApprovalStatus: AccountStatus;       
  applicationAt?: Timestamp;   // When they submitted the Stage 2 form
  createdAt: Timestamp;        // When the document was first created
  
  // Organization Details
  orgName?: string;
  orgType?: string;            
  abn?: string;
  address?: string;            // Physical/Business address
  
  // Representative Contact (Raw data, no derived full name)
  firstName?: string;
  lastName?: string;
  position?: string;           // Title (e.g., Manager, Director)
  phoneNumber?: string;

  // --- Stage 3: Activation & Branding (Post-Approval) ---
  onboardingComplete: boolean; 
  photoURL?: string;           // Org Logo or Profile Image
  missionStatement?: string;   // Refined Description
  
  // Nested Social Media Map (All Optional)
  socials?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    snapchat?: string;
    linkedin?: string;
    twitter?: string;
  };

  // --- Workflow & Extras ---
  selectedTags?: string[];     // Interests (Migrant) or Categories (Partner)
  updatedAt?: Timestamp;       // Tracks last profile edit
}
