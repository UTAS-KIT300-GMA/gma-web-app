import type { User } from "firebase/auth";

/** * Data captured from the Partner Registration Form 
 */
export interface PartnerRegistrationData {
  email: string;
  password: string;
  orgName: string;
  orgType: string;
  abn: string;
  address: string;
  firstName: string;
  lastName: string;
  position: string;
  phoneNumber: string;
}

/** * Standardized response for the registerPartner service 
 */
export type RegisterPartnerResponse = User;

/**
 * Standardized response for Login functionality
 */
export type LoginResponse = {
  success: boolean;
  user: User | null;
  error?: string;
};