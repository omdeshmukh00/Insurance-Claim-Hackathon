import React from "react";
import { RoleShell } from "@/components/layout/RoleShell";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell requiredRole="USER">{children}</RoleShell>;
}
