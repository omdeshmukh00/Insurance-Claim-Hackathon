"use client";
import React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Base Modal (low-level) ── */
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}
export function Modal({ open, onOpenChange, children }: ModalProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}
export const ModalTrigger = RadixDialog.Trigger;
export const ModalClose   = RadixDialog.Close;

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  title?: string;
  description?: string;
  /** Hide the ✕ close button */
  hideClose?: boolean;
}
export function ModalContent({
  size = "md",
  title,
  description,
  hideClose = false,
  className,
  children,
  ...props
}: ModalContentProps) {
  const sizes = {
    sm:   "max-w-sm",
    md:   "max-w-lg",
    lg:   "max-w-2xl",
    xl:   "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  return (
    <RadixDialog.Portal>
      {/* Overlay */}
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 z-[var(--z-modal)] bg-black/30 backdrop-blur-sm",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          "duration-200"
        )}
      />
      {/* Panel */}
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[calc(var(--z-modal)+1)]",
          "-translate-x-1/2 -translate-y-1/2",
          "w-full", sizes[size],
          "bg-[var(--bg-card)] rounded-[var(--radius-2xl)]",
          "border border-[var(--border-subtle)] shadow-[var(--shadow-xl)]",
          "focus:outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-4",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "duration-200",
          className
        )}
        {...props}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--border-subtle)]">
            <div className="space-y-0.5">
              {title && (
                <RadixDialog.Title className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                  {title}
                </RadixDialog.Title>
              )}
              {description && (
                <RadixDialog.Description className="text-sm text-[var(--text-tertiary)]">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            {!hideClose && (
              <RadixDialog.Close
                className={cn(
                  "rounded-[var(--radius-md)] p-1 shrink-0",
                  "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                  "hover:bg-[var(--bg-subtle)] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]"
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </RadixDialog.Close>
            )}
          </div>
        )}
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

/* ── ModalFooter ── */
export function ModalFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4",
        "border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]",
        "rounded-b-[var(--radius-2xl)] -mx-6 -mb-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Convenience Dialog (confirmation) ── */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  variant?: "default" | "danger";
  isConfirming?: boolean;
}
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isConfirming = false,
}: DialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm" title={title} description={description}>
        <div className="flex items-center justify-end gap-3 mt-6">
          <ModalClose asChild>
            <button
              className={cn(
                "h-9 px-4 text-sm font-medium rounded-[var(--radius-lg)]",
                "border border-[var(--border-default)] bg-[var(--bg-card)]",
                "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]",
                "transition-colors duration-150"
              )}
            >
              {cancelLabel}
            </button>
          </ModalClose>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={cn(
              "h-9 px-4 text-sm font-medium rounded-[var(--radius-lg)]",
              "text-white transition-colors duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              variant === "danger"
                ? "bg-[var(--color-error)] hover:bg-[var(--color-error-dark)]"
                : "bg-[var(--green-600)] hover:bg-[var(--green-700)]"
            )}
          >
            {isConfirming ? "Processing…" : confirmLabel}
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
}
