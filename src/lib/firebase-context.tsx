import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  db,
  signInWithGoogle,
  signOutFromFirebase,
  onAuthStateChanged,
  testConnection,
  type User,
} from "./firebase";

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<User>;
  signOut: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

const ADMIN_EMAILS = ["yeferm264@gmail.com", "yefermartines9@gmail.com"];

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = Boolean(
    user && user.email && ADMIN_EMAILS.some((em) => em.toLowerCase() === user.email?.toLowerCase()),
  );

  const handleSignIn = async () => {
    return await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutFromFirebase();
    setUser(null);
  };

  const value: FirebaseContextType = {
    user,
    loading,
    isAdmin,
    signIn: handleSignIn,
    signOut: handleSignOut,
    checkConnection: testConnection,
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}
