"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export function LoginForm() {
  const { signIn, signUp, doesSessionExist, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    setIsSignUp(mode === "signup");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && doesSessionExist && !searchParams.get("error")) {
      const redirectTo = searchParams.get("redirectTo") || "/home";
      router.replace(redirectTo);
    }
  }, [authLoading, doesSessionExist, router, searchParams]);

  // Show a persistent banner for errors passed via URL (e.g. deactivated account)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "deactivated") {
      setError("Your account has been deactivated. Please contact your administrator.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!password.trim()) { setError("Password is required"); return; }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error: err } = await signUp(email, password);
        if (err) { setError(err.message); }
        else { router.replace(searchParams.get("redirectTo") || "/home"); }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) { setError(err.message); return; }

        // Check our DB — account may exist in SuperTokens but be deactivated
        try {
          await api.get("/api/v1/me");
          router.replace(searchParams.get("redirectTo") || "/home");
        } catch (meErr: unknown) {
          const status = (meErr as { status?: number }).status;
          if (status === 403) {
            const { signOut } = await import("supertokens-auth-react/recipe/session");
            await signOut();
            setError("Your account has been deactivated. Please contact your administrator.");
          } else {
            router.replace(searchParams.get("redirectTo") || "/home");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Mark sits to the right of the wordmark, so nudge right for optical center */}
          <BrandLogo className="w-[90%] translate-x-[6%]" priority />
          <p className="mt-1 text-center text-sm tracking-wide text-sidebar-foreground/55">
            Aviation Intelligence
          </p>
        </div>

        <div className="rounded-xl border border-sidebar-border bg-card p-8 shadow-lg">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">
              {isSignUp ? "Create account" : "Sign in"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp
                ? searchParams.get("email")
                  ? "Complete your invitation to get started"
                  : "Create your account to get started"
                : "Sign in to your account to continue"}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <Link
                  href="/reset-password"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setIsSignUp((v) => !v); setError(""); }}
              className="font-medium text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
