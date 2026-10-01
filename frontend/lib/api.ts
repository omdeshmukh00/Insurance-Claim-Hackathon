/**
 * Backend API Client
 *
 * Strict Architecture Note:
 * All business logic, AI orchestration, claim assessment, and RAG operations
 * reside exclusively in the backend service. This client communicates purely
 * via HTTP endpoints.
 */

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchFromBackend<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorBody.message || `Request to ${endpoint} failed with status ${response.status}`,
      errorBody
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  getHealth: () => fetchFromBackend<{ status: string; service: string }>("/health"),
  getStatus: () =>
    fetchFromBackend<{ name: string; version: string; modules: string[] }>(
      "/api/status"
    ),
};
