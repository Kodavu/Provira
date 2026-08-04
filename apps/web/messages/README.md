# Translation catalogs (next-intl)

These files hold the **UI copy** for Tally's web app, one per launch language:

| File       | Language          |
| ---------- | ----------------- |
| `en.json`  | English (source)  |
| `pcm.json` | Nigerian Pidgin   |
| `yo.json`  | Yoruba            |
| `ha.json`  | Hausa             |
| `ig.json`  | Igbo              |

## Status

This is a **scaffold**. `en.json` is the source of truth. The Nigerian-language
files carry **seed translations** for the highest-confidence strings and fall back
to English elsewhere. **All non-English strings must be reviewed by native
speakers before launch** — tone marks (Yoruba) and diacritics (Igbo) in
particular are intentionally conservative here.

## How it works

- The active language is resolved **from the `tally-lang` cookie** (values
  `EN`/`PCM`/`YO`/`HA`/`IG`) in `apps/web/i18n/request.ts` — no URL locale prefix,
  so all existing routes are preserved.
- Components read copy with `useTranslations("Namespace")` (client) or
  `getTranslations` (server).
- The language selector (`components/i18n/language-menu.tsx`) writes the cookie
  and calls `router.refresh()` so server components re-render in the new language.

## Adding a string

1. Add the key under the right namespace in **`en.json`** first.
2. Add the same key to every other file (translated, or English as a fallback).
3. Use it: `const t = useTranslations("Namespace"); t("key")`.

## Scope

UI chrome (nav, homepage, auth, dashboard, buttons, emails, notifications) is
hardcoded i18n and lives here. **User-generated content** (job posts, listings,
chat, reviews) is intentionally *not* translated here — that's on-demand AI
translation on the roadmap.
