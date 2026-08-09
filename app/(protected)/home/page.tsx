"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getDefaultRouteForRoles } from "@/lib/navigation";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (loading) return;
    const role = user?.role ?? "user";
    router.replace(getDefaultRouteForRoles([role]));
  }, [user, loading, router]);

  return null;
}
