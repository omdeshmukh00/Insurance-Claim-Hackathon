import { authService } from "./auth";

/**
 * InsuredYou Backend API Client
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
  claim_type: "AUTO" | "HEALTH" | "PROPERTY" | "LIFE" | "GENERAL" | string;
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
    | "REJECTED"
    | string;
  complexity?: "LOW" | "MEDIUM" | "HIGH" | null;
  requires_human_review: boolean;
  assigned_officer_id?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
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
  [key: string]: any;
}

export interface BackendClaimEvent {
  id: string;
  claim_id: string;
  type: string;
  actor_type: "USER" | "AI_AGENT" | "SYSTEM" | string;
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
    | "METADATA_DISCREPANCY"
    | string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  [key: string]: any;
}

export interface BackendAssessment {
  id: string;
  claim_id: string;
  complexity: "LOW" | "MEDIUM" | "HIGH" | string;
  coverage_status:
    | "COVERED"
    | "POTENTIALLY_COVERED"
    | "NOT_CLEARLY_COVERED"
    | "NOT_COVERED"
    | "REQUIRES_REVIEW"
    | string;
  coverage_summary: string;
  anomaly_summary: string;
  missing_info_summary: string;
  recommendation: "automated_processing" | "human_review" | string;
  reasons: string[];
  evidence_ids: string[];
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface BackendInvestigationSummary {
  claim_id: string;
  status: string;
  agentRuns: any[];
  findings: any[];
  anomalies: any[];
  missingInformation: any[];
  assessment: any;
  requiresHumanReview: boolean;
  [key: string]: any;
}

export interface BackendReviewDecision {
  id: string;
  claim_id: string;
  decision: string;
  notes: string;
  reviewer_id?: string;
  created_at: string;
  [key: string]: any;
}

export interface BackendMissingInfo {
  id: string;
  claim_id: string;
  item: string;
  reason: string;
  priority: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

export interface BackendSettlement {
  id: string;
  claim_id: string;
  settlement_amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "PROCESSED" | "PAID" | "CANCELLED" | string;
  reason: string;
  approved_at?: string | null;
  created_at: string;
  [key: string]: any;
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
  claim_type?: "AUTO" | "HEALTH" | "PROPERTY" | "LIFE" | "GENERAL" | string;
  title: string;
  description: string;
  incident_date: string;
  incident_location?: string;
  claim_amount: number;
}

function getAuthToken(): string {
  if (typeof window === "undefined") return "mock-token-claimant";
  const authTok = authService?.getToken?.();
  if (authTok) return authTok;
  const savedRole = localStorage.getItem("insuredyou_role");
  return savedRole === "ADMIN" ? "mock-token-admin" : "mock-token-claimant";
}

export async function fetchFromBackend<T>(
  endpoint: string,
  options?: RequestInit,
  customToken?: string
): Promise<T> {
  const url = `${BACKEND_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const token = customToken || getAuthToken();
  const isFormData = options?.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
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
      `Request to ${endpoint} failed with status ${response.status}`;
    const errorCode = responseJson?.error?.code || `HTTP_${response.status}`;
    throw new ApiError(response.status, errorMsg, errorCode, responseJson);
  }

  // Backend standard envelope is { success: true, data: T }
  if (responseJson && typeof responseJson === "object" && "data" in responseJson) {
    return responseJson.data as T;
  }

  return responseJson as T;
}

// ============================================================
// API METHOD DEFINITIONS
// ============================================================

export const api = {
  // System Health
  getHealth: () => fetchFromBackend<{ status: string; service: string }>("/health"),
  getStatus: () =>
    fetchFromBackend<{ name: string; version: string; modules: string[] }>("/api/status"),

  // Auth & Profile
  getProfile: () =>
    fetchFromBackend<{ id: string; email: string; role: string; fullName: string; phone: string | null }>(
      "/api/auth/profile"
    ),
  updateProfile: (data: { fullName?: string; phone?: string }) =>
    fetchFromBackend("/api/auth/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // User Policies
  listPolicies: () =>
    fetchFromBackend<any[]>("/api/policies"),

  getPolicy: (id: string) =>
    fetchFromBackend<any>(`/api/policies/${id}`),

  uploadPolicyFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchFromBackend<{
      analysis: {
        policy_number: string;
        insurer_name: string;
        policy_name: string;
        policy_type: string;
        policyholder_name: string;
        insured_asset?: string;
        start_date: string;
        expiry_date: string;
        premium: number;
        deductible: number;
        covered_events: string[];
        coverage_limits: string[];
        exclusions: string[];
        claim_conditions: string[];
        extracted_evidence: Array<{
          field: string;
          value: any;
          page: number;
          source_text: string;
          confidence: number;
        }>;
      };
      storagePath: string;
      fileName: string;
    }>("/api/policies/upload", {
      method: "POST",
      body: formData,
    });
  },

  confirmAndSavePolicy: (policyData: any) =>
    fetchFromBackend<any>("/api/policies", {
      method: "POST",
      body: JSON.stringify(policyData),
    }),

  updatePolicy: (id: string, updates: any) =>
    fetchFromBackend<any>(`/api/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  // User Claims
  listClaims: () =>
    fetchFromBackend<any[]>("/api/claims"),

  getClaim: (id: string) =>
    fetchFromBackend<any>(`/api/claims/${id}`),

  createClaim: (claimData: {
    policy_number: string;
    title: string;
    description: string;
    incident_date: string;
    incident_location?: string;
    claim_amount: number;
    claim_type?: string;
  }) =>
    fetchFromBackend<any>("/api/claims", {
      method: "POST",
      body: JSON.stringify(claimData),
    }),

  uploadClaimDocument: (claimId: string, file: File, documentType = "GENERAL") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", documentType);
    return fetchFromBackend<any>(`/api/claims/${claimId}/documents`, {
      method: "POST",
      body: formData,
    });
  },

  triggerInvestigation: (claimId: string) =>
    fetchFromBackend<any>(`/api/claims/${claimId}/investigate`, {
      method: "POST",
    }),

  getInvestigation: (claimId: string) =>
    fetchFromBackend<BackendInvestigationSummary>(
      `/api/claims/${claimId}/investigation`
    ),

  getEvidence: (claimId: string) =>
    fetchFromBackend<any[]>(`/api/claims/${claimId}/evidence`),

  getAssessment: (claimId: string) =>
    fetchFromBackend<any>(`/api/claims/${claimId}/assessment`),

  getSettlement: (claimId: string) =>
    fetchFromBackend<{
      claim: any;
      settlement: any | null;
      recommendation: any | null;
    }>(`/api/claims/${claimId}/settlement`),

  // AI Assistant (Agent 9)
  askAssistant: (data: {
    message: string;
    claimId?: string;
    policyId?: string;
    screenContext?: Record<string, any>;
  }) =>
    fetchFromBackend<{
      answer: string;
      reply?: string;
      references: Array<{
        type: "policy" | "claim" | "evidence";
        id: string;
        title: string;
        quote?: string;
      }>;
      suggestedQuestions: string[];
    }>("/api/assistant", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Administrator APIs
  getAdminDashboard: () =>
    fetchFromBackend<{
      kpi: {
        totalPolicies: number;
        activePolicies: number;
        totalClaims: number;
        claimsRequiringReview: number;
        pendingSettlements: number;
        totalSettledAmount: number;
      };
      recentActivity: any[];
    }>("/api/admin/dashboard"),

  listAdminPolicies: () =>
    fetchFromBackend<any[]>("/api/admin/policies"),

  createAdminPolicy: (policyData: any) =>
    fetchFromBackend<any>("/api/admin/policies", {
      method: "POST",
      body: JSON.stringify(policyData),
    }),

  updateAdminPolicy: (id: string, updates: any) =>
    fetchFromBackend<any>(`/api/admin/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  updateAdminPricing: (
    id: string,
    pricing: {
      premium?: number;
      deductible?: number;
      limits?: string[];
      coverage?: string[];
    }
  ) =>
    fetchFromBackend<any>(`/api/admin/policies/${id}/pricing`, {
      method: "PATCH",
      body: JSON.stringify(pricing),
    }),

  listAdminClaims: (params?: { status?: string; requires_review?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.requires_review !== undefined)
      query.set("requires_review", String(params.requires_review));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return fetchFromBackend<any[]>(`/api/admin/claims${qs}`);
  },

  getAdminClaimDetail: (id: string) =>
    fetchFromBackend<{
      claim: any;
      agentRuns: any[];
      findings: any[];
      evidence: any[];
      events: any[];
      reviews: any[];
      settlement: any | null;
      auditLogs: any[];
    }>(`/api/admin/claims/${id}`),

  submitAdminReview: (
    id: string,
    review: {
      decision: "APPROVE_FOR_PROCESSING" | "REQUEST_INFORMATION" | "ESCALATE" | "REJECT" | string;
      notes: string;
      requested_items?: string[];
      new_status?: string;
    }
  ) =>
    fetchFromBackend<any>(`/api/admin/claims/${id}/review`, {
      method: "POST",
      body: JSON.stringify(review),
    }),

  settleAdminClaim: (
    id: string,
    settlement: {
      settlement_amount: number;
      currency?: string;
      deductible_applied: number;
      net_payout: number;
      payout_breakdown?: Record<string, number>;
      notes?: string;
      reason?: string;
    }
  ) =>
    fetchFromBackend<any>(`/api/admin/claims/${id}/settle`, {
      method: "POST",
      body: JSON.stringify(settlement),
    }),

  // Namespace backward compatibility
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
          | "REJECT"
          | string;
        notes: string;
      }
    ) =>
      fetchFromBackend<BackendReviewDecision>(`/api/admin/claims/${claimId}/review`, {
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
      fetchFromBackend<BackendSettlement>(`/api/admin/claims/${claimId}/settle`, {
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
