export type UserRole = "USER" | "ADMIN";

export type BackendUserRole = "CLAIMANT" | "CLAIMS_OFFICER" | "INVESTIGATOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  backendRole: BackendUserRole;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
