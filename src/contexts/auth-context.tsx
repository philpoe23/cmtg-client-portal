"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";
import { getCurrentUser, signOutServer } from "@/lib/server/auth";

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

  useEffect(() => {
    const hydrateUser = async () => {
      // The auth cookie is httpOnly, so it can't be read from document.cookie
      // here — ask the server (which does see it) who's signed in instead.
      const currentUser = await getCurrentUser().catch(() => null);

      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    hydrateUser();
  }, []);

  const signIn = () => {
    router.push("/login");
  };

  const signOut = () => {
    const pb = createClient();
    pb.authStore.clear();
    setUser(null);
    setIsAuthenticated(false);
    signOutServer().finally(() => {
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
