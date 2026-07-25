"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        if (!password.trim()) {
          setError("New password is required");
          return;
        }
        if (!confirmPassword.trim()) {
          setError("Please confirm your new password");
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters long");
          return;
        }

        const { error: updateError } = await updatePassword(password);
        if (updateError) {
          setError(updateError.message);
        } else {
          setSuccess("Password updated successfully! Redirecting to sign in...");
          setTimeout(() => router.replace("/login"), 1500);
        }
      } else {
        if (!email.trim()) {
          setError("Email is required");
          return;
        }

        const { error: resetError } = await resetPassword(email);
        if (resetError) {
          setError(resetError.message);
        } else {
          setSuccess(
            "Password reset link sent! Check your email and click the link to reset your password."
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {hasToken ? "Set New Password" : "Reset Password"}
          </h1>
          <p className="text-slate-600">
            {hasToken
              ? "Enter your new password below"
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!hasToken && (
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
          )}

          {hasToken && (
            <>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-16 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-sm text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Please wait..." : hasToken ? "Update Password" : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-orange-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
