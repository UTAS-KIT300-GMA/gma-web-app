import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile, AccountStatus } from "../types/user-types";

export const getPendingPartnerApprovals = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, "users");
    
    const q = query(usersRef, where("partherApprovalStatus", "==", "pending_approval"));

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

export const approvePartner = async (userId: string): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { partnerApprovalStatus: "approved" as AccountStatus });
};

export const rejectPartner = async (userId: string): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { partnerApprovalStatus: "rejected" as AccountStatus });
};