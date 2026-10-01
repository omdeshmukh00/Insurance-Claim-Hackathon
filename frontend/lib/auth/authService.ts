import { AuthUser, LoginCredentials, UserRole, BackendUserRole } from "./types";

const TOKEN_KEY = "claimintel_token";
const USER_KEY = "claimintel_user";

// Known profiles matching backend in-memory profiles and tokens
const KNOWN_USERS: Record<
  string,
  {
    id: string;
    fullName: string;
    backendRole: BackendUserRole;
    token: string;
  }
> = {
  "claimant@example.com": {
    id: "11111111-0000-0000-0000-000000000001",
    fullName: "Alice Claimant",
    backendRole: "CLAIMANT",
    token: "mock-token-claimant",
  },
  "other_claimant@example.com": {
    id: "11111111-0000-0000-0000-000000000002",
    fullName: "Bob Claimant",
    backendRole: "CLAIMANT",
    token: "mock-token-other-claimant",
  },
  "admin@example.com": {
    id: "44444444-0000-0000-0000-000000000004",
    fullName: "Evan Admin",
    backendRole: "ADMIN",
    token: "mock-token-admin",
  },
  "officer@example.com": {
    id: "22222222-0000-0000-0000-000000000002",
    fullName: "Charlie Officer",
    backendRole: "CLAIMS_OFFICER",
    token: "mock-token-officer",
  },
  "investigator@example.com": {
    id: "33333333-0000-0000-0000-000000000003",
    fullName: "Dana Investigator",
    backendRole: "INVESTIGATOR",
    token: "mock-token-investigator",
  },
};

export function mapBackendRoleToFrontendRole(backendRole: BackendUserRole): UserRole {
  if (backendRole === "CLAIMANT") {
    return "USER";
  }
  return "ADMIN";
}

type AuthListener = (user: AuthUser | null) => void;
const listeners = new Set<AuthListener>();

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const authService = {
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getCurrentUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  },

  getCurrentRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getCurrentUser());
  },

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password?.trim() || "";

    // Simulated short network delay for realistic responsiveness
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }

    const matched = KNOWN_USERS[email];
    if (!matched) {
      throw new Error("Invalid email or password.");
    }

    const role = mapBackendRoleToFrontendRole(matched.backendRole);

    const user: AuthUser = {
      id: matched.id,
      email,
      fullName: matched.fullName,
      role,
      backendRole: matched.backendRole,
      token: matched.token,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, user.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setCookie("claimintel_role", user.role);
      setCookie(TOKEN_KEY, user.token);
    }

    listeners.forEach((fn) => fn(user));
    return user;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      deleteCookie("claimintel_role");
      deleteCookie(TOKEN_KEY);
    }
    listeners.forEach((fn) => fn(null));
  },
};
