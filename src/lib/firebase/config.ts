import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase safely (avoid multiple initializations in Next.js SSR / HMR)
export const app = getApps().length > 0 ? getApp() : (firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null);
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const AUTHORIZED_ADMIN_EMAILS = [
  "rajatava2006@gmail.com",
  "manishdey356@gmail.com",
  "priyankashrutikumari12345@gmail.com",
];

export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()).includes(email.toLowerCase().trim());
}

export interface StaffSession {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: "admin" | "operator";
  loginTime: string;
}

/**
 * Perform Sign In with Google via Firebase Popup.
 * Restricts Admin Portal to authorized government Gmail IDs.
 */
export async function signInWithGoogle(role: "admin" | "operator"): Promise<StaffSession> {
  if (auth && firebaseConfig.apiKey) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user: User = result.user;
      const userEmail = (user.email || "").toLowerCase().trim();

      // STRICT ADMIN SECURITY GATE: Only authorized admin Gmails can access Admin Portal
      if (role === "admin" && !isAuthorizedAdmin(userEmail)) {
        throw new Error(
          `Access Denied: ${userEmail} is not authorized for the Government Admin Portal. Access is strictly restricted to designated administrator accounts.`
        );
      }

      const session: StaffSession = {
        uid: user.uid,
        name: user.displayName || (role === "admin" ? "Govt Admin" : "Yard Operator"),
        email: userEmail,
        photoURL: user.photoURL || undefined,
        role,
        loginTime: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(`kisanSetu_${role}_session`, JSON.stringify(session));
      }
      return session;
    } catch (err: any) {
      console.warn("Firebase Google Sign-in error/cancelled:", err.message);
      // If user closed the popup deliberately
      if (err.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in cancelled. Please complete Google authentication.");
      }
      // Re-throw specific security access errors or general errors
      throw new Error(err.message || "Failed to sign in with Google.");
    }
  }

  // Fallback demo authentication with first authorized admin ID
  const fallbackEmail = role === "admin" ? AUTHORIZED_ADMIN_EMAILS[0] : "manoj.operator@odishamandi.gov.in";
  const fallbackSession: StaffSession = {
    uid: `demo-${role}-${Date.now()}`,
    name: role === "admin" ? "Rajatava (Admin)" : "Manoj Das (APMC Operator)",
    email: fallbackEmail,
    photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=kisan",
    role,
    loginTime: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(`kisanSetu_${role}_session`, JSON.stringify(fallbackSession));
  }
  return fallbackSession;
}

export async function signOutStaff(role: "admin" | "operator") {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(`kisanSetu_${role}_session`);
  }
}
