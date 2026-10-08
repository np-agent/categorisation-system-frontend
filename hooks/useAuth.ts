"use client";

import { useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const sessionError = Boolean(session?.error);
  const doesSessionExist =
    status === "authenticated" && Boolean(session) && !sessionError;
  const userId = doesSessionExist ? session?.user?.id ?? null : null;

  const signInWithSelfBrief = useCallback(async (callbackUrl?: string) => {
    await signIn("categorisation", { callbackUrl: callbackUrl || "/home" });
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  return {
    userId,
    doesSessionExist,
    loading,
    accessToken: session?.accessToken,
    error: session?.error,
    signInWithSelfBrief,
    signOut: handleSignOut,
  };
}
