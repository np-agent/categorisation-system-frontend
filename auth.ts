import NextAuth from "next-auth";

const SELFBRIEF_SCOPE = "openid profile airports:read";

const SelfBrief = {
  id: "categorisation",
  name: "SelfBrief",
  type: "oidc" as const,
  issuer: process.env.SELFBRIEF_ISSUER,
  clientId: process.env.SELFBRIEF_CLIENT_ID,
  clientSecret: process.env.SELFBRIEF_CLIENT_SECRET,
  authorization: {
    params: { scope: SELFBRIEF_SCOPE },
  },
  checks: ["pkce", "state", "nonce"] as Array<"pkce" | "state" | "nonce">,
  profile(claims: { sub?: string; name?: string; email?: string }) {
    return {
      id: String(claims.sub ?? ""),
      name: claims.name,
      email: claims.email,
    };
  },
};

type RefreshableToken = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
  error?: string;
  sub?: string;
  name?: string | null;
  email?: string | null;
};

let cachedTokenEndpoint: string | null = null;

async function getTokenEndpoint(): Promise<string> {
  if (cachedTokenEndpoint) return cachedTokenEndpoint;
  const issuer = (process.env.SELFBRIEF_ISSUER || "").replace(/\/$/, "");
  if (!issuer) {
    throw new Error("SELFBRIEF_ISSUER is not set");
  }
  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!response.ok) {
    throw new Error("Could not load SelfBrief OpenID configuration");
  }
  const discovery = (await response.json()) as { token_endpoint?: string };
  if (!discovery.token_endpoint) {
    throw new Error("SelfBrief OpenID configuration is missing token_endpoint");
  }
  cachedTokenEndpoint = discovery.token_endpoint;
  return cachedTokenEndpoint;
}

async function refreshAccessToken(token: RefreshableToken): Promise<RefreshableToken> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
  try {
    const tokenEndpoint = await getTokenEndpoint();
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
        client_id: process.env.SELFBRIEF_CLIENT_ID || "",
        client_secret: process.env.SELFBRIEF_CLIENT_SECRET || "",
      }),
    });
    const refreshed = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };
    if (!response.ok || !refreshed.access_token) {
      throw new Error(refreshed.error || "Token refresh failed");
    }
    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpiresAt:
        Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 900),
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

async function categorisationAccessAllowed(
  accessToken: string,
  idToken?: string | null
): Promise<boolean | "unavailable"> {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  if (idToken) headers["X-SelfBrief-Id-Token"] = idToken;
  try {
    const response = await fetch(`${base}/api/v1/me`, {
      headers,
      cache: "no-store",
    });
    if (response.ok) return true;
    if (response.status === 401 || response.status === 403) return false;
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [SelfBrief],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "categorisation") return true;
      if (!account.access_token) return false;
      const allowed = await categorisationAccessAllowed(
        account.access_token,
        account.id_token
      );
      if (allowed === "unavailable") return "/login?error=Configuration";
      return allowed;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpiresAt =
          account.expires_at ?? Math.floor(Date.now() / 1000) + 900;
        if (profile?.sub) token.sub = String(profile.sub);
        if (profile?.name) token.name = profile.name;
        if (profile?.email) token.email = profile.email;
        token.error = undefined;
        return token;
      }

      const expiresAt = Number(token.accessTokenExpiresAt || 0);
      const stillValid = Date.now() < (expiresAt - 60) * 1000;
      if (stillValid && token.accessToken) {
        return token;
      }

      return refreshAccessToken(token as RefreshableToken);
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.accessTokenExpiresAt = token.accessTokenExpiresAt as number | undefined;
      session.error = token.error as string | undefined;
      if (session.user) {
        session.user.id = String(token.sub || "");
      }
      return session;
    },
  },
});
