"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

function errorFromQuery(value: string | null): string {
  if (value === "deactivated") {
    return "Your account has been deactivated. Please contact your administrator.";
  }
  if (value === "org_deactivated") {
    return "Your organisation has been deactivated. Please contact your administrator.";
  }
  if (value === "session") {
    return "Your access was removed or your session has expired. Please sign in again.";
  }
  if (value === "AccessDenied") {
    return "Your SelfBrief account is not permitted to use this application.";
  }
  if (value === "Configuration" || value === "OAuthCallback") {
    return "Sign-in is not configured correctly. Please try again or contact support.";
  }
  if (value) {
    return "Sign-in was cancelled or could not be completed. Please try again.";
  }
  return "";
}

export function LoginForm() {
  const { signInWithSelfBrief, doesSessionExist, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && doesSessionExist && !searchParams.get("error")) {
      const redirectTo = searchParams.get("redirectTo") || "/home";
      router.replace(redirectTo);
    }
  }, [authLoading, doesSessionExist, router, searchParams]);

  useEffect(() => {
    setError(errorFromQuery(searchParams.get("error")));
  }, [searchParams]);

  async function handleSignIn() {
    setError("");
    setLoading(true);
    try {
      const redirectTo = searchParams.get("redirectTo") || "/home";
      await signInWithSelfBrief(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <div className="size-7 animate-spin rounded-full border-2 border-sidebar-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-[24rem]">
        <div className="mb-7 flex w-full flex-col items-center">
          <BrandLogo className="w-[90%] translate-x-[6%]" priority />
          <p className="mt-1 text-center text-sm tracking-wide text-sidebar-foreground/55">
            Aviation Intelligence
          </p>
        </div>

        <div className="rounded-xl border border-sidebar-border bg-card p-8 shadow-lg">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your SelfBrief account to continue
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={handleSignIn}
          >
            {loading ? "Redirecting..." : "Sign in with SelfBrief"}
          </Button>
        </div>
      </div>
    </div>
  );
}
