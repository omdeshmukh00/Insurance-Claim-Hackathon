import React from "react";
import type { ClaimDetail } from "@/types/claimDetail";
import { Card, CardHeader, CardTitle, CardContent, StatusBadge } from "@/components/ui";
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface ClaimSummaryCardProps {
  claim: ClaimDetail;
  onClick?: () => void;
}

export function ClaimSummaryCard({ claim, onClick }: ClaimSummaryCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-[var(--shadow-md)] transition-shadow"
    >
      <CardHeader>
        <div>
          <span className="text-xs font-mono text-[var(--text-muted)]">{claim.claimNumber}</span>
          <CardTitle className="text-base mt-0.5">{claim.policyHolder.name}</CardTitle>
        </div>
        <StatusBadge status={claim.status} />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-tertiary)]">
          <div>
            <span>Type:</span>
            <p className="font-medium text-[var(--text-secondary)] mt-0.5">{CLAIM_TYPE_LABELS[claim.type]}</p>
          </div>
          <div>
            <span>Estimated Loss:</span>
            <p className="font-semibold text-[var(--text-primary)] mt-0.5">{formatCurrency(claim.estimatedLoss)}</p>
          </div>
          <div>
            <span>Filing Date:</span>
            <p className="mt-0.5">{formatDate(claim.filingDate)}</p>
          </div>
          <div>
            <span>Priority:</span>
            <p className="font-medium text-[var(--text-secondary)] mt-0.5 capitalize">{claim.priority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
