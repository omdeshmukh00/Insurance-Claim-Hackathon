"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { AuthUser, LoginCredentials, UserRole } from "./types";
import { authService } from "./authService";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Hydrate current user on client mount
    const initialUser = authService.getCurrentUser();
    setUser(initialUser);
    setIsLoading(false);

    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
