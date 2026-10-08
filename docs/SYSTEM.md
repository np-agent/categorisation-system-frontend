# Airport Categorisation, frontend

How the app behaves, and the decisions behind it. Update this when the behaviour changes.

The API notes live in the backend repo at `docs/SYSTEM.md`.

## What this app does

Next.js. People sign in with SelfBrief, accept the licence, and run categorisation jobs. Organisation and user admin is for super-admins. Passwords, invites, and account creation live in SelfBrief CMS, not here.

## Sign-in

Auth.js (NextAuth v5) uses the OIDC provider id `categorisation`.

- Issuer: `SELFBRIEF_ISSUER` (dev is `https://dev-cms.selfbrief.aero/o`)
- Callback: `{origin}/api/auth/callback/categorisation`
- Scope: `openid profile airports:read` only. Adding `email`, `roles`, or `organisation` makes CMS reject the request.
- Open the app as `http://localhost:3000`. `127.0.0.1` does not match the registered redirect.

The client id and secret stay in `.env.local`. They are not committed.

Auth.js keeps the access and refresh tokens in an encrypted cookie and refreshes the access token about a minute before it expires. The access token lasts about 15 minutes and the refresh token about 12 hours.

Signing out of this app does not sign the browser out of CMS. A later "Sign in with SelfBrief" can reuse that CMS session. Use a private window when testing a different account.

## What happens after CMS redirects back

The `signIn` callback calls `GET /api/v1/me` with the new access token, and sends the ID token as `X-SelfBrief-Id-Token` when CMS issued one. The session is kept only when that call succeeds.

| API result | What the person sees |
|---|---|
| 200 | They enter the app. |
| 401 or 403 | No session. The login page says their SelfBrief account is not permitted to use this application. Covers a suspended account, an operator with categorisation switched off, and No Access. |
| Anything else (API down, misconfigured) | Login page, configuration error. |

Later API calls from `lib/api.ts`:

| Result | What the app does |
|---|---|
| 401 | Sign out to `/login?error=session` ("Your access was removed or your session has expired."). |
| 403 whose message says deactivated | Sign out to the deactivated or organisation-deactivated login error. This is a local super-admin archive or user deactivate, after CMS has already allowed the profile. |
| 403 whose message says not permitted, or no organisation | Sign out to the not-permitted login error. This is the CMS operator switch and the No Access case. |
| 403 for the licence | Stay on the licence screen. Do not sign out. |

The case-by-case database behaviour (who is marked inactive, and what is left alone) is in the backend doc. This app only reacts to the status codes above.

## Who sees what

Roles are `user`, `admin`, and `super-admin`, taken from `GET /api/v1/me`.

Users and organisation admins see Create New Job and All Jobs. Super-admins also see templates, airports, organisations, and Administration / SelfBrief Team Accounts.

If the profile request has not returned yet, the shell treats the person as a user so the two job links still show. It does not invent a super-admin.

The profile page reads the same `/me` payload. Saving the display name calls `PATCH /api/v1/me?full_name=`. CMS overwrites that name on the next profile load, so the email is the reliable check of who is signed in.

## Organisations and users screens

The organisation list defaults to live organisations. Archive is a filter. That live or Archive state is the local `is_active` flag. Signing in does not move an organisation between those lists. CMS is adding a separate scheduled task for that. Until it exists, switching an operator off in CMS signs that person out and the backend marks them inactive, but the organisation stays on the live list.

The user list defaults to active and pending. Inactive people stay hidden until the inactive filter is on. Someone who has never successfully signed in is not in the list. After a suspension, a removed role, or an operator switch-off, the backend marks that known person inactive, so they disappear from the default list.

## Licence and advisory

The current licence text is `legal/eula.txt` in the backend. Any edit of that file is a new version, and the app blocks the rest of the product until the person accepts again.

Job detail stays hidden until that person accepts the advisory notice for that job. Accepting one job does not accept the others.

## Left navigation

The rail is navy `#152F4D` with orange `#EF7D30`, Poppins, and Font Awesome solid icons. The product label under the logo is "Airport Categorisation". Collapsed Administration opens a flyout aligned to the icon. Plain icons do not have tooltips.
