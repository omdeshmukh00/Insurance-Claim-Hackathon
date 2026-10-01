export type AgentRole =
  | "intake_validator"
  | "policy_checker"
  | "fraud_detector"
  | "damage_estimator"
  | "orchestrator";

export type AgentTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "flagged";

export interface AgentTask {
  id: string;
  claimId: string;
  agentName: string;
  agentRole: AgentRole;
  status: AgentTaskStatus;
  startedAt?: string;
  completedAt?: string;
  findings?: string;
  confidenceScore?: number;
  anomaliesDetected?: string[];
}

export interface InvestigationSummary {
  claimId: string;
  tasks: AgentTask[];
  overallRiskScore: number;
  fraudIndicators: string[];
  recommendedAction: "auto_approve" | "manual_review" | "reject" | "further_investigation";
}
