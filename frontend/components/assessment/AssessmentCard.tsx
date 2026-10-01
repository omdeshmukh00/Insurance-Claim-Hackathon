import React from "react";
import { ClaimAssessment } from "@/types/assessment";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export interface AssessmentCardProps {
  assessment: ClaimAssessment;
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payout Assessment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Total Claimed:</span>
          <span className="text-slate-200">{formatCurrency(assessment.totalClaimed)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Total Assessed:</span>
          <span className="text-slate-200">{formatCurrency(assessment.totalAssessed)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Deductible Applied:</span>
          <span className="text-rose-400">-{formatCurrency(assessment.deductibleApplied)}</span>
        </div>
        <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-semibold">
          <span className="text-white">Net Recommended:</span>
          <span className="text-emerald-400">{formatCurrency(assessment.netPayoutRecommended)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
