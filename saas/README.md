# statsDor

A multi-tenant FIFA/football stats-tracking SaaS, fully bilingual (Arabic default + RTL, English
secondary). Groups of friends ("Spaces") log their own weekly stats, compare head-to-head with any
other member, compete in auto-generated monthly/yearly tournaments plus custom ones, chase weekly
challenges, get an auto-computed Man of the Match, see a "scouting report" that maps their stats
onto a tier ladder with a fake market value, and now a fun **xG + FIFA-style player card** on top
of that.

This is a from-scratch **rewrite** of the original single-tenant app that lives at the repo root
(`../src`, a Vite/React SPA on Supabase, hardcoded to exactly two named players — "mohamed" vs
"mohaned" — behind a single shared password). This project generalizes every one of its ideas to
any number of members per Space and turns it into an actual product. **The old app is untouched**
— nothing here reads from or writes to it, and no data was migrated (deliberate — see the plan doc
below).

The original architecture plan (data model, auth/invite design, phased build order, and the reason
behind every non-obvious decision) is at `/Users/ahmedhossam/.mine/plans/quirky-floating-hartmanis.md`.
It documents the *original* single-auth-mode design — the [Auth model](#auth-model-two-ways-to-log-in)
section below documents what it evolved into after a mid-project product-direction change; read both
if you want the full history, or just this file for current behavior.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — newer than most training data, with a few
  breaking changes from "classic" Next.js. See `AGENTS.md` if you're a future agent about to write
  more code here, and check `node_modules/next/dist/docs/` for anything unfamiliar (`params` is a
  `Promise` everywhere; the proxy/middleware file is `src/proxy.ts`, the `middleware.ts` convention
  is deprecated in this version).
- **MongoDB + Mongoose** — see [Data model](#data-model).
- **NextAuth (Auth.js) v5**, two Credentials providers — see [Auth model](#auth-model-two-ways-to-log-in).
- **i18next + react-i18next**, hand-rolled `[locale]` segment routing (no third-party router
  package) — see [Internationalization](#internationalization-i18n).
- **Tailwind CSS v4**.
- **EasyKash** (not Stripe) is the intended future payment provider for seat upgrades — see
  [Billing](#billing-not-wired-up). Still stubbed, not implemented.

## Getting started

```bash
cp .env.example .env.local   # fill in MONGODB_URI and AUTH_SECRET at minimum
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/ar` (the default locale).

**`MONGODB_URI` must point at a replica set** (MongoDB Atlas works out of the box; a local
standalone `mongod` does not). This isn't optional polish — adding a Space Member and rotating an
access code use real multi-document Mongo transactions/atomic operations (`src/lib/services/
invites.ts`), and standalone MongoDB doesn't support transactions at all.

Generate `AUTH_SECRET` with `openssl rand -base64 32` or similar.

## Project structure — where to find things

```
src/
  app/
    [locale]/                Every user-facing route lives under here (ar|en) — see i18n below
      (marketing)/            Public site: landing page, /pricing, /login, /register
                              (black/white/gold identity, "statsDor" wordmark — see Design)
      join/[code]/             Public, informational: "you're already a member, log in with..."
      (app)/app/               The actual product, behind auth (proxy.ts guards /[locale]/app/*)
        page.tsx                Space picker: 0 spaces → onboarding, 1 → auto-redirect, 2+ → list
        new/                    Create-a-Space form (+ optional "add your first member" step)
        [spaceSlug]/             Everything below is one Space's dashboard
          layout.tsx              Membership guard + tab nav + Space switcher + sign-out button
          page.tsx                Overview (totals, recent weeks, per-week MOTM)
          log/                    "Log my week" — one input per the Space's *enabled* attributes
          standings/               Space-wide P-Index/W-D-L table
          compare/                 Head-to-head + side-by-side FIFA cards for any two members
          tournaments/             Monthly/yearly/custom tournaments + prize reveals
          challenges/              Active weekly challenge + history
          scouting/                Per-member tier/market-value report, tier ladder, FIFA card
          trophy-cabinet/          Who's won what, ever
          settings/                Rename, members (add/regenerate codes), stat toggles, billing
          FifaCardView.tsx         Shared "player card" visual (Scouting + Compare both use it)
          CardAttributesForm.tsx   Self-only PAC/PHY sliders, rendered under your own card
    api/                      Route handlers, unprefixed by locale — see API surface below
  auth.ts                    NextAuth config — two Credentials providers, see Auth model
  proxy.ts                   Locale redirect for bare paths + auth guard for /[locale]/app/*
  i18n/                      Translation infrastructure — see Internationalization
    settings.ts               locales/defaultLocale/namespaces — the single source of truth
    resources.ts               Statically imports every locale/namespace JSON file
    server.ts / client.tsx     getT() for Server Components / useTranslation() for Client ones
    navigation.tsx             LocaleLink, useLocale()
    href.ts                    localeHref(locale, path) — the non-JSX version, for redirects
    locales/{ar,en}/*.json      The actual translated strings, one file per namespace
  lib/
    db/mongoose.ts             Connection singleton — every service calls `dbConnect()` first
    models/                    Mongoose schemas — the source of truth for what's actually stored
    domain/                    Pure static content: default stat catalog, 600-entry challenge
                               catalog, cosmetic league/badge/tournament-name pools (English-only,
                               see Internationalization for why)
    stats-engine/               Pure, DB-free math — generalized from the old app's stats.js/
                               tournaments.js/motm.js/scouting.js, plus the new fifaCard.js.
                               Every function takes memberIds/statDefs as parameters instead of
                               hardcoding two players.
    services/                   Business logic — DB reads/writes + calls into stats-engine. Route
                               handlers and pages call these, never touch Mongoose models directly.
```

## The core generalization, in one paragraph

The old app's entire codebase used `'mohamed'`/`'mohaned'` as literal object keys everywhere. Here,
a `MatchWeek` document has an `entries` array — one entry per Space member who logged that week —
and every stats function in `lib/stats-engine/` takes a list of member IDs and a list of the
Space's *currently enabled* stat definitions instead of assuming exactly two fixed players with a
fixed six stats. `core.ts` has the shared primitives (P-Index, per-week round-robin W/D/L, pairwise
head-to-head record); `tournaments.ts`, `motm.ts`, `scouting.ts`, and `fifaCard.ts` build on those
for the tournament/prize engine, Man of the Match, scouting reports, and the FIFA card respectively.
None of these files import anything from `models/` — they're pure functions you can unit test with
plain objects.

## Auth model: two ways to log in

This changed mid-project from a single unified email+password model to a two-tier one:

- **Space Manager** — the person who creates a Space. Has a real password (`User.passwordHash`),
  signs up normally, logs in with email + password via NextAuth's `'credentials'` provider
  (`src/auth.ts`). Can create tournaments, choose challenges, add/remove members, rename the Space,
  toggle stat attributes.
- **Space Member** — anyone the manager adds. **Never sets a password.** When a manager adds
  someone by email (during onboarding or later from Settings → Members), the system immediately:
  finds-or-creates a passwordless `User` for that email, creates their `Membership`, and generates
  a permanent `accessCode` stored on that `Membership`. The member logs in forever after with
  **email + that code**, via a second NextAuth provider, `'member-code'` (also in `src/auth.ts`).
  The manager can view and regenerate a member's code from Settings → Members
  (`POST /api/spaces/[spaceId]/members/[userId]/access-code`).

The login page (`(marketing)/login/`) has two tabs — `LoginTabs.tsx` switches between
`LoginForm.tsx` (password) and `MemberLoginForm.tsx` (access code) — `?mode=member` pre-selects the
member tab (used by the `/join/[code]` page's "log in" link).

**Seats/pricing**: `Space.plan.memberCap` (default 2 — the manager + 1 member "included") vs.
`Space.plan.maxMemberCap` (hard ceiling, default 5). Adding a member beyond `memberCap` still
succeeds but is flagged `billable: true` in the API response, at `Space.plan.pricePerExtraSeatEGP`
(default 150 EGP/month) — this drives the pricing/upgrade copy in Settings, but **no real charge
happens**; see [Billing](#billing-not-wired-up). Hitting `maxMemberCap` hard-blocks further adds
with a `409`.

The `Invite` model still exists as an audit trail (who was added, when) but no longer gates
access — membership is live the instant a manager adds someone, there's no pending/redeem step.
`src/lib/services/invites.ts`'s old transactional `redeemInvite()` is dead code, kept rather than
deleted since it doesn't hurt anything.

## Internationalization (i18n)

Two locales, `ar` (default) and `en`, `dir="rtl"`/`dir="ltr"` set on `<html>` accordingly
(`src/i18n/settings.ts`'s `dirForLocale()`). Every user-facing route lives under `app/[locale]/...`;
`src/proxy.ts` redirects any unprefixed path (including bare `/`) to `/ar/...`. `app/api/*` is
**not** locale-prefixed.

- Server Components: `const { t } = await getT(locale)` (`@/i18n/server`), then `t('namespace:key.path')`.
- Client Components (`'use client'`): `const { t } = useTranslation('namespace')` (`@/i18n/client`,
  a thin re-export of react-i18next wired to a shared instance), then `t('key.path')`.
- Every internal link/redirect goes through `LocaleLink` (`@/i18n/navigation`) or
  `localeHref(locale, path)` (`@/i18n/href`) — never a bare `next/link` or unprefixed `redirect()`.
- RTL: Tailwind **logical properties** everywhere (`ms-`/`me-`/`ps-`/`pe-`/`text-start`/`text-end`/
  `start-`/`end-`), not physical left/right ones, so layout auto-flips with `dir="rtl"` for free.
- Namespaces (`src/i18n/locales/{ar,en}/*.json`): `common` (nav, brand, meta), `marketing`
  (landing/pricing), `auth` (login/register/join), `app` (the entire authenticated dashboard,
  including `fifaCard.*`). Add a new namespace in `src/i18n/settings.ts` first, then wire it into
  `resources.ts`.
- **Deliberately left English-only** (by explicit product decision, not an oversight): the
  600-entry weekly challenge catalog (`lib/domain/challenge-catalog.ts`), league names and the
  tournament-name pool (`lib/domain/leagues.ts`, `tournament-names.ts`), badge keys
  (`lib/domain/badges.tsx`), and every stats-engine-generated sentence — prize "why" explanations
  (`stats-engine/tournaments.ts`), MOTM reasons (`motm.ts`), scouting driver labels (`scouting.ts`).
  Translating those would mean restructuring pure functions to return structured data instead of
  pre-built English strings — a real follow-up, not done here. The FIFA card's six attribute
  abbreviations (PAC/SHO/PAS/DRI/DEF/PHY) are also intentionally kept in Latin letters in both
  locales — universal gaming jargon, not translated.
- Arabic copy throughout aims for a natural, colloquial-leaning Egyptian voice, not literal machine
  translation — check any `ar/*.json` file for the tone if you're adding more.

## Data model

Eight Mongoose collections (`lib/models/`):

| Collection | Purpose |
|---|---|
| `User` | email + name; `passwordHash` is **optional** — set for Space Managers, `undefined` for Space Members |
| `Space` | a tenant — name, slug, owner, `plan` (`memberCap`/`maxMemberCap`/`pricePerExtraSeatEGP`/`tier`/`status`), **its own configurable `statDefinitions` array**, `settings.resultStatKey` |
| `Membership` | who belongs to which Space — `role` (`owner`\|`member`, displayed as "Space Manager"/"Space Member"), `nickname`, `accessCode` (Space Members only, unique+sparse), `pace`/`physical` (1-99, self-rated FIFA card inputs) |
| `Invite` | audit record of who was added and when — no longer gates access, see Auth model |
| `MatchWeek` | one doc per `(Space, date)` — `entries[]`, one per member who logged that week, each with their own `stats` map + precomputed `pIndex` |
| `Tournament` | monthly (auto-created)/yearly (auto-created)/custom, with `results.prizes` once revealed |
| `ActiveChallenge` | the one currently-active weekly challenge per Space |
| `Payment` | EasyKash payment-attempt records for seat upgrades — currently unused, see Billing |

The single most important modeling decision: **disabling a stat attribute never touches historical
data.** `MatchWeek.entries[].stats` keeps whatever keys existed when it was logged; every
stats-engine function is handed the *current* enabled list explicitly, so toggling an attribute
off in Settings only changes what new "log my week" forms ask for and what current views display.

## Feature tour → where it's implemented

- **Sign up / create a Space / add members** — see [Auth model](#auth-model-two-ways-to-log-in)
  above; `lib/services/{spaces,invites,memberships}.ts`.
- **Log your own weekly stats** — `[spaceSlug]/log/`, backed by `lib/services/matchWeeks.ts`.
  Renders one input per the Space's enabled `statDefinitions`, plus an optional "I completed this
  week's challenge" checkbox when one is active.
- **Head-to-head comparison between any two members** — `.../compare/`, `core.ts`'s
  `sharedWeeks`/`computePairwiseRecord`/`pairwisePerStatRecord`, plus both members' FIFA cards
  side-by-side.
- **Space-wide standings** — `.../standings/`, `core.ts`'s `standingsForMembers` (P-Index totals +
  an all-play-all round-robin per week for W/D/L when more than 2 members logged that week).
- **Tournaments + prizes** (Golden Boot/Vision/Skills, Winner, Player of the Month) — `.../tournaments/`,
  `lib/services/tournaments.ts` + `stats-engine/tournaments.ts`. Monthly/yearly rows are lazily
  created on each visit; only one live/upcoming custom tournament is allowed at a time.
- **Weekly challenges** — `.../challenges/`, 600-entry catalog in `lib/domain/challenge-catalog.ts`.
- **Man of the Match** — computed inline on the Overview page for any week with 2+ loggers
  (`stats-engine/motm.ts`); no separate reveal flow, just shown alongside the week.
- **Scouting reports / tier ladder / market value** — `.../scouting/`, `stats-engine/scouting.ts`.
- **xG + FIFA card** — a deliberately-approximate, fun rating, not rigorous analytics (real xG
  needs shot location, which isn't tracked). `stats-engine/fifaCard.ts`: proxy
  `xG = shotsOnTarget*0.35 + shotsOffTarget*0.05`; `Clinical Index = goals / xG` with 🔥/✅/😬
  tiers; SHO/PAS/DRI/DEF computed from real per-game stats, PAC/PHY are one-time 1-99 self-ratings
  (`CardAttributesForm.tsx` → `PATCH /api/spaces/[spaceId]/members/me/attributes`); OVR is a
  weighted average. Shown via `FifaCardView.tsx` on both Scouting (every member) and Compare (the
  two picked members). `provisional: true` (fewer than 3 logged weeks) shows a caveat, not a
  blocked card.
- **Trophy cabinet** — `.../trophy-cabinet/`, aggregates every revealed tournament's prize winners.
- **Configurable stat attributes** — `.../settings/stat-attributes/`, toggle built-ins on/off or
  add custom ones (`lib/services/statDefinitions.ts`).

## API surface

REST-ish route handlers under `app/api/spaces/[spaceId]/...` (plus `app/api/auth/*`,
`app/api/invites/[code]`, `app/api/webhooks/easykash`), all unprefixed by locale. They're thin:
parse the request, resolve the caller's membership/role, call a `lib/services/*` function,
translate a thrown `ServiceError` into the right HTTP status via `lib/services/errors.ts`. Notable
ones beyond the obvious CRUD: `POST .../members` (add a Space Member, returns their access code),
`POST .../members/[userId]/access-code` (regenerate), `PATCH .../members/me/attributes`
(self-rate PAC/PHY), `GET .../fifa-card?userId=` (one or all cards). If you're adding a new
feature, this thin-route/fat-service pattern is the one to copy.

## Design

Marketing site (`[locale]/(marketing)/*`) commits to a fixed black/white/gold identity — near-black
background, off-white text, a metallic gold (`#d4af37`) used deliberately as an accent, not a wash
— defined as CSS custom properties in `app/globals.css` (`--ink`, `--paper`, `--gold`, `--gold-soft`,
`--gold-dim`). The authenticated app shell keeps its neutral, light/dark-mode-respecting look, just
with primary buttons and the active tab recolored gold so it reads as the same product.

The product name **"statsDor"** is used consistently (root metadata, `package.json` name, marketing
copy) as a single string — a plain find-and-replace if you want to rename it again.

## Billing (not wired up)

The plan was always EasyKash, not Stripe — EasyKash has no native subscription/recurring billing,
just one-time payment links confirmed via a webhook callback (see the comment at the top of
`lib/models/Payment.ts` for the exact field names and the HMAC-SHA512 signature scheme). The seat
pricing *model* is fully real (see Auth model above — `memberCap`/`maxMemberCap`/
`pricePerExtraSeatEGP`, the `billable` flag on member-add), but actually charging for it is still
scaffolding only:

- `app/api/spaces/[spaceId]/billing/checkout/route.ts` → returns `501`, with a comment sketching
  the real flow (create a `Payment` doc, call EasyKash's Direct Payment Hosted endpoint, redirect).
- `app/api/webhooks/easykash/route.ts` → reads the raw body, returns `200` unconditionally, with a
  comment describing the real signature check that needs to replace that.
- `.../settings/billing/` shows current seat usage and an "Upgrade" button that hits the stub.

No `EASYKASH_API_KEY`/`EASYKASH_HMAC_SECRET` are configured in `.env.local` — wiring this up for
real (including getting those credentials) is the main piece of unfinished work.

## Known gaps / things to do next

- **No automated tests.** `lib/stats-engine/*` is pure and was written to be easy to unit test, but
  no test suite exists yet — the highest-value thing to add before trusting this with real
  money/data, especially given how much the auth/billing model has already changed once.
- **Billing is a stub** (above) — seat-cap enforcement and pricing *display* work, actually
  charging does not.
- **No real-time sync** — a deliberate v1 scope cut (the old app used Supabase realtime; here you
  refetch on navigation). Fine for a friend-group cadence of "log your week whenever."
- **No data migration from the old app** — also deliberate; the two apps are unrelated at runtime.
- **`resultStatKey` assumes a `'goals'`-shaped stat exists** for W/D/L purposes. Fully disabling or
  renaming that attribute without updating `Space.settings.resultStatKey` will silently treat the
  missing stat as `0` for everyone (a permanent 0-0 draw) rather than erroring. Worth a guard rail.
- **Stats-engine-generated English sentences aren't translated** (prize "why" text, MOTM reasons,
  scouting driver labels) — see Internationalization above for why, and what it'd take to fix.
- Visual polish beyond the marketing site and primary buttons/active-tab accents is intentionally
  light — every authenticated page is functional Tailwind, not a full design pass.
