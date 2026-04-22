import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile, AccountStatus } from "../types/user-types";

/**
 * @summary Fetches all user profiles with a pending_approval status from Firestore.
 */
export const getPendingPartnerApprovals = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, "users");
    
    const q = query(usersRef, where("partnerApprovalStatus", "==", "pending_approval"));

    const querySnapshot = await getDocs(q);

    // DEBUG: This will tell us if Firestore found anything at all
    console.log('Firestore Query: Found ${querySnapshot.size} pending users.');

    return querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id, // This captures the UID from the document name
      } as UserProfile;
    });
  } catch (error) {
    console.error("Error in getPendingPartnerApprovals:", error);
    throw error;
  }
};

/**
 * @summary Updates a partner's approval status to approved in Firestore.
 * @param userId - The unique identifier of the partner user to approve.
 */
export const approvePartner = async (userId: string): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { partnerApprovalStatus: "approved" as AccountStatus });
};

/**
 * @summary Updates a partner's approval status to rejected in Firestore.
 * @param userId - The unique identifier of the partner user to reject.
 */
export const rejectPartner = async (userId: string): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { partnerApprovalStatus: "rejected" as AccountStatus });
};