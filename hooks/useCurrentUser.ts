"use client";

import { useEffect, useState } from "react";
import { useSessionContext } from "supertokens-auth-react/recipe/session";
import { api } from "@/lib/api";
import type { AppRole } from "@/lib/roles";

export type CurrentUser = {
  id: string;
  supertokens_user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  organization_id: string;
  is_active: boolean;
  created_at: string;
};

type State = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
};

/**
 * Fetches the current user's profile from /api/v1/me.
 * On the very first call after signup, the backend creates the profile record.
 * Returns null while the SuperTokens session is still initialising.
 */
export function useCurrentUser(): State {
  const session = useSessionContext();
  const sessionLoading = session.loading;
  const doesSessionExist = !session.loading && session.doesSessionExist;
  const userId =
    !session.loading && session.doesSessionExist ? session.userId : null;

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    api
      .get<CurrentUser>("/api/v1/me")
      .then((fetchedUser) => {
        if (cancelled) return;
        setUser(fetchedUser);
        setError(null);
      })
      .catch(async (err: Error & { status?: number }) => {
        if (cancelled) return;
        // 403 means is_active=false — sign out and redirect to login with an
        // error message so the user isn't left staring at a blank screen.
        if (err.status === 403) {
          const { signOut } = await import("supertokens-auth-react/recipe/session");
          await signOut();
          window.location.href = "/login?error=deactivated";
          return;
        }
        setUser(null);
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!doesSessionExist) {
    return { user: null, loading: sessionLoading, error: null };
  }

  const userMatchesSession =
    user !== null && user.supertokens_user_id === userId;
  const loading = sessionLoading || (!userMatchesSession && error === null);

  return {
    user: userMatchesSession ? user : null,
    loading,
    error,
  };
}
