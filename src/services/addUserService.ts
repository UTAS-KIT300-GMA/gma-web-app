import { initializeApp, deleteApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db, firebaseConfig } from "../firebase";
import type { UserRole, AccountStatus } from "../types/user-types";

export type AddUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  dateOfBirth: string;
  phoneNumber: string;
  password: string;
  photoURL?: string;
};

export async function createUserProfile(input: AddUserInput) {
  const secondaryApp = initializeApp(firebaseConfig, `create-user-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email,
      input.password,
    );

    const status: AccountStatus =
      input.role === "partner" ? "pending_approval" : "approved";

    await setDoc(doc(db, "users", credential.user.uid), {
      id: credential.user.uid,
      partnerId: credential.user.uid,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: input.role,
      partnerApprovalStatus: status,
      dateOfBirth: input.dateOfBirth,
      phoneNumber: input.phoneNumber,
      photoURL: input.photoURL || "",
      onboardingComplete: input.role === "admin" || input.role === "general",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await signOut(secondaryAuth);
  } finally {
    await deleteApp(secondaryApp);
  }
}