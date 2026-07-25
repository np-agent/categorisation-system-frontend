"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmailVerification from "supertokens-auth-react/recipe/emailverification";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const token = EmailVerification.getEmailVerificationTokenFromURL();
    if (!token) return;

    let cancelled = false;
    (async () => {
      setStatus("verifying");
      try {
        const response = await EmailVerification.verifyEmail();
        if (cancelled) return;
        if (response.status === "OK") {
          setStatus("success");
          setMessage("Email verified. Redirecting...");
          setTimeout(() => router.replace("/home"), 1200);
        } else if (response.status === "EMAIL_VERIFICATION_INVALID_TOKEN_ERROR") {
          setStatus("error");
          setMessage("Verification link is invalid or expired.");
        } else {
          setStatus("error");
          setMessage("Could not verify email.");
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Could not verify email.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const resend = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const response = await EmailVerification.sendVerificationEmail();
      if (response.status === "OK") {
        setMessage("Verification email sent. Check your inbox.");
      } else if (response.status === "EMAIL_ALREADY_VERIFIED_ERROR") {
        setMessage("Email is already verified.");
        router.replace("/home");
      } else {
        setMessage("Could not send verification email.");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send verification email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Verify Email</h1>
        <p className="mb-6 text-center text-slate-600">
          {status === "verifying"
            ? "Verifying your email..."
            : "Confirm your email address to continue."}
        </p>

        {message && (
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
              status === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {message}
          </div>
        )}

        {status !== "verifying" && status !== "success" && (
          <form onSubmit={resend} className="space-y-4">
            <button
              type="submit"
              disabled={sending}
              className="flex w-full items-center justify-center rounded-lg bg-orange-500 px-4 py-2.5 font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Resend verification email"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-orange-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
