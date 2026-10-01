"use client";
import React, { useCallback, useState, useRef } from "react";
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress?: number;
  error?: string;
  previewUrl?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  disabled?: boolean;
  onFilesChange?: (files: UploadedFile[]) => void;
  hint?: string;
  className?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function FileUpload({
  accept = "*/*",
  multiple = false,
  maxSizeMB = 10,
  disabled = false,
  onFilesChange,
  hint,
  className,
}: FileUploadProps) {
  const [files, setFiles]   = useState<UploadedFile[]>([]);
  const [isDragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      const uploads: UploadedFile[] = newFiles.map((f) => ({
        id:    crypto.randomUUID(),
        file:  f,
        status: f.size > maxBytes ? "error" : "pending",
        error:  f.size > maxBytes ? `File exceeds ${maxSizeMB}MB limit` : undefined,
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      }));
      const updated = multiple ? [...files, ...uploads] : uploads;
      setFiles(updated);
      onFilesChange?.(updated);
    },
    [files, multiple, maxSizeMB, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updated = files.filter((f) => f.id !== id);
      setFiles(updated);
      onFilesChange?.(updated);
    },
    [files, onFilesChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      addFiles(Array.from(e.dataTransfer.files));
    },
    [disabled, addFiles]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 p-8",
          "border-2 border-dashed rounded-[var(--radius-xl)] cursor-pointer transition-all duration-200",
          "text-center outline-none",
          isDragging
            ? "border-[var(--green-500)] bg-[var(--green-50)]"
            : "border-[var(--border-default)] bg-[var(--bg-subtle)] hover:border-[var(--green-400)] hover:bg-[var(--green-50)]",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className={cn(
          "p-3 rounded-[var(--radius-xl)] transition-colors",
          isDragging ? "bg-[var(--green-100)] text-[var(--green-600)]" : "bg-[var(--bg-card)] text-[var(--text-muted)]"
        )}>
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {isDragging ? "Drop files here" : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {hint ?? `${accept !== "*/*" ? accept.replace(/,/g, ", ") : "Any file type"} — max ${maxSizeMB}MB`}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-[var(--border-subtle)]"
            >
              {/* Thumbnail or icon */}
              {f.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.previewUrl} alt={f.file.name} className="h-8 w-8 object-cover rounded-[var(--radius-md)] shrink-0" />
              ) : (
                <div className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-subtle)] shrink-0">
                  <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
                </div>
              )}
              {/* Name & size */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{f.file.name}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{formatBytes(f.file.size)}</p>
                {f.error && <p className="text-[10px] text-[var(--color-error)] mt-0.5">{f.error}</p>}
              </div>
              {/* Status icon */}
              <div className="shrink-0">
                {f.status === "done"  && <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />}
                {f.status === "error" && <AlertCircle  className="h-4 w-4 text-[var(--color-error)]" />}
              </div>
              {/* Remove */}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                className="shrink-0 p-1 rounded hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors"
                aria-label="Remove file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
