/**
 * Thin wrapper around fetch for backend API calls.
 *
 * Auth.js keeps the CMS access token in an encrypted session cookie.
 * Each request attaches it as Authorization: Bearer ...
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    const { auth } = await import("@/auth");
    const session = await auth();
    return session?.accessToken ?? null;
  }
  const { getSession } = await import("next-auth/react");
  const session = await getSession();
  return session?.accessToken ?? null;
}

async function signOutToLogin(reason?: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  try {
    const { signOut } = await import("next-auth/react");
    await signOut({ redirect: false });
  } catch {
    // Session may already be gone; the redirect below still applies.
  }
  const query = reason ? `?error=${reason}` : "";
  window.location.href = `/login${query}`;
}

/**
 * The backend answers 403 for a deactivated account or organisation. Handling
 * it here means any request from any screen ends the session, instead of each
 * caller having to notice and the user being left on a half-broken page.
 */
async function handleRevokedAccess(detail: string) {
  const reason = /organisation/i.test(detail) ? "org_deactivated" : "deactivated";
  await signOutToLogin(reason);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse errors
    }
    if (res.status === 401) {
      await signOutToLogin("session");
    }
    if (res.status === 403 && /deactivated/i.test(detail)) {
      await handleRevokedAccess(detail);
    }
    if (res.status === 403 && /not permitted|no organisation/i.test(detail)) {
      await signOutToLogin("AccessDenied");
    }

    const err = new Error(detail) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};
