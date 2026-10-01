import { authService } from "./auth";

/**
 * Backend API Client
 *
 * Strict Architecture Note:
 * All business logic, AI orchestration, claim assessment, and RAG operations
 * reside exclusively in the backend service. This client communicates purely
 * via HTTP endpoints and attaches the authenticated Bearer token.
 */

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface BackendClaim {
  id: string;
  claimant_id: string;
  claim_number: string;
  policy_number: string;
  claim_type: "AUTO" | "HEALTH" | "PROPERTY" | "LIFE" | "GENERAL";
  title: string;
  description: string;
  incident_date: string;
  claim_amount: number;
  status:
    | "SUBMITTED"
    | "PROCESSING"
    | "UNDER_INVESTIGATION"
    | "REQUIRES_INFO"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "SETTLED"
    | "REJECTED";
  complexity?: "LOW" | "MEDIUM" | "HIGH" | null;
  requires_human_review: boolean;
  assigned_officer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendDocument {
  id: string;
  claim_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  document_type: string;
  uploaded_by: string;
  processing_status: string;
  extracted_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BackendClaimEvent {
  id: string;
  claim_id: string;
  type: string;
  actor_type: "USER" | "AI_AGENT" | "SYSTEM";
  actor: string;
  status: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface BackendEvidence {
  id: string;
  claim_id: string;
  agent_run_id?: string | null;
  document_id?: string | null;
  page_number?: number | null;
  source_text: string;
  evidence_type:
    | "DOCUMENT_EXTRACT"
    | "POLICY_CLAUSE"
    | "HISTORICAL_CLAIM"
    | "METADATA_DISCREPANCY";
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface BackendAssessment {
  id: string;
  claim_id: string;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  coverage_status:
    | "COVERED"
    | "POTENTIALLY_COVERED"
    | "NOT_CLEARLY_COVERED"
    | "NOT_COVERED"
    | "REQUIRES_REVIEW";
  coverage_summary: string;
  anomaly_summary: string;
  missing_info_summary: string;
  recommendation: "automated_processing" | "human_review";
  reasons: string[];
  evidence_ids: string[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BackendInvestigationSummary {
  claim_id: string;
  status: string;
  agent_runs: Array<{
    id: string;
    agent_type: string;
    status: string;
    started_at: string;
    completed_at?: string | null;
    execution_time_ms?: number | null;
  }>;
  findings: Array<{
    id: string;
    finding_type: string;
    title: string;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>;
  missing_information: Array<{
    id: string;
    required_item: string;
    reason: string;
    priority: string;
    status: string;
  }>;
}

export interface BackendReviewDecision {
  id: string;
  claim_id: string;
  reviewer_id: string;
  decision:
    | "APPROVE_FOR_PROCESSING"
    | "REQUEST_INFORMATION"
    | "ESCALATE"
    | "REJECT";
  notes: string;
  created_at: string;
}

export interface BackendMissingInfo {
  id: string;
  claim_id: string;
  required_item: string;
  reason: string;
  priority: string;
  status: string;
  created_at: string;
}

export interface BackendSettlement {
  id: string;
  claim_id: string;
  settlement_amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "PROCESSED" | "PAID" | "CANCELLED";
  reason: string;
  approved_at?: string | null;
  created_at: string;
}

export interface BackendAuditLog {
  id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateClaimPayload {
  policy_number: string;
  claim_type: "AUTO" | "HEALTH" | "PROPERTY" | "LIFE" | "GENERAL";
  title: string;
  description: string;
  incident_date: string;
  claim_amount: number;
}

export async function fetchFromBackend<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (!(options?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Attach Bearer token from authService if user is authenticated
  const token = authService.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options?.headers as Record<string, string>),
      },
    });
  } catch (err: unknown) {
    throw new ApiError(
      0,
      "Unable to connect to backend server. Please verify backend service is running.",
      "NETWORK_ERROR",
      err
    );
  }

  const responseJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      responseJson?.error?.message ||
      responseJson?.message ||
      `Request failed with status ${response.status}`;
    const errorCode = responseJson?.error?.code || `HTTP_${response.status}`;
    throw new ApiError(response.status, errorMsg, errorCode, responseJson);
  }

  // Backend wraps all payloads in { success: true, data: T, requestId: string }
  if (responseJson && typeof responseJson === "object" && "data" in responseJson) {
    return responseJson.data as T;
  }

  return responseJson as T;
}

export const api = {
  getHealth: () => fetchFromBackend<{ status: string; service: string }>("/health"),
  getStatus: () =>
    fetchFromBackend<{ name: string; version: string; modules: string[] }>(
      "/api/status"
    ),

  claims: {
    list: () => fetchFromBackend<BackendClaim[]>("/api/claims"),

    get: (id: string) => fetchFromBackend<BackendClaim>(`/api/claims/${id}`),

    create: (data: CreateClaimPayload) =>
      fetchFromBackend<BackendClaim>("/api/claims", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<BackendClaim>) =>
      fetchFromBackend<BackendClaim>(`/api/claims/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    getEvents: (id: string) =>
      fetchFromBackend<BackendClaimEvent[]>(`/api/claims/${id}/events`),

    getEvidence: (id: string) =>
      fetchFromBackend<BackendEvidence[]>(`/api/claims/${id}/evidence`),

    getAssessment: (id: string) =>
      fetchFromBackend<BackendAssessment | null>(`/api/claims/${id}/assessment`),

    uploadDocument: async (
      claimId: string,
      file: File,
      documentType = "GENERAL"
    ) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      return fetchFromBackend<BackendDocument>(`/api/claims/${claimId}/documents`, {
        method: "POST",
        body: formData,
      });
    },

    listDocuments: (claimId: string) =>
      fetchFromBackend<BackendDocument[]>(`/api/claims/${claimId}/documents`),

    triggerInvestigation: (claimId: string) =>
      fetchFromBackend<unknown>(`/api/claims/${claimId}/investigate`, {
        method: "POST",
      }),

    getInvestigation: (claimId: string) =>
      fetchFromBackend<BackendInvestigationSummary>(
        `/api/claims/${claimId}/investigation`
      ),

    submitReview: (
      claimId: string,
      data: {
        decision:
          | "APPROVE_FOR_PROCESSING"
          | "REQUEST_INFORMATION"
          | "ESCALATE"
          | "REJECT";
        notes: string;
      }
    ) =>
      fetchFromBackend<BackendReviewDecision>(`/api/claims/${claimId}/review`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    requestInformation: (
      claimId: string,
      data: { required_items: string[]; reason: string }
    ) =>
      fetchFromBackend<BackendClaim>(
        `/api/claims/${claimId}/request-information`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),

    listReviews: (claimId: string) =>
      fetchFromBackend<BackendReviewDecision[]>(`/api/claims/${claimId}/reviews`),

    listMissingInfo: (claimId: string) =>
      fetchFromBackend<BackendMissingInfo[]>(
        `/api/claims/${claimId}/missing-information`
      ),

    settle: (
      claimId: string,
      data: { settlement_amount: number; currency?: string; reason: string }
    ) =>
      fetchFromBackend<BackendSettlement>(`/api/claims/${claimId}/settle`, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getSettlement: (claimId: string) =>
      fetchFromBackend<BackendSettlement | null>(`/api/claims/${claimId}/settlement`),

    getSettlementRecommendation: (claimId: string) =>
      fetchFromBackend<unknown>(`/api/claims/${claimId}/settlement/recommendation`),

    getAuditLogs: (claimId: string) =>
      fetchFromBackend<BackendAuditLog[]>(`/api/claims/${claimId}/audit-logs`),
  },

  audit: {
    getAllLogs: () => fetchFromBackend<BackendAuditLog[]>("/api/audit-logs"),
  },
};
