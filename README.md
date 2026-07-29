# Tally

**Economic identity infrastructure for Nigeria's informal economy.**

Tally turns informal work, sales, and payments into a verifiable record that
builds a **reliability score**, which unlocks loans and better jobs. It serves
three user types — **workers**, **traders**, and **employers** — across web,
WhatsApp, SMS, and phone/IVR, so people **without a smartphone** are first-class
users.

> Status: **Stage 2 — backend scaffold.** Data model + NestJS API skeleton with
> mock integration adapters and a local docker-compose stack. Frontend
> (Next.js) comes next.

---

## Architecture

Monorepo (pnpm workspaces + Turborepo):

```
apps/
  api/          NestJS backend (module-per-domain)
  web/          Next.js App Router frontend (marketing + worker dashboard)
packages/
  db/           Prisma schema + client + seed
  core/         Pure domain logic: reliability score engine + job matching (unit-tested)
  integrations/ Adapter interfaces + mock impls (payments, sms, voice, whatsapp, llm)
  i18n/         Message catalogs: EN, PCM (Pidgin), YO, HA, IG
```

### Why these choices
- **NestJS over Express** — the spec wants clear module boundaries and swappable
  integrations; Nest's modules + DI give exactly that. Swapping the mock payment
  adapter for a real one is a one-line provider change in `IntegrationsModule`.
- **Provider-neutral integrations** — everything third-party lives behind an
  interface in `packages/integrations` with a **mock** implementation, so the
  whole stack runs locally with **no API keys**.
- **Pure `core` package** — the score engine is a deterministic function of an
  append-only event log, so a score is explainable, replayable, and unit-tested.
- **Money as `BigInt` kobo** through a minimal **double-entry ledger** — no
  floats touch money.

---

## Quick start (docker-compose)

```bash
cp .env.example .env
docker compose up
```

This starts Postgres + Redis + the API, pushes the schema, seeds demo data, and
serves the API at **http://localhost:4000/api**. No real API keys required — all
integrations run in mock mode.

Health check:

```bash
curl http://localhost:4000/api/health
```

## Local dev without Docker

```bash
pnpm install
# start Postgres + Redis however you like, then:
cp .env.example .env
pnpm --filter "./packages/*" build   # build workspace packages (core/db/i18n/integrations)
pnpm --filter @tally/db push      # push schema to the DB
pnpm --filter @tally/db seed      # demo users, job, loan product
pnpm --filter @tally/api dev      # start the API in watch mode
pnpm --filter @tally/core test    # run the score-engine unit tests
```

---

## Frontend (Next.js)

```bash
cp apps/web/.env.example apps/web/.env.local   # points at http://localhost:4000/api
pnpm --filter @tally/web dev                    # http://localhost:3000
```

Routes:
- `/` — marketing site
- `/login` — phone-first OTP sign-in (mock SMS shows the code on screen in dev)
- `/worker` — worker dashboard: reliability score + tier progress, wallet,
  active jobs with the **4-digit attendance-confirm** widget, jobs nearby, and
  score-gated loan offers. One aggregate call: `GET /api/users/:id/dashboard`.

Sign in with the seeded worker `+2348010000001` to see it populated.

## Try the core flows (mock mode)

The mock providers return OTP codes and log outbound messages so you can drive
the whole thing from `curl`.

```bash
# 1. Phone-first signup/login — mock SMS returns the code in `devCode`
curl -sX POST localhost:4000/api/auth/otp/request \
  -H 'content-type: application/json' -d '{"phone":"+2348010000001"}'

# 2. Verify to get a session token
curl -sX POST localhost:4000/api/auth/otp/verify \
  -H 'content-type: application/json' -d '{"phone":"+2348010000001","code":"<devCode>"}'

# 3. Inbound SMS routed through the NLU adapter (no smartphone needed)
curl -sX POST localhost:4000/api/channels/sms/inbound \
  -H 'content-type: application/json' -d '{"from":"+2348010000001","text":"I wan find work"}'
```

The seeded employer job + funded escrow lets you exercise
match → accept → confirm-code → escrow release → score update → payout end to end.

---

## Demo accounts (from the seed)

| Role | Phone | Language | Notes |
|---|---|---|---|
| Worker | +2348010000001 | Pidgin | **No smartphone** — SMS/IVR identities, score 280 (Emerging) |
| Trader | +2348010000002 | Hausa | Has logged sales |
| Employer | +2348010000003 | Yoruba | Has an open job with funded escrow |

---

## Reliability score (transparent & tunable)

All weights and tier cutoffs live in
[`packages/core/src/scoring/config.ts`](packages/core/src/scoring/config.ts).
Default range **0–1000**, tiers: **Building** (0), **Emerging** (250),
**Trusted** (500), **Established** (750). The engine is a pure function over
`ScoreEvent`s, so any score can be explained and replayed.

---

## API surface (current)

| Area | Route prefix |
|---|---|
| Auth (phone OTP) | `POST /api/auth/otp/request`, `/verify` |
| Users & roles | `/api/users` |
| Jobs & matching | `/api/jobs` |
| Attendance & confirm code | `/api/attendance` |
| Scoring | `/api/scoring/:userId` |
| Lending eligibility/apply | `/api/lending` |
| Payments webhook | `/api/payments/webhook` |
| Channel webhooks | `/api/channels/{sms,whatsapp,ivr}/inbound` |

---

## Swapping in real providers

Set the relevant `*_PROVIDER` env var and implement the interface in
`packages/integrations`:

| Env | Interface | Mock |
|---|---|---|
| `PAYMENTS_PROVIDER` | `PaymentProvider` | `MockPaymentProvider` |
| `SMS_PROVIDER` | `SmsProvider` | `MockSmsProvider` |
| `WHATSAPP_PROVIDER` | `WhatsAppProvider` | `MockWhatsAppProvider` |
| `LLM_PROVIDER` | `LlmProvider` | `MockLlmProvider` |

Then register the concrete class in
`apps/api/src/integrations/integrations.module.ts`.

---

## Roadmap

- **Stage 3** — Next.js frontend: marketing site + worker dashboard first.
- **Stage 4** — BullMQ workers (payouts, notifications, async score recompute),
  Prisma migrations (replacing `db push`), conversation-state IVR flows, real
  provider adapters, tests + CI.
