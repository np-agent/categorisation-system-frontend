# Categorisation System Frontend

Next.js app for Airport Categorisation. People sign in with SelfBrief CMS.

How sign-in, roles, and the screens behave is in [docs/SYSTEM.md](docs/SYSTEM.md). The API side of the same decisions is in the backend repo at `docs/SYSTEM.md`.

## Local setup

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Copy `.env.example` to `.env.local` and fill in the CMS client id, client secret, and `AUTH_SECRET`.
