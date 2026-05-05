"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";

export interface User {
  id: string;
  name: string;
  email: string;
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
    const pb = createClient();
    pb.authStore.loadFromCookie(document.cookie);

    if (pb.authStore.isValid && pb.authStore.model) {
      const model = pb.authStore.model;
      setUser({
        id: model["id"] as string,
        name: (model["name"] as string | undefined) || (model["email"] as string),
        email: model["email"] as string,
      });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  }, []);

  const signIn = () => {
    router.push("/login");
  };

  const signOut = () => {
    const pb = createClient();
    pb.authStore.clear();
    // Expire the auth cookie
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false, sameSite: "Lax", expires: new Date(0) });
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
    router.refresh();
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
