"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";
import { getCurrentUser, signOutServer } from "@/lib/server/auth";
import { identify, track } from "@/lib/analytics";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  accountName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  // Set while sign-out is in flight, so the effect below doesn't re-fetch the
  // still-valid session cookie and sign the user straight back in.
  const signingOutRef = useRef(false);

  // This provider lives in the root layout, so it mounts once — on /login,
  // before anyone is signed in — and survives the client-side navigation to
  // the dashboard after login. Re-check on route changes while signed out so
  // the user shows up without a full reload.
  useEffect(() => {
    if (isAuthenticated || signingOutRef.current) return;
    let cancelled = false;

    const hydrateUser = async () => {
      // The auth cookie is httpOnly, so it can't be read from document.cookie
      // here — ask the server (which does see it) who's signed in instead.
      const currentUser = await getCurrentUser().catch(() => null);
      if (cancelled) return;

      if (currentUser) {
        // Email as the distinct ID so sessions in Umami read as a person, not a hash.
        identify(currentUser.email || currentUser.id, {
          user_id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          company: currentUser.accountName,
        });
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    hydrateUser();
    return () => {
      cancelled = true;
    };
  }, [pathname, isAuthenticated]);

  const signIn = () => {
    router.push("/login");
  };

  const signOut = () => {
    track("logout", { email: user?.email, company: user?.accountName });
    const pb = createClient();
    pb.authStore.clear();
    signingOutRef.current = true;
    setUser(null);
    setIsAuthenticated(false);
    signOutServer().finally(() => {
      signingOutRef.current = false;
      router.push("/login");
      router.refresh();
    });
  };

  return <AuthContext.Provider value={{ user, isAuthenticated, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
