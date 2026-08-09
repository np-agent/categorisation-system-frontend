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
  const [state, setState] = useState<State>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (session.loading) return;

    if (!session.doesSessionExist) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    api
      .get<CurrentUser>("/api/v1/me")
      .then((user) => setState({ user, loading: false, error: null }))
      .catch(async (err: Error & { status?: number }) => {
        // 403 means is_active=false — sign out and redirect to login with an
        // error message so the user isn't left staring at a blank screen.
        if (err.status === 403) {
          const { signOut } = await import("supertokens-auth-react/recipe/session");
          await signOut();
          window.location.href = "/login?error=deactivated";
          return;
        }
        setState({ user: null, loading: false, error: err.message });
      });
  }, [session.loading, session.doesSessionExist]);

  return state;
}
