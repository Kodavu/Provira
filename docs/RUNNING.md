# Running & testing Truvo

This guide gets the whole stack running locally so you can exercise every
feature built so far, then covers deploying it live.

- **API** — NestJS, serves on `http://localhost:4000/api`
- **Web** — Next.js (workers / traders / employers), `http://localhost:3000`
- **Admin** — Next.js back-office, `http://localhost:3001`
- **Mobile** — Expo (optional), runs via Expo Go / simulator
- **Infra** — PostgreSQL 16 + Redis 7

Everything runs on **mock integration adapters** (payments, SMS, email, push,
storage, LLM) — no real API keys required.

---

## 1. Prerequisites

- **Node.js ≥ 20**
- **pnpm 9.12** — `corepack enable && corepack prepare pnpm@9.12.0 --activate`
- Either **Docker** (easiest for Postgres/Redis/API) **or** local **PostgreSQL 16** + **Redis 7**

Clone and install:

```bash
git clone <repo-url> truvo && cd truvo
git checkout claude/truvo-fintech-architecture-2pveuo
pnpm install
```

---

## 2. Start the backend

Pick **one** of the two options.

### Option A — Docker (backend only)

Brings up Postgres + Redis + the API (it builds packages, pushes the schema,
applies the audit hardening, seeds demo data, then serves):

```bash
docker compose up
```

Wait for `Truvo API listening on http://localhost:4000/api`. Leave it running.
The web and admin apps are **not** in compose — start them in step 3.

### Option B — Local Postgres/Redis (no Docker)

```bash
# 1. Create the database + role (once)
createuser truvo --pwprompt        # set password: truvo
createdb truvo -O truvo
# (or: psql -c "CREATE ROLE truvo LOGIN PASSWORD 'truvo'; CREATE DATABASE truvo OWNER truvo;")

# 2. Make sure Redis is running (redis-server)

# 3. Point the app at them
export DATABASE_URL="postgresql://truvo:truvo@localhost:5432/truvo?schema=public"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="dev-only-change-me"

# 4. Build the workspace packages (apps import their built output)
pnpm --filter './packages/*' build

# 5. Create the schema, apply audit hardening, seed demo data
pnpm --filter @truvo/db push
pnpm --filter @truvo/db harden
pnpm --filter @truvo/db seed

# 6. Run the API
pnpm --filter @truvo/api dev        # http://localhost:4000/api
```

> **Tip:** copy `.env.example` to `.env` at the repo root and the app picks up
> the same values without exporting them each time.

---

## 3. Start the front-ends

In separate terminals (with the API already running):

```bash
pnpm --filter @truvo/web dev        # http://localhost:3000  (workers/traders/employers)
pnpm --filter @truvo/admin dev      # http://localhost:3001  (back-office)
```

Each reads its API base from `.env` (`NEXT_PUBLIC_API_URL` / `ADMIN_API_URL`,
both default to `http://localhost:4000/api`).

---

## 4. Test accounts (seeded)

### Admin back-office — `http://localhost:3001`

Log in with email + password. Each role sees a **different** set of nav items
and actions (RBAC), so switch accounts to see the whole surface:

| Email                    | Password         | Role              | Can do |
|--------------------------|------------------|-------------------|--------|
| `superadmin@truvo.com.ng`    | `admin1234`      | Super Admin       | Everything |
| `finance@truvo.com.ng`       | `finance1234`    | Finance Team      | Withdrawal approvals, ledger |
| `compliance@truvo.com.ng`    | `compliance1234` | Compliance & Risk | KYC review, **approve** impersonation |
| `ops@truvo.com.ng`           | `ops1234`        | Operations Team   | Dispute assign/reply, **request** impersonation, notification templates |
| `support@truvo.com.ng`       | `support1234`    | Customer Support  | Dispute view/reply |
| `hr@truvo.com.ng`            | `hr1234`         | HR / Admin Mgmt   | Staff management |

### Web (workers / traders / employers) — `http://localhost:3000`

Login is **phone + OTP**. Because SMS is mocked, the OTP request response
returns a `devCode` — the login screen surfaces it, or you can grab it from the
API. Use these seeded phones:

| Phone            | Who                | Dashboard |
|------------------|--------------------|-----------|
| `+2348010000001` | Amaka (worker)     | `/worker` |
| `+2348010000002` | Musa (trader)      | `/trader` |
| `+2348010000003` | Bola (employer)    | `/employer` |

Grab a dev OTP from the API directly if you prefer:

```bash
curl -s -X POST http://localhost:4000/api/auth/otp/request \
  -H 'content-type: application/json' \
  -d '{"phone":"+2348010000001","purpose":"login"}'
# → {"sent":true,"devCode":"123456"}   ← enter that code on the login screen
```

---

## 5. A feature-by-feature test tour

**Notifications (bell + engine)** — Web, as Amaka (`/worker`). The bell (top
right) shows seeded notifications. Now open Admin as `ops@truvo.com.ng`, go to a
dispute (DSP-1001) and post a **reply** — refresh the worker's bell and it
appears (the reply fans out in-app + mock SMS). `/settings` on web lets the user
toggle channels / mute / quiet hours.

**Notification templates** — Admin as `ops@truvo.com.ng` → **Notifications**. Edit
the copy for an event/channel/language, Save, then trigger that event again and
the new wording is used. Reset-to-default reverts.

**Disputes** — Admin as `ops@truvo.com.ng` → **Disputes** → open one. Assign,
reply to the user (Conversation), add an internal note, attach evidence,
resolve/close. Everything is on the timeline and the audit log.

**Finance / withdrawals** — Web as Amaka: **Earnings/Wallet** → request a
withdrawal (funds are held). Admin as `finance@truvo.com.ng` → **Finance**:
approve (dispatches the mock payout + notifies the user) or reject (funds
return to the wallet). The ledger feed shows the double-entry legs.

**KYC / verification** — Web as Bola (`+2348010000003`) → **Verify identity**:
choose a level, enter a BVN, attach a document (real file upload), submit. Admin
as `compliance@truvo.com.ng` → **Verification** → open the request → the document
**Open** link serves the real uploaded file → Approve (bumps KYC level, notifies)
or Reject (with a reason).

**Impersonation** — Admin as `ops@truvo.com.ng` → **Users** → "View as" a user
(read-only session) or "Act as…" (files a request). As `compliance@truvo.com.ng` →
**Impersonation** → approve the request. Back as `ops@truvo.com.ng` → **Impersonation**
→ Start session → view the user's world; WRITE sessions expose audited "act on
their behalf" actions. Sessions expire after 30 min.

**Staff / RBAC** — Admin as `hr@truvo.com.ng` → **Staff**: invite an admin, assign
roles. Notice `hr` can't see Finance/Disputes — the nav is filtered by the same
permissions the API enforces.

**Audit log** — Admin as `superadmin@truvo.com.ng` → **Audit Logs**: every admin
action above is recorded and the table is append-only at the database level.

### Mobile (optional)

```bash
cd apps/mobile
cp .env.example .env      # set EXPO_PUBLIC_API_URL to your machine's LAN IP for a real device
pnpm start                # scan the QR with Expo Go, or press i / a for a simulator
```

---

## 6. Reset / reseed

To wipe and repopulate demo data at any time:

```bash
export DATABASE_URL="postgresql://truvo:truvo@localhost:5432/truvo?schema=public"
pnpm --filter @truvo/db exec prisma db push --force-reset --skip-generate
pnpm --filter @truvo/db harden        # MUST re-run — force-reset drops the trigger
pnpm --filter @truvo/db seed
```

(Under Docker, `docker compose down -v && docker compose up` does the same on a
fresh volume.)

---

## 7. Deploying live

The pieces deploy independently. A common, low-ops setup:

| Component | Where | Notes |
|-----------|-------|-------|
| PostgreSQL | Neon / Supabase / RDS | set `DATABASE_URL` |
| Redis | Upstash / managed | set `REDIS_URL` |
| API | Fly.io / Render / Railway / Cloud Run | container (Dockerfile at `apps/api/Dockerfile`) |
| Web + Admin | Vercel (or Node host) | Next.js apps |
| Mobile | Expo EAS build → app stores | `EXPO_PUBLIC_API_URL` → deployed API |

### API — required env in production

```
NODE_ENV=production
DATABASE_URL=postgresql://…              # managed Postgres
REDIS_URL=redis://…
JWT_SECRET=<long random secret>          # CHANGE THIS — do not ship the dev value
API_PORT=4000
PUBLIC_API_URL=https://api.yourdomain.com/api   # used for stored-file URLs
ADMIN_IP_ALLOWLIST=<office/VPN CIDRs>    # lock the admin surface down
# Integration providers — still "mock" until real adapters are added (see gaps)
PAYMENTS_PROVIDER=mock
SMS_PROVIDER=mock
EMAIL_PROVIDER=mock
PUSH_PROVIDER=mock
STORAGE_PROVIDER=mock
```

### Database migrations for production

Local dev uses `prisma db push` (no migration history). For production, generate
a migration once and deploy it through your pipeline:

```bash
# one-time, committed to the repo
pnpm --filter @truvo/db exec prisma migrate dev --name init

# in CI/CD, against the production database
pnpm --filter @truvo/db exec prisma migrate deploy
pnpm --filter @truvo/db harden          # re-apply the audit trigger after deploy
```

### Front-ends

- **Web** on Vercel: set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`.
- **Admin** on Vercel (or a separate, access-controlled host): set
  `ADMIN_API_URL` and `ADMIN_IP_ALLOWLIST`. Put it on its own domain and behind
  your VPN/SSO — it's the back-office.

### ⚠️ Before real users / real money — known gaps

This build is a working, end-to-end demo. These must be closed before it
handles production traffic:

1. **Integration adapters are mocks.** Payments (Paystack/OPay), SMS (Termii),
   email (SES/SendGrid), push (Expo/FCM), and object storage (S3/GCS) all need
   real adapters implemented behind their existing interfaces. The wiring points
   (`*_PROVIDER` env vars + DI factories) are already there.
2. **The user-facing API is unauthenticated** — endpoints trust the `userId` in
   the path. A user session guard (binding the JWT `sub` to `:userId`) is needed
   platform-wide. (The admin surface *is* fully authenticated + RBAC'd.)
3. **Object storage** serves files by unguessable key but without access
   control — production KYC docs need signed, expiring URLs.
4. **Secrets & TLS** — set a strong `JWT_SECRET`, serve everything over HTTPS,
   restrict CORS, and run the API under a DB role with `INSERT/SELECT`-only on
   `AdminAuditLog` (plus a nightly audit export), per `harden.sql`.
5. **KYC/BVN** currently hashes the number and stores a document reference — a
   real deployment integrates an identity-verification provider.

CI (`.github/workflows/ci.yml`) runs typecheck + tests + build on every PR.
