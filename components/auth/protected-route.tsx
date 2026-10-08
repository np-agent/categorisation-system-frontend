"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: React.ReactNode;
};

/**
 * Client-side session gate for protected pages.
 * Complements Next.js middleware, which checks the Auth.js session cookie.
 */
export function ProtectedRoute({ children }: Props) {
  const { doesSessionExist, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!doesSessionExist) {
      const reason = error ? "session" : "";
      router.replace(reason ? `/login?error=${reason}` : "/login");
    }
  }, [doesSessionExist, loading, error, router]);

  if (loading || !doesSessionExist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
