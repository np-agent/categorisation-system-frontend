"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function ResetPasswordForm() {
  const { resetPassword, updatePassword, getResetTokenFromUrl } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = getResetTokenFromUrl();
    setHasToken(Boolean(token));
  }, [getResetTokenFromUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (hasToken) {
        if (!password.trim()) { setError("New password is required"); return; }
        if (!confirmPassword.trim()) { setError("Please confirm your new password"); return; }
        if (password !== confirmPassword) { setError("Passwords do not match"); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters"); return; }

        const { error: err } = await updatePassword(password);
        if (err) {
          setError(err.message);
        } else {
          setSuccess("Password updated. Redirecting to sign in...");
          setTimeout(() => router.replace("/login"), 1500);
        }
      } else {
        if (!email.trim()) { setError("Email is required"); return; }

        const { error: err } = await resetPassword(email);
        if (err) {
          setError(err.message);
        } else {
          setSuccess("Check your email for a password reset link.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-xl font-semibold text-foreground">
              {hasToken ? "Set new password" : "Reset password"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasToken
                ? "Enter your new password below"
                : "Enter your email to receive a reset link"}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!hasToken && (
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
            )}

            {hasToken && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
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

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              {loading
                ? "Please wait..."
                : hasToken
                  ? "Update password"
                  : "Send reset link"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
