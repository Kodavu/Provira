# Deploying Tally (Vercel + Render + Supabase)

## Architecture reality first

There are **three deployables**, not four:

```
┌─────────────────┐     ┌─────────────────┐
│  Web (Vercel)   │     │ Admin (Vercel)  │     ← 2 front-ends
│  browser → API  │     │  BFF → API      │
└────────┬────────┘     └────────┬────────┘
         │  NEXT_PUBLIC_API_URL   │  ADMIN_API_URL (server-side)
         └───────────┬────────────┘
                     ▼
            ┌──────────────────┐
            │   API (Render)   │                ← 1 backend, serves BOTH
            │  /api/users …    │                  user + admin routes
            │  /api/admin/* 🔒 │                  (admin routes RBAC-guarded)
            └────────┬─────────┘
                     ▼
        ┌────────────────────────┐
        │  Postgres (Supabase)   │              ← 1 database
        └────────────────────────┘
```

There is **no separate admin backend** — the admin routes live in the same API
behind role-based auth. So you deploy **2 Vercel projects + 1 Render service +
1 Supabase database**. (If you want the admin API network-isolated too, see
§7 — you run a *second copy of the same service*, not different code.)

---

## Which env var belongs to which component

| Variable | API (Render) | Web (Vercel) | Admin (Vercel) | Notes |
|---|:---:|:---:|:---:|---|
| `NODE_ENV=production` | ✅ | | | |
| `DATABASE_URL` | ✅ | | | Supabase connection string |
| `JWT_SECRET` | ✅ | | | **long random** — never the dev value |
| `PUBLIC_API_URL` | ✅ | | | the API's own public URL + `/api`; used to build stored-file links |
| `PORT` | ✅ (auto) | | | Render injects it; the API now reads it |
| `PAYMENTS_PROVIDER` … `STORAGE_PROVIDER` | ✅ | | | `mock` until real adapters exist |
| `REDIS_URL` | ⬜ optional | | | not used at runtime yet — skip for now |
| `ADMIN_IP_ALLOWLIST` | ⬜ optional | | ✅ optional | API guard + admin edge middleware |
| `NEXT_PUBLIC_API_URL` | | ✅ | | **public, build-time** — baked into the browser bundle |
| `ADMIN_API_URL` | | | ✅ | **server-side only** — the admin browser never sees the API |

Key distinction:
- **Web** talks to the API **from the browser** → `NEXT_PUBLIC_API_URL` (public,
  baked at build time; a rebuild is needed to change it).
- **Admin** talks to the API **server-side only** (the BFF pattern — the JWT
  stays in an httpOnly cookie) → `ADMIN_API_URL` is a normal runtime env, never
  exposed to the browser. This is why the admin is safer to lock down.

---

## 1. Supabase (Postgres)

1. Create a project. Set a strong database password.
2. **Project Settings → Database → Connection string → URI**. Take the
   **direct** connection (port `5432`), not the pooler. It looks like:
   ```
   postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
3. Your `DATABASE_URL` (append schema + SSL):
   ```
   postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?schema=public&sslmode=require
   ```
4. Create the schema + audit hardening. From your machine (one-time), with that
   URL exported:
   ```bash
   export DATABASE_URL="…the URL above…"
   pnpm --filter @tally/db exec prisma db push
   pnpm --filter @tally/db harden
   ```
   > `db push` is fine to start. For change history later, switch to
   > `prisma migrate dev --name init` (commit it) + `prisma migrate deploy`.

5. **Seeding — do NOT seed demo data in production.** The seed creates demo
   users with *known passwords*. For a real environment, either skip it or seed
   only a single super-admin with a strong password. To try it end-to-end first,
   you can run `pnpm --filter @tally/db seed` once and delete the demo accounts
   afterward.

---

## 2. Redis — skip for now

Nothing in the running code connects to Redis yet (it's provisioned for future
queues). Don't block on it. When you need it, add **Upstash** (free tier) and
set `REDIS_URL` on the API.

---

## 3. Render (the API)

Create a **Web Service** from the repo (branch
`claude/tally-fintech-architecture-2pveuo`).

- **Runtime:** Node
- **Root Directory:** *(leave blank — repo root; it's a monorepo)*
- **Node version:** pinned to 22 by the repo's `.node-version` file. (Without
  it Render grabs the newest Node, which can break the build.)
- **Build Command:**
  ```bash
  npx --yes pnpm@9.12.0 install --frozen-lockfile && npx --yes pnpm@9.12.0 --filter "@tally/api..." build
  ```
  The `@tally/api...` filter (note the trailing `...`) builds `@tally/api` **and
  every workspace package it depends on** — contracts, db (incl. `prisma
  generate`), core, integrations, i18n — in dependency order.
- **Start Command:**
  ```bash
  npx --yes pnpm@9.12.0 --filter @tally/api start
  ```
- **Pre-Deploy Command** (runs migrations/hardening on each deploy):
  ```bash
  npx --yes pnpm@9.12.0 --filter @tally/db exec prisma db push && npx --yes pnpm@9.12.0 --filter @tally/db harden
  ```

> **Why `npx pnpm` and not `corepack enable`?** Render's filesystem is
> read-only outside your project dir, so `corepack enable` fails with
> `EROFS: read-only file system, unlink '/usr/bin/pnpm'`. `npx --yes
> pnpm@9.12.0` fetches pnpm into npm's writable cache and never touches
> `/usr/bin`. (Same reason you'll see it used for the start/pre-deploy commands.)
- **Environment variables:**
  ```
  NODE_ENV=production
  DATABASE_URL=…the Supabase URL…
  JWT_SECRET=<generate a long random string>
  PUBLIC_API_URL=https://<your-service>.onrender.com/api
  PAYMENTS_PROVIDER=mock
  SMS_PROVIDER=mock
  EMAIL_PROVIDER=mock
  PUSH_PROVIDER=mock
  STORAGE_PROVIDER=mock
  LLM_PROVIDER=mock
  ```
  (Don't set `API_PORT` — Render injects `PORT`, which the API now reads.)

Deploy, then note the URL, e.g. `https://tally-api.onrender.com`. Health-check
it: `curl https://tally-api.onrender.com/api/health` (or the root, which 404s
but proves it's up).

> ⚠️ **Render disk is ephemeral.** The `mock` storage adapter writes uploaded
> files to local disk, so **uploads are lost on every deploy/restart**. For any
> real persistence you must implement an S3/GCS adapter (the interface exists at
> `packages/integrations/src/storage/`) and set `STORAGE_PROVIDER=s3`.

---

## 4. Vercel — Web (user front-end)

New Project → import the repo.

- **Framework Preset:** Next.js
- **Root Directory:** `apps/web` ← **this is the setting that matters most** (see below)
- **Build Command (override):** `pnpm --filter "@tally/web..." build`
- **Install Command:** `pnpm install --frozen-lockfile`
- **Environment variable:**
  ```
  NEXT_PUBLIC_API_URL=https://tally-api.onrender.com/api
  ```

> **If you get `Error: No Output Directory named "public" found`** — the Root
> Directory isn't set to `apps/web`. Vercel then builds from the repo root,
> can't detect Next.js there, and looks for a static `public/` folder. Set
> **Settings → General → Root Directory → `apps/web`** and redeploy; the output
> then resolves to `apps/web/.next` automatically. (Install still runs at the
> workspace root — Vercel sees `pnpm-workspace.yaml` above.)

> **If the production URL 404s but the build succeeded** — Vercel points the
> production domain at your **Production Branch** (default `main`). Deploying
> from a feature branch produces a *preview* URL, not the production alias, so
> the production URL 404s. Either **⋯ → Promote to Production** on the good
> deployment, or set **Settings → Git → Production Branch** to your branch.

(Vercel has native pnpm support and no read-only-FS issue, so plain `pnpm`
works here — no `npx` needed. The `"@tally/web..."` filter builds the app's
workspace deps first, then `next build`.)

Because Vercel detects the pnpm workspace, `install` runs at the repo root and
links `@tally/*` packages; the Turbo build compiles those packages before
`next build`. Deploy → e.g. `https://tally.vercel.app`.

---

## 5. Vercel — Admin (back-office front-end)

New Project → same repo, **second project**.

- **Framework Preset:** Next.js
- **Root Directory:** `apps/admin`
- **Build Command (override):** `pnpm --filter "@tally/admin..." build`
- **Install Command:** `pnpm install --frozen-lockfile`
- **Environment variables:**
  ```
  ADMIN_API_URL=https://tally-api.onrender.com/api
  ADMIN_IP_ALLOWLIST=<your office/VPN CIDRs>     # optional but recommended
  ```

Put it on its **own domain** (e.g. `admin.yourdomain.com`) and behind your
VPN/SSO. `ADMIN_API_URL` is server-side only — the admin browser never calls the
API directly, so there's no CORS to configure for admin.

---

## 6. Wire-up order & CORS

1. Deploy **Supabase** → get `DATABASE_URL`.
2. Deploy **Render API** with that URL → get the API URL → set `PUBLIC_API_URL`
   to it and redeploy.
3. Deploy **Web** and **Admin** on Vercel with the API URL.
4. **CORS:** the web calls the API from the browser, so the API must allow the
   web's origin. Today `main.ts` calls `app.enableCors()` (allows *all* origins
   — works, but permissive). Tighten it to your web domain before launch, e.g.:
   ```ts
   app.enableCors({ origin: [process.env.WEB_ORIGIN ?? "http://localhost:3000"], credentials: true });
   ```
   (Admin needs no CORS — it's server-to-server.)

---

## 7. Optional: isolate the admin API on the network

If you want the admin's *backend* traffic separated too (defence in depth),
deploy the **same API image a second time** as a second Render service —
identical build/start, **same `DATABASE_URL`**, but:

- give it `ADMIN_IP_ALLOWLIST=<VPN CIDRs>` so only your network reaches it, and
- point the **Admin** Vercel project's `ADMIN_API_URL` at *this* instance, while
  the **Web** project keeps pointing at the public instance.

Both instances are the same code over the same database; the admin routes are
still RBAC-guarded either way. This buys network isolation without splitting the
codebase.

---

## Pre-launch checklist

- [ ] Strong `JWT_SECRET`; demo seed accounts removed.
- [ ] Real adapters for anything you actually use: payments, SMS, email, push,
      and **object storage** (Render disk is ephemeral — uploads need S3/GCS).
- [ ] A **user-session guard** on the API — user routes currently trust the
      `userId` in the path (admin routes are already authed + RBAC'd).
- [ ] CORS restricted to the web origin; HTTPS everywhere.
- [ ] Admin behind IP allowlist / SSO on its own domain.
- [ ] Switch `db push` → committed Prisma **migrations** (`migrate deploy`).
