import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, type User, type ActionCodeSettings
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase";

import type { PartnerRegistrationData, RegisterPartnerResponse } from "../types/auth-types";
import type { UserProfile } from "../types/user-types";

/**
 * @summary  Creates user authentication credentials and triggers an email verification link.
 * @param  data The user's registration details, including email and password.
 * @throws {Error} Throws if account creation or email delivery fails.
 */
export const registerPartner = async (data: PartnerRegistrationData): Promise<RegisterPartnerResponse> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    
    const actionCodeSettings: ActionCodeSettings = {
      url: 'http://localhost:5173/', 
      handleCodeInApp: true,
    };
   
    await sendEmailVerification(cred.user, actionCodeSettings);

    return cred.user;
  } catch (e) {
    console.error("Auth Registration Failed:", e);
    throw e;
  }
};

/**
 * @summary Creates the initial Firestore user document with pending approval status.
 * @param  user The authenticated Firebase user object.
 * @param  data The organizational and representative data for the profile.
 * @throws {Error} Throws if the Firestore document cannot be created.
 */
export const createInitialProfile = async (user: User, data: PartnerRegistrationData) => {
  try {
    const userRef = doc(db, "users", user.uid); 

    const profileData: UserProfile = {
      partnerID: user.uid,
      email: data.email.toLowerCase().trim(),
      role: "partner",
      status: "pending_approval",
      applicationAt: serverTimestamp() as any,
      createdAt: serverTimestamp() as any,
      orgName: data.orgName.trim(),
      orgType: data.orgType,
      abn: data.abn.trim(),
      address: data.address.trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      position: data.position.trim(),
      phoneNumber: data.phoneNumber.trim(),
      onboardingComplete: false,
    };

    await setDoc(userRef, profileData);
    return { success: true };
  } catch (e) {
    console.error("Firestore Profile Creation Failed:", e);
    throw e;
  }
};

/**
 * @summary Finalizes the user profile by adding branding data and marking onboarding as complete.
 * @param  uid The unique identifier of the user to update.
 * @param  onboardingData The branding and social data provided by the user.
 * @throws {Error} Throws if the Firestore document update fails.
 */
export const completePartnerOnboarding = async (uid: string, onboardingData: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, "users", uid);
    
    const cleanData = {
      photoURL: onboardingData.photoURL || "",
      missionStatement: onboardingData.missionStatement || "",
      socials: onboardingData.socials || {},
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, cleanData);
    return { success: true };
  } catch (e) {
    console.error("Onboarding Update Failed:", e);
    throw e;
  }
};