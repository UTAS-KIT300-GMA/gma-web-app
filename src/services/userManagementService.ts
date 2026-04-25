import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile, UserRole, AccountStatus } from "../types/user-types";

export const getUsers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    ...(docSnap.data() as Omit<UserProfile, "id">),
    id: docSnap.id,
  }));
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    partnerApprovalStatus: AccountStatus;
    phoneNumber: string;
    photoURL: string;
  }>
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, data);
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);
};