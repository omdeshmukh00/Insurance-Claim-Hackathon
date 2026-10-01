"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  AlertTriangle,
  Upload,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  Badge,
} from "@/components/ui";
import {
  api,
  BackendClaim,
  BackendDocument,
  BackendClaimEvent,
  BackendMissingInfo,
} from "@/lib/api";
import { CLAIM_TYPE_LABELS } from "@/lib/claimHelpers";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function UserClaimDetailPage() {
  const params = useParams();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<BackendClaim | null>(null);
  const [documents, setDocuments] = useState<BackendDocument[]>([]);
  const [events, setEvents] = useState<BackendClaimEvent[]>([]);
  const [missingInfo, setMissingInfo] = useState<BackendMissingInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Uploading additional requested info state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadClaimData = async () => {
    if (!claimId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [claimData, docsData, eventsData, missingData] = await Promise.all([
        api.claims.get(claimId),
        api.claims.listDocuments(claimId).catch(() => []),
        api.claims.getEvents(claimId).catch(() => []),
        api.claims.listMissingInfo(claimId).catch(() => []),
      ]);
      setClaim(claimData);
      setDocuments(docsData || []);
      setEvents(eventsData || []);
      setMissingInfo(missingData || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load claim details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaimData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const handleUploadAdditionalDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadSuccess(null);
    try {
      await api.claims.uploadDocument(claimId, uploadFile, "SUPPLEMENTAL");
      setUploadSuccess(`Successfully uploaded ${uploadFile.name}`);
      setUploadFile(null);
      // Reload documents and events
      const [updatedDocs, updatedEvents] = await Promise.all([
        api.claims.listDocuments(claimId),
        api.claims.getEvents(claimId),
      ]);
      setDocuments(updatedDocs || []);
      setEvents(updatedEvents || []);
    } catch (uploadErr: any) {
      setError(uploadErr?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="h-7 w-7 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          Loading claim details…
        </p>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-[var(--color-error)] mx-auto" />
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          Claim Not Found or Inaccessible
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          {error || "The requested claim does not exist or you do not have permission to view it."}
        </p>
        <Link
          href="/user/claims"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--green-700)] text-white hover:opacity-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Claims
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back link and header */}
      <div>
        <Link
          href="/user/claims"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Claims
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-serif">
                {claim.title}
              </h1>
              <StatusBadge status={claim.status} />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
              Claim ID: <span className="font-semibold">{claim.claim_number}</span> · Policy #: {claim.policy_number}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
              Claimed Amount
            </p>
            <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatCurrency(claim.claim_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Required Notice if REQUIRES_INFO */}
      {claim.status === "REQUIRES_INFO" && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--amber-50)] border border-[var(--amber-300)] text-xs text-[var(--amber-900)] space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-[var(--amber-700)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[var(--amber-900)]">
                Additional Information Required
              </p>
              <p className="text-xs text-[var(--amber-800)] mt-0.5">
                Our claims team has requested supplementary information to process your claim. Please review the items below and upload any requested receipts, reports, or documentation.
              </p>
            </div>
          </div>

          {missingInfo.length > 0 && (
            <div className="bg-white/80 p-3 rounded-[var(--radius-md)] border border-[var(--amber-200)] space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--amber-800)]">
                Requested Items:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {missingInfo.map((item) => (
                  <li key={item.id}>
                    <span className="font-semibold">{item.required_item}</span>:{" "}
                    {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload additional information widget */}
          <form
            onSubmit={handleUploadAdditionalDoc}
            className="flex flex-col sm:flex-row items-center gap-2 pt-1"
          >
            <input
              type="file"
              id="user-supplemental-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setUploadFile(e.target.files ? e.target.files[0] : null)
              }
              className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[var(--green-700)] file:text-white cursor-pointer"
            />
            <button
              type="submit"
              disabled={!uploadFile || isUploading}
              className="h-8 px-4 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--green-700)] text-white hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading…</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </form>

          {uploadSuccess && (
            <p className="text-xs text-[var(--color-success-dark)] font-medium">
              ✓ {uploadSuccess}
            </p>
          )}
        </div>
      )}

      {/* Main Grid: Details & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Claim Details & Description */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
              <CardTitle className="text-sm font-bold">
                Incident & Claim Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[var(--text-tertiary)] block mb-0.5">
                    Claim Type
                  </span>
                  <Badge variant="outline" size="sm">
                    {CLAIM_TYPE_LABELS[claim.claim_type] || claim.claim_type}
                  </Badge>
                </div>
                <div>
                  <span className="text-[var(--text-tertiary)] block mb-0.5">
                    Incident Date
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDate(claim.incident_date)}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-tertiary)] block mb-0.5">
                    Filing Date
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDate(claim.created_at)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Incident Description
                </span>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-subtle)]/50 p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] whitespace-pre-wrap">
                  {claim.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Customer-Facing Investigation Progress */}
          <Card>
            <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--green-700)]" />
                Claim Timeline & Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {events.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)]">
                  Your claim has been registered in the system. Progress updates will appear here as your case is investigated.
                </p>
              ) : (
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border-subtle)]">
                  {events.map((evt) => (
                    <div key={evt.id} className="relative flex items-start gap-3 pl-7">
                      <div className="absolute left-1.5 top-1.5 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--green-700)] shadow-xs" />
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          {evt.message}
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {formatDate(evt.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Submitted Documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-[var(--border-subtle)] pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--green-700)]" />
                Claim Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {documents.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] italic">
                  No documents attached to this claim yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[var(--green-700)] shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-[var(--text-primary)] truncate">
                            {doc.file_name}
                          </p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            {doc.document_type} · {(doc.file_size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-[var(--color-success-dark)] bg-[var(--color-success-light)] px-2 py-0.5 rounded-full shrink-0">
                        Uploaded
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload additional document */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                  Attach Additional Document
                </p>
                <form
                  onSubmit={handleUploadAdditionalDoc}
                  className="space-y-2 text-xs"
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      setUploadFile(e.target.files ? e.target.files[0] : null)
                    }
                    className="w-full text-xs text-[var(--text-secondary)] file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[var(--bg-subtle)] file:text-[var(--text-primary)] cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="w-full h-8 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--green-700)] text-white hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>Upload Document</span>
                  </button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Customer Support Card */}
          <Card className="bg-[var(--bg-subtle)]/40">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <ShieldCheck className="h-4 w-4 text-[var(--green-700)]" />
                Need Assistance?
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                If you have questions regarding this claim or need to update your contact information, please reach out to customer claims support.
              </p>
              <p className="text-xs font-semibold text-[var(--green-800)] pt-1">
                support@claimintel.ai
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
