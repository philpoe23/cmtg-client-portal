"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/pocketbase/client";

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
      const pb = createClient();
      pb.authStore.loadFromCookie(document.cookie);

      if (pb.authStore.isValid && pb.authStore.model) {
        try {
          const model = pb.authStore.model;
          const portalUser = await pb.collection("portal_users").getOne(model["id"] as string, { expand: "account" });
          const expandData = portalUser.expand as Record<string, unknown> | undefined;
          const accountRaw = expandData?.account;
          const account = (Array.isArray(accountRaw) ? accountRaw[0] : accountRaw) as Record<string, unknown> | undefined;
          const firstName = (portalUser["first_name"] as string | undefined) || "";
          const lastName = (portalUser["last_name"] as string | undefined) || "";
          const displayName = [firstName, lastName].filter(Boolean).join(" ") || (portalUser["email"] as string) || "User";

          setUser({
            id: portalUser["id"] as string,
            first_name: firstName,
            last_name: lastName,
            name: displayName,
            email: (portalUser["email"] as string) || "",
            accountName: ((account?.["company_name"] as string | undefined) || "") as string,
          });
          setIsAuthenticated(true);
        } catch {
          const model = pb.authStore.model;
          const fallbackName = (model["name"] as string | undefined) || (model["email"] as string) || "User";
          setUser({
            id: model["id"] as string,
            first_name: (model["first_name"] as string | undefined) || "",
            last_name: (model["last_name"] as string | undefined) || "",
            name: fallbackName,
            email: (model["email"] as string) || "",
            accountName: "",
          });
          setIsAuthenticated(true);
        }
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
