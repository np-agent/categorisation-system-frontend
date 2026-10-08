"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { AppRole } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  cms_user_id?: string | null;
  email: string;
  full_name: string;
  role: AppRole;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  eula_accepted: boolean;
  eula_accepted_at: string | null;
};

type State = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Fetches the current user's profile from /api/v1/me.
 * The first call after a SelfBrief sign-in creates or updates the local profile.
 */
export function useCurrentUser(): State {
  const { userId, doesSessionExist, loading: sessionLoading } = useAuth();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const fetchedUser = await api.get<CurrentUser>("/api/v1/me");
    setUser(fetchedUser);
    setError(null);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setError(null);
      return;
    }

    let cancelled = false;

    api
      .get<CurrentUser>("/api/v1/me")
      .then((fetchedUser) => {
        if (cancelled) return;
        setUser(fetchedUser);
        setError(null);
      })
      .catch((err: Error & { status?: number }) => {
        if (cancelled) return;
        setUser(null);
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!doesSessionExist) {
    return { user: null, loading: sessionLoading, error: null, refresh };
  }

  const loading = sessionLoading || (user === null && error === null);

  return {
    user,
    loading,
    error,
    refresh,
  };
}
