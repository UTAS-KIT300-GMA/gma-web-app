import {
  createContext,
  useCallback,
  useContext,
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
import type { UserProfile, UserRole } from "../types";

type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const allowedRoles: UserRole[] = ["admin", "partner"];

function parseProfile(data: Record<string, unknown>): UserProfile {
  const raw = String(data.role ?? "general").toLowerCase().trim();
  const role: UserRole =
      raw === "admin" || raw === "partner" || raw === "general"
          ? (raw as UserRole)
          : "general";

  return {
    email: String(data.email ?? ""),
    firstName: data.firstName as string | undefined,
    lastName: data.lastName as string | undefined,
    role,
    selectedTags: data.selectedTags as string[] | undefined,
    onboardingComplete: data.onboardingComplete as boolean | undefined,
    photoURL: data.photoURL as string | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth(), async (u) => {
      setUser(u);

      if (!u) {
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db(), "users", u.uid);
        const snap = await getDoc(userDocRef);

        console.log("snap", snap);

        if (!snap.exists()) {
          setProfile(null);
          setError("No user profile found in Firestore.");
          await signOut(auth());
          return;
        }

        const p = parseProfile(snap.data() as Record<string, unknown>);

        if (!allowedRoles.includes(p.role)) {
          setProfile(null);
          setError(`Access denied. Role "${p.role}" is not authorized.`);
          await signOut(auth());
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

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth(), email.trim(), password);
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

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth());
      setProfile(null);
      setUser(null);
    } catch (e) {
      console.error("Sign out error", e);
    }
  }, []);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}