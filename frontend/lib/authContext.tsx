"use client";

import React, { createContext, useContext, useState } from "react";

export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser;
  role: UserRole;
  token: string;
  switchRole: (newRole: UserRole) => void;
  isLoading: boolean;
}

const defaultUserMap: Record<UserRole, { user: AuthUser; token: string }> = {
  USER: {
    user: {
      id: "11111111-0000-0000-0000-000000000001",
      email: "claimant@example.com",
      fullName: "Alice Claimant",
      role: "USER",
    },
    token: "mock-token-claimant",
  },
  ADMIN: {
    user: {
      id: "44444444-0000-0000-0000-000000000004",
      email: "admin@example.com",
      fullName: "Evan Administrator",
      role: "ADMIN",
    },
    token: "mock-token-admin",
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRole = localStorage.getItem("insuredyou_role") as UserRole | null;
        if (savedRole === "USER" || savedRole === "ADMIN") return savedRole;
      } catch {
        // ignore
      }
    }
    return "USER";
  });

  const [token, setToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRole = localStorage.getItem("insuredyou_role") as UserRole | null;
        if (savedRole && defaultUserMap[savedRole]) return defaultUserMap[savedRole].token;
      } catch {
        // ignore
      }
    }
    return defaultUserMap.USER.token;
  });

  const [user, setUser] = useState<AuthUser>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRole = localStorage.getItem("insuredyou_role") as UserRole | null;
        if (savedRole && defaultUserMap[savedRole]) return defaultUserMap[savedRole].user;
      } catch {
        // ignore
      }
    }
    return defaultUserMap.USER.user;
  });

  const [isLoading] = useState(false);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setToken(defaultUserMap[newRole].token);
    setUser(defaultUserMap[newRole].user);
    try {
      localStorage.setItem("insuredyou_role", newRole);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        switchRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
