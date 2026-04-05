import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { UserProfile, UserRole, AccountStatus } from "../types/user-types";

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

/**
 * @summary Safely extracts a Firebase Timestamp from raw data.
 * @param  val - The raw value to be converted into a Timestamp.
 */
function parseTimestamp(val: unknown): Timestamp | undefined {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val;
  if (typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
    return new Timestamp((val as any).seconds, (val as any).nanoseconds);
  }
  return undefined;
}

export const AuthContext = createContext<AuthState | null>(null);

const allowedRoles: UserRole[] = ["admin", "partner"];

/**
 * @summary Parses raw Firestore data into a typed UserProfile object.
 * @param data The raw document data from Firestore.
 */
function parseProfile(data: Record<string, unknown>): UserProfile {
  const rawRole = String(data.role ?? "general").toLowerCase().trim();
  const role: UserRole =
      rawRole === "admin" || rawRole === "partner" || rawRole === "general"
          ? (rawRole as UserRole)
          : "general";

  const rawStatus = data.status as string | undefined;
  const status: AccountStatus = 
      rawStatus === "approved" || rawStatus === "rejected" || rawStatus === "pending_approval"
          ? (rawStatus as AccountStatus)
          : "pending_approval";

  return {
    email: String(data.email ?? ""),
    partnerId: data.partnerId as string | undefined,
    role,
    status,
    createdAt: parseTimestamp(data.createdAt) as any,
    applicationAt: parseTimestamp(data.applicationAt),
    orgName: data.orgName as string | undefined,
    orgType: data.orgType as string | undefined,
    abn: data.abn as string | undefined,
    address: data.address as string | undefined,
    firstName: data.firstName as string | undefined,
    lastName: data.lastName as string | undefined,
    position: data.position as string | undefined,
    phoneNumber: data.phoneNumber as string | undefined,
    onboardingComplete: Boolean(data.onboardingComplete ?? false), 
    photoURL: data.photoURL as string | undefined,
    missionStatement: data.missionStatement as string | undefined,
    socials: data.socials as UserProfile["socials"],
    selectedTags: data.selectedTags as string[] | undefined,
    updatedAt: parseTimestamp(data.updatedAt),     
  };
}

/**
 * @summary Provider component that manages global auth state and Firestore profile listeners.
 * @param  props React children to be wrapped by the provider.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        if (unsubProfile) unsubProfile();
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", u.uid);
      
      unsubProfile = onSnapshot(userDocRef, (snap) => {
        if (!snap.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }
        
        const p = parseProfile(snap.data() as Record<string, unknown>);
        if (!allowedRoles.includes(p.role)) {
            console.warn(`Unauthorized role detected: ${p.role}`);
            setProfile(null);
            setError(`Access denied. Role "${p.role}" is not authorized.`);
            setLoading(false);
            return;
          }
        
        setProfile(p);
        setError(null);
        setLoading(false);
      }, (err) => {
        console.error("Profile Watcher Error:", err);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  /**
   * @summary Authenticates a user with email and password via Firebase Auth.
   * @param email User's registration email.
   * @param password User's account password.
   * @throws {FirebaseError} Throws if credentials are invalid or user not found.
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      const map: Record<string, string> = {
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-not-found": "No account found.",
        "auth/wrong-password": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      const errorMessage = map[e.code] || e.message || "Sign-in failed.";
      setError(errorMessage);
      setLoading(false);
      throw e;
    }
  }, []);

  /**
   * @summary Terminates the current session and clears local auth and profile state.
   */
  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setProfile(null);
      setUser(null);
    } catch (e) {
      console.error("Sign out error", e);
    }
  }, []);

  /**
   * @summary Resets the current authentication error state.
   */
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
      () => ({
        user,
        profile,
        loading,
        error,
        signIn,
        signOutUser,
        clearError,
      }),
      [user, profile, loading, error, signIn, signOutUser, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

