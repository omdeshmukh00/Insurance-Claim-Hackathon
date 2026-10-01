"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LegacyClaimDetailRedirect() {
  const params = useParams();
  const id = params.id as string;
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
    } else if (role === "ADMIN") {
      router.replace(`/admin/claims/${id}`);
    } else {
      router.replace(`/user/claims/${id}`);
    }
  }, [user, role, id, isLoading, router]);

  return (
    <div className="py-20 flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-[var(--green-600)] border-t-transparent animate-spin" />
    </div>
  );
}
