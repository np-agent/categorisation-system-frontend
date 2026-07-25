"use client";

import { useEffect, useState } from "react";
import { SessionAuth } from "supertokens-auth-react/recipe/session";

type Props = {
  children: React.ReactNode;
};

/**
 * Client-side session gate for protected pages.
 * Complements Next.js middleware (which checks the SuperTokens front-token cookie).
 */
export function ProtectedRoute({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <SessionAuth>{children}</SessionAuth>;
}
