/**
 * Thin wrapper around fetch for backend API calls.
 *
 * SuperTokens writes a session cookie on login, so we just need
 * credentials: "include" on every request and the cookie is sent automatically.
 * Automatic token refresh is handled by the SuperTokens session interceptor
 * configured in lib/supertoken.ts.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * The backend answers 403 for a deactivated account or organisation. Handling
 * it here means any request from any screen ends the session, instead of each
 * caller having to notice and the user being left on a half-broken page.
 */
async function handleRevokedAccess(detail: string) {
  if (typeof window === "undefined") return;
  // Already on the login screen — it shows the message inline instead.
  if (window.location.pathname === "/login") return;

  const reason = /organisation/i.test(detail) ? "org_deactivated" : "deactivated";
  try {
    const { signOut } = await import("supertokens-auth-react/recipe/session");
    await signOut();
  } catch {
    // Session may already be gone; the redirect below still applies.
  }
  window.location.href = `/login?error=${reason}`;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse errors
    }
    if (res.status === 403 && /deactivated/i.test(detail)) {
      await handleRevokedAccess(detail);
    }

    const err = new Error(detail) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  // 204 No Content — return undefined rather than trying to parse an empty body
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
