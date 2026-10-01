import React from "react";
import { AgentRole, AgentTaskStatus } from "@/types/investigation";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

export interface AgentStatusBadgeProps {
  role: AgentRole;
  status: AgentTaskStatus;
}

const statusVariants: Record<AgentTaskStatus, BadgeVariant> = {
  pending:   "default",
  running:   "info",
  completed: "success",
  flagged:   "warning",
  failed:    "error",
};

export function AgentStatusBadge({ role, status }: AgentStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status] ?? "default"} dot>
      {role.replace(/_/g, " ")}: {status}
    </Badge>
  );
}
