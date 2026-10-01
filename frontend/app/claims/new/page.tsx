"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LegacyNewClaimRedirect() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    } else {
      router.replace("/user/claims/new");
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="py-20 flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
    </div>
  );
}
