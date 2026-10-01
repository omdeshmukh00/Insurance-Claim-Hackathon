import React from "react";
import { Claim } from "@/types/claims";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface ClaimSummaryCardProps {
  claim: Claim;
  onClick?: () => void;
}

export function ClaimSummaryCard({ claim, onClick }: ClaimSummaryCardProps) {
  const statusBadgeVariant = {
    draft: "default",
    submitted: "info",
    under_investigation: "primary",
    assessment_pending: "warning",
    review_required: "warning",
    approved: "success",
    rejected: "error",
    escalated: "error",
  } as const;

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:border-slate-700 hover:bg-slate-900/90 transition-all"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <span className="text-xs font-mono text-slate-400">
            {claim.claimNumber}
          </span>
          <CardTitle className="text-base mt-0.5">
            {claim.policyHolder.name}
          </CardTitle>
        </div>
        <Badge variant={statusBadgeVariant[claim.status] || "default"}>
          {claim.status.replace("_", " ").toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Estimated Loss:</span>
            <p className="font-semibold text-slate-200">
              {formatCurrency(claim.estimatedLoss)}
            </p>
          </div>
          <div>
            <span className="text-slate-500">Filing Date:</span>
            <p className="text-slate-300">{formatDate(claim.filingDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
