import React from "react";
import { EvidenceDocument } from "@/types/evidence";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText, Image as ImageIcon } from "lucide-react";

export interface EvidenceCardProps {
  evidence: EvidenceDocument;
}

export function EvidenceCard({ evidence }: EvidenceCardProps) {
  const isImage = evidence.mimeType.startsWith("image/");

  return (
    <Card className="hover:border-slate-700 transition-all">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="p-2 rounded-lg bg-slate-800 text-blue-400">
          {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm truncate">{evidence.fileName}</CardTitle>
          <p className="text-xs text-slate-500">
            {(evidence.fileSize / 1024).toFixed(1)} KB
          </p>
        </div>
        <Badge variant={evidence.ocrProcessed ? "success" : "default"}>
          {evidence.ocrProcessed ? "OCR Indexed" : "Pending OCR"}
        </Badge>
      </CardHeader>
      {evidence.extractedText && (
        <CardContent>
          <p className="text-xs text-slate-400 line-clamp-2 italic bg-slate-950/60 p-2 rounded border border-slate-800/80">
            &quot;{evidence.extractedText}&quot;
          </p>
        </CardContent>
      )}
    </Card>
  );
}
