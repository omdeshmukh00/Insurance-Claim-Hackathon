import React from "react";
import { RoleShell } from "@/components/layout/RoleShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell requiredRole="ADMIN">{children}</RoleShell>;
}
