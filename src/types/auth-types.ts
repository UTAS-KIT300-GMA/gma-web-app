import type { User } from "firebase/auth";

/** * Data captured from the Partner Registration Form 
 */
export interface PartnerRegistrationData {
  email: string;
  password: string;
  orgName: string;
  abn: string;
  representativeName: string;
}

/** * Standardized response for the registerPartner service 
 */
export type RegisterPartnerResponse = {
  success: boolean;
  user: User;
};

/**
 * Standardized response for Login functionality
 */
export type LoginResponse = {
  success: boolean;
  user: User | null;
  error?: string;
};