"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { signIn, signUp, doesSessionExist, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    setIsSignUp(mode === "signup");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && doesSessionExist) {
      const redirectTo = searchParams.get("redirectTo") || "/home";
      router.replace(redirectTo);
    }
  }, [authLoading, doesSessionExist, router, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error: signUpError, needsVerification } = await signUp(email, password);
        if (signUpError) {
          setError(signUpError.message);
        } else if (needsVerification) {
          setSuccess(
            "Account created! Please check your email to verify your account before signing in."
          );
        } else {
          router.replace(searchParams.get("redirectTo") || "/home");
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else {
          router.replace(searchParams.get("redirectTo") || "/home");
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-orange-500" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            {isSignUp ? "Create Account" : "Sign In"}
          </h1>
          <p className="text-slate-600">
            {isSignUp
              ? searchParams.get("email")
                ? "Complete your invitation signup"
                : "Create your account to get started"
              : "Sign in to your account"}
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

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v);
              setError("");
              setSuccess("");
            }}
            className="text-orange-600 hover:underline"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>

          {!isSignUp && (
            <div>
              <Link
                href="/reset-password"
                className="text-slate-600 hover:text-orange-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
