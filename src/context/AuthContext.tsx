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
  const role = (data.role as UserRole) ?? "general";
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
    const a = auth();
    const unsub = onAuthStateChanged(a, async (u) => {
      setUser(u);
      setError(null);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db(), "users", u.uid));
        if (!snap.exists()) {
          setProfile(null);
          setError(
            "No user profile in Firestore. Create users/{uid} with role admin or partner.",
          );
          await signOut(a);
          setLoading(false);
          return;
        }
        const p = parseProfile(snap.data() as Record<string, unknown>);
        if (!allowedRoles.includes(p.role)) {
          setProfile(null);
          setError(
            "This portal is for Admin and Partner accounts only. Set role to admin or partner on users/" +
              u.uid,
          );
          await signOut(a);
          setLoading(false);
          return;
        }
        setProfile(p);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load profile.";
        setError(msg);
        setProfile(null);
        await signOut(a);
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
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const map: Record<string, string> = {
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-not-found": "No account found.",
        "auth/wrong-password": "Incorrect password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
      };
      setLoading(false);
      setError(map[code ?? ""] ?? (e instanceof Error ? e.message : "Sign-in failed."));
      throw e;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth());
    setProfile(null);
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
    [user, profile, loading, error, signIn, signOutUser, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
