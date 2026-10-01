"use client";
import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./States";
import { LoadingState } from "./States";

/* ── Column definition ── */
export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

/* ── DataTable Props ── */
export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  /** Compact row height */
  compact?: boolean;
}

type SortDir = "asc" | "desc" | null;

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription,
  onRowClick,
  className,
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey]     = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<SortDir>(null);

  function handleSort(key: string) {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); return; }
    setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
    if (sortDir === "desc") setSortKey(null);
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const va = String(col.accessor(a) ?? "");
      const vb = String(col.accessor(b) ?? "");
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [data, sortKey, sortDir, columns]);

  const rowPadding = compact ? "px-4 py-2" : "px-5 py-3.5";

  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-card)]", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          {/* Header */}
          <thead>
            <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const SortIcon = isSorted ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    className={cn(
                      "text-left text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider whitespace-nowrap",
                      rowPadding,
                      col.sortable && "cursor-pointer hover:text-[var(--text-primary)] select-none",
                      col.align === "center" && "text-center",
                      col.align === "right"  && "text-right",
                    )}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <SortIcon
                          className={cn("h-3 w-3 transition-colors", isSorted ? "text-[var(--green-600)]" : "opacity-40")}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length}>
                  <LoadingState variant="spinner" label="Loading data…" className="py-12" />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} className="py-12" />
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors duration-100",
                    onRowClick && "cursor-pointer hover:bg-[var(--green-50)]"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "text-sm text-[var(--text-primary)] whitespace-nowrap",
                        rowPadding,
                        col.align === "center" && "text-center",
                        col.align === "right"  && "text-right"
                      )}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
