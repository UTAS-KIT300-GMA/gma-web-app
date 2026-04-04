import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  deleteUser, 
  type User
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase";

// Ensure these imports match your actual file structure
import type { PartnerRegistrationData, RegisterPartnerResponse } from "../types/auth-types";
import type { UserProfile } from "../types/user-types";

/**
 * @summary Registers a new Partner Organization and initializes their Firestore profile.
 * Implements a "Try-Catch-Rollback" pattern to maintain database consistency.
 */
export const registerPartner = async (
  data: PartnerRegistrationData
): Promise<RegisterPartnerResponse> => {
  let user: User | null = null;

  try {
    // 1. Create Auth Credentials
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    user = cred.user;

    // 2. Prepare Profile Document (Strictly Typed)
    const userRef = doc(db, "users", user.uid); 

    // We use a partial of UserProfile to ensure keys match your Model
    const profileData: Partial<UserProfile> = {
      partnerID: user.uid,
      email: data.email.toLowerCase().trim(),
      orgName: data.orgName.trim(),
      abn: data.abn.trim(),
      representativeName: data.representativeName.trim(),
      role: "partner",
      status: "pending_approval",
      onboardingComplete: false,
      createdAt: serverTimestamp() as any, // Cast to any because serverTimestamp() is a FieldValue
    };

    await setDoc(userRef, profileData);

    // 3. Trigger Email Verification
    await sendEmailVerification(user);

    return { success: true, user };

  } catch (e) {
    // 4. Atomic Rollback: If Firestore fails, remove the Auth account
    // This prevents "Ghost Accounts" in your Firebase Console.
    if (user) {
      console.warn("Rolling back: Deleting orphaned Auth user after Firestore failure.");
      await deleteUser(user);
    }
    throw e;
  }
};

/**
 * @summary Finalizes the partner profile after the Activation Wizard.
 */
export const completePartnerOnboarding = async (
  uid: string, 
  onboardingData: Partial<UserProfile>
) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...onboardingData,
      onboardingComplete: true, 
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (e) {
    console.error("Onboarding Update Failed:", e);
    throw e;
  }
};