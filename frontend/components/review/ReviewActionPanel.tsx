import React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export interface ReviewActionPanelProps {
  claimId: string;
  onApprove?: () => void;
  onReject?: () => void;
  onEscalate?: () => void;
  disabled?: boolean;
}

export function ReviewActionPanel({
  claimId,
  onApprove,
  onReject,
  onEscalate,
  disabled = false,
}: ReviewActionPanelProps) {
  return (
    <Card className="border-slate-800">
      <CardHeader>
        <CardTitle className="text-sm">Human-in-the-Loop Review Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-400">
          Review adjuster decisions and override or confirm recommendations for Claim #{claimId}.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onApprove}
          disabled={disabled}
          className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve Payout
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onEscalate}
          disabled={disabled}
        >
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Escalate to SIU
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onReject}
          disabled={disabled}
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
