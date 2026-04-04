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
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { UserProfile, UserRole,AccountStatus } from "../types/user-types";

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

const allowedRoles: UserRole[] = ["admin", "partner"];

/**
 * @summary Parses raw Firestore data into a typed UserProfile object.
 * @param {Record<string, unknown>} data The raw document data from Firestore.
 * @returns {UserProfile} A structured and typed profile object.
 */
function parseProfile(data: Record<string, unknown>): UserProfile {
  const rawRole = String(data.role ?? "general").toLowerCase().trim();
  const role: UserRole =
      rawRole === "admin" || rawRole === "partner" || rawRole === "general"
          ? (rawRole as UserRole)
          : "general";

  // Type-safe status check
  const rawStatus = data.status as string | undefined;
  const status: AccountStatus = 
      rawStatus === "approved" || rawStatus === "rejected" || rawStatus === "pending_approval"
          ? (rawStatus as AccountStatus)
          : "pending_approval";

  return {
    email: String(data.email ?? ""),
    partnerID: data.partnerID as string | undefined,
    orgName: data.orgName as string | undefined,
    abn: data.abn as string | undefined,
    representativeName: data.representativeName as string | undefined,
    status,
    firstName: data.firstName as string | undefined,
    lastName: data.lastName as string | undefined,
    role,
    selectedTags: data.selectedTags as string[] | undefined,
    onboardingComplete: data.onboardingComplete as boolean | undefined,
    photoURL: data.photoURL as string | undefined,
    createdAt: data.createdAt as any, // Firebase Timestamp
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * @summary Observes Firebase Auth state changes and fetches corresponding Firestore profiles.
     */
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", u.uid);
        const snap = await getDoc(userDocRef);

        console.log("snap", snap);

        if (!snap.exists()) {
          setProfile(null);
          setError("No user profile found in Firestore.");
          await signOut(auth);
          return;
        }

        const p = parseProfile(snap.data() as Record<string, unknown>);

        if (!allowedRoles.includes(p.role)) {
          setProfile(null);
          setError(`Access denied. Role "${p.role}" is not authorized.`);
          await signOut(auth);
          return;
        }

        setProfile(p);
        setError(null);
      } catch (e: any) {
        console.error("Auth Watcher Error:", e);
        setError(e.code === "permission-denied"
            ? "Firestore permission denied. Check your Security Rules."
            : "Failed to load user profile.");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  /**
   * @summary Authenticates a user with email and password.
   * @param {string} email - User's registration email.
   * @param {string} password - User's account password.
   * @returns {Promise<void>}
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
   * @summary Terminates the current session and clears local auth state.
   * @returns {Promise<void>}
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

/**
 * @summary Custom hook to access the AuthContext state and methods.
 * @returns The current authentication state and helper functions.
 * @throws {Error} Throws if used outside of an AuthProvider.
 */
