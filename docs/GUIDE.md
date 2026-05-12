# Triviape Improvement Guide

**Created:** 2026-02-09
**Last Updated:** 2026-05-12
**Status:** Active

This is the single source of truth for all codebase improvement work. Every change we make gets tracked here. Consult this document before starting any work session.

---

## Table of Contents

1. [Project Snapshot](#1-project-snapshot)
2. [Work Phases](#2-work-phases)
3. [Phase 1: Immediate Fixes](#phase-1-immediate-fixes)
4. [Phase 2: Security & Reliability](#phase-2-security--reliability)
5. [Phase 3: Code Quality](#phase-3-code-quality)
6. [Phase 4: Architecture & Performance](#phase-4-architecture--performance)
7. [Phase 5: Polish & Production Readiness](#phase-5-polish--production-readiness)
8. [Changelog](#changelog)
9. [Documentation Tracker](#documentation-tracker)
10. [Product epics & issue tracking](#10-product-epics--issue-tracking)
11. [How to Use This Guide](#how-to-use-this-guide)

---

## 1. Project Snapshot

**Triviape** is a gamified trivia quiz platform built with:

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.x (App Router) |
| Language | TypeScript (strict mode) |
| Database | Firebase Firestore + Realtime DB |
| Auth | NextAuth v5 beta + Firebase Auth |
| Server-side | Next.js `app/api` routes; `functions/` reserved for Cloud Functions (see [DECISIONS.md](./DECISIONS.md)) |
| State | React Query + React Context |
| UI | Shadcn/UI + Tailwind CSS 4 |
| Testing | Jest + Playwright |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |
| Real-time | Socket.io (client) + Firestore listeners |

**Key features:** Daily quizzes, multiplayer, leaderboards (daily/weekly/monthly/all-time), friends/social, achievements, XP/leveling, customizable avatars.

### Architecture assessment — is refactoring necessary?

**Verdict:** Targeted refactoring and consolidation are warranted; a full platform rewrite is not.

**Evidence (size and coupling):**

| Hotspot | Approx. size | Risk |
|---------|----------------|------|
| `app/lib/services/friendService.ts` | ~1,400 lines | Multiple domains (requests, presence, challenges) in one module — high change cost for social / multiplayer roadmap work |
| `app/components/ui/sidebar.tsx` | ~800 lines | Layout, navigation, and interaction logic intertwined — harder to test and to evolve safely |
| `app/lib/services/index.ts` | Re-exports | Deprecated “legacy” service exports sit beside unified `user/` and `auth/` modules, inviting inconsistent call sites |

**Recommendation:** Treat this as **incremental architecture work** (GUIDE Phase 4): split `friendService`, continue the service-folder layout (4.4), standardize API envelopes where any drift remains (4.6), add Suspense at data boundaries (4.3). Do **not** pause product delivery for a big-bang rewrite unless a specific feature is blocked.

### Product vs engineering alignment

**Product bets** (prioritized themes — see [Roadmap.md](./Roadmap.md) for the full wishlist) should be sequenced against **engineering prerequisites** in this guide:

| Product direction (Roadmap themes) | Typical prerequisites (this guide) |
|-----------------------------------|-------------------------------------|
| Social: friend challenges, notifications, richer profiles | 4.1 `friendService` decomposition; auth consistency ([DECISIONS.md](./DECISIONS.md) §1); 4.6 API contract clarity for new endpoints |
| Leaderboard / stats depth | 4.4 service layout for leaderboard domain; 4.5 perf monitoring if dashboards add load |
| Daily quiz variety (types, ratings, categories) | Stable quiz/daily services (4.4); QuestionCard and API patterns already strengthened in Phase 3 |
| Monetization / growth (later) | Phase 5 polish (coverage, dependency hygiene), stable auth and billing boundaries |

**How to use the two docs:** [Roadmap.md](./Roadmap.md) keeps the *product* backlog and themes. **This file (GUIDE.md)** owns *delivery order* and file-level tasks. When product scope shifts, add or reprioritize GUIDE items — do not fork a second engineering tracker.

---

## 2. Work Phases

| Phase | Focus | Status | Items |
|-------|-------|--------|-------|
| **1** | Immediate Fixes | **Done** | 4 items |
| **2** | Security & Reliability | **Done** | 5 items |
| **3** | Code Quality | **Done** | 6 items |
| **4** | Architecture & Performance | In progress | 6 items (sidebar + suspense + API polish landed; service layout 4.4 still open) |
| **5** | Polish & Production Readiness | Pending | 5 items |

---

## Phase 1: Immediate Fixes

> Quick wins and items that should never have shipped. Fix these first.

### 1.1 Remove ESLint `ignoreDuringBuilds`

- **File:** `next.config.ts`
- **Issue:** `eslint: { ignoreDuringBuilds: true }` silently passes lint errors through CI builds
- **Fix:** Remove the flag, then fix any lint errors that surface
- **Status:** Done
- **Completed:** 2026-02-09

### 1.2 Fix CORS placeholder domain

- **File:** `app/lib/middleware/securityMiddleware.ts:33`
- **Issue:** `allowedOrigins` contains `'https://yourdomain.com'` placeholder
- **Fix:** Replace with actual production domain, move to env variable
- **Status:** Done
- **Completed:** 2026-02-09

### 1.3 Remove debug console.logs from sidebar

- **File:** `app/components/ui/sidebar.tsx` (lines 110, 121)
- **Issue:** `console.log` debug statements left in production component
- **Fix:** Delete the debug statements
- **Status:** Done
- **Completed:** 2026-02-09

### 1.4 Resolve Next.js version mismatch

- **Files:** `package.json`, `package-lock.json`
- **Issue:** `package.json` declares `next@15.2.1` but `npm list` shows `next@15.3.9` installed
- **Fix:** Align versions — pick one and run `npm ci`
- **Status:** Done
- **Completed:** 2026-02-09

---

## Phase 2: Security & Reliability

> Fix security gaps and add missing safety nets.

### 2.1 Implement email verification on registration

- **File:** `app/api/auth/register/route.ts:70`
- **Issue:** TODO comment — users can register with any email, no verification
- **Fix:** Implement Firebase `generateEmailVerificationLink` + send verification email
- **Status:** Done
- **Completed:** 2026-02-09

### 2.2 Add rate limiting to unprotected endpoints

- **Files:** API routes for `/api/user/profile`, `/api/user/stats`, `/api/daily-quiz`, `/api/quiz/submit`, `/api/quizzes`
- **Issue:** 5 endpoints have zero rate limiting (only `/api/auth/*` and `/api/leaderboard` are protected)
- **Fix:** Add rate limiting middleware to each unprotected endpoint
- **Status:** Done
- **Completed:** 2026-02-09

### 2.3 Complete Firestore security rules

- **File:** `firestore.rules`
- **Issue:** Only `users` and `Quizzes` collections have rules. Missing: `quiz_attempts`, `leaderboards`, `notifications`, `daily_quizzes`, `user_daily_quiz`, `user_stats`, `achievements`, `user_achievements`
- **Fix:** Audit which collections need client-side access and write rules. Document any that are intentionally server-only.
- **Status:** Done
- **Completed:** 2026-02-09

### 2.4 Integrate error reporting service (Sentry)

- **Files:** `app/lib/errorHandler.ts` (commented-out Sentry code), error classification system in `app/lib/errors/enhancedErrorHandling.ts`
- **Issue:** All errors go to `console.log` — invisible in production
- **Fix:** Install and configure Sentry. Wire into existing error classification system.
- **Status:** Done
- **Completed:** 2026-02-09

### 2.5 Add environment variable validation

- **Issue:** No `.env.example`, no runtime validation. Missing vars cause cryptic runtime errors.
- **Fix:** Create Zod-based env validation that runs at startup. Create `.env.example`.
- **Status:** Done
- **Completed:** 2026-02-09

---

## Phase 3: Code Quality

> Reduce technical debt, improve type safety, fix accessibility.

### 3.1 Fix accessibility in QuestionCard (core gameplay)

- **File:** `app/components/quiz/QuestionCard.tsx`
- **Issue:** Answer options missing `role="radio"`/`role="checkbox"`, `aria-label`, keyboard navigation (Enter/Space), focus indicators
- **Fix:** Add proper ARIA roles, keyboard event handlers, focus styles
- **Status:** Done
- **Completed:** 2026-02-09

### 3.2 Replace `any` types with proper generics

- **Files:** `app/actions/authActions.ts`, `app/hooks/query/useOptimizedInfiniteQuery.ts` (12 instances + 1 `@ts-ignore`), `app/lib/cacheUtils.ts`, `app/lib/utils/csrfFetch.ts`, `app/lib/middleware/errorMiddleware.ts`, ~20 other locations
- **Issue:** ~25+ `any` types in production code reduce type safety
- **Fix:** Replace with proper generics, `unknown`, or specific types
- **Status:** Done
- **Completed:** 2026-02-09

### 3.3 Adopt React Hook Form + Zod for client-side forms

- **Files:** `app/components/auth/SignInForm.tsx` and related auth forms
- **Issue:** Forms use raw `FormData` extraction with no client-side validation. Zod schemas exist server-side but aren't reused.
- **Fix:** Install React Hook Form, create Zod resolver, share schemas between client and server
- **Status:** Done
- **Completed:** 2026-02-09

### 3.4 Centralize React Query keys

- **Files:** Multiple hooks define their own `QUERY_KEYS` objects
- **Issue:** Risk of key collisions, cache invalidation is ad-hoc
- **Fix:** Create `app/lib/queryKeys.ts` with all query keys
- **Status:** Done
- **Completed:** 2026-02-09

### 3.5 Remove 244 console statements

- **Issue:** No structured logging — `console.log/warn/error` scattered everywhere
- **Fix:** Create a lightweight logger wrapper. Strip console calls in production (already configured in next.config but good to be explicit).
- **Status:** Done
- **Completed:** 2026-02-09

### 3.6 Convert code TODOs to tracked issues

- **Files:** `hooks/useFriends.ts`, `leaderboard/page.tsx`, `lib/services/leaderboardService.ts`, `social/page.tsx` (prior TODOs); references live in **§10** below.
- **Issue:** Feature gaps tracked as code comments instead of durable IDs.
- **Fix:** Assign in-repo epic IDs (`FC-*`, `LB-*`), replace `TODO` comments with pointers to this section; run `bd create` when the local Dolt server is healthy (see §10.2).
- **Status:** Done
- **Completed:** 2026-05-12

---

## Phase 4: Architecture & Performance

> Decompose large files, add missing infrastructure.

### 4.1 Decompose `friendService.ts` (1,400 lines)

- **Files:** `app/lib/services/friendService.ts` (facade), `app/lib/services/social/friendInternals.ts`, `friendRequestOperations.ts`, `friendChallengeOperations.ts`, `friendMessagingOperations.ts`, `friendPresenceOperations.ts`, `friendListOperations.ts`
- **Issue:** Single file handling friends, requests, presence, challenges, messaging
- **Fix:** Split into focused modules under `social/`; keep `FriendService` singleton API stable for callers.
- **Status:** Done
- **Completed:** 2026-05-12

### 4.2 Decompose `sidebar.tsx` (805 lines)

- **Files:** `app/components/ui/sidebar/` (`sidebar-provider.tsx`, `sidebar-primitives.tsx`, `index.ts`) — imports stay `@/app/components/ui/sidebar`
- **Issue:** Monolith file, ad hoc `window.__triggerSidebarHover` hooks
- **Fix:** Provider split + `openFromEdgePeek` on context; nav edge strip uses `useSidebar()` (see `shadcn-sidebar.tsx`)
- **Status:** Done
- **Completed:** 2026-05-12

### 4.3 Add Suspense boundaries for streaming

- **Files:** `app/layout.tsx` (root), `app/dashboard/layout.tsx`, `app/leaderboard/page.tsx` (`next/dynamic` VirtualizedLeaderboard), `app/social/page.tsx` (dynamic `FriendsList` + `ChallengeFriendDialog`)
- **Issue:** No Suspense defaults for route transitions and client subtrees
- **Fix:** Shell Suspense at root + dashboard; code-split heavy social/leaderboard client islands with explicit loading UI
- **Status:** Partially done
- **Completed:** 2026-05-12 (expanded)

### 4.4 Complete service layer reorganization (Phases 4-7)

- **Reference:** Previously tracked in `SERVICES_REORGANIZATION_PROGRESS.md` (now archived)
- **Issue:** Quiz, social, and multiplayer services still need consolidation (Phases 1-3 of that plan are done)
- **Remaining:** Move quiz services to `quiz/`, social to `social/`, multiplayer to `multiplayer/`, then cleanup
- **Progress:** `leaderboard` implementation moved to `app/lib/services/leaderboard/` with a thin `leaderboardService.ts` re-export shim for legacy import paths.
- **Status:** In progress
- **Completed:** —

### 4.5 Fix performance monitoring gaps

- **Files:** `app/lib/performanceAnalyzer.ts`, `app/lib/performance/subscribeWebVitals.ts`, `app/providers/app-providers.tsx`, Web Vitals integration
- **Issue:** Production metrics export disabled, INP and TTFB not tracked, `useBenchmark` memory leak, component metrics always report 0
- **Fix:** Centralize Web Vitals (CLS, FID, LCP, **INP**, **TTFB**) with `subscribeWebVitalsForPath`; next step is Sentry/analytics sink for `recordMetric` in production
- **Status:** Partially done
- **Completed:** 2026-05-12 (vitals + benchmark ref from prior commit; production sink still open)

### 4.6 Standardize API response format

- **Files:** All API routes in `app/api/` — `auth/csrf`, `auth/diagnostics` now use `withApiErrorHandling` (same envelope as core quiz/user routes)
- **Issue:** Mixed response shapes; see DECISIONS.md
- **Fix:** Apply `withApiErrorHandling` to remaining ad hoc routes; NextAuth catch-all may stay framework-shaped
- **Status:** In progress
- **Completed:** —

---

## Phase 5: Polish & Production Readiness

> Final cleanup for production confidence.

### 5.1 Configure test coverage reporting

- **Files:** `jest.config.ts`, CI pipeline
- **Issue:** Coverage reporting not configured, no thresholds enforced, API routes only 20% covered
- **Fix:** Enable Jest coverage, set 80% threshold, add API route tests
- **Status:** Pending
- **Completed:** —

### 5.2 Plan NextAuth v5 stable migration

- **File:** `package.json` — `next-auth@5.0.0-beta.25`
- **Issue:** Beta dependency in production. API may change.
- **Fix:** Monitor for GA release, document any breaking changes, plan migration
- **Status:** Pending
- **Completed:** —

### 5.3 Clean unused npm packages

- **File:** `package.json`
- **Issue:** Extraneous packages: `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasm-threads`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`, `@types/uuid`
- **Fix:** Remove unused packages, run `npm prune`
- **Status:** Pending
- **Completed:** —

### 5.4 Standardize performance monitoring approach

- **Files:** `usePerformanceMonitor()`, `withPerformanceProfile` HOC, `useBenchmark()`
- **Issue:** Three monitoring approaches exist, inconsistently applied
- **Fix:** Pick one approach, apply consistently, remove unused utilities
- **Status:** Pending
- **Completed:** —

### 5.5 Update product roadmap

- **File:** `docs/Roadmap.md` (and cross-links in `docs/README.md`)
- **Issue:** Quarter labels read like a live schedule; roles of Roadmap vs GUIDE were easy to confuse; runtime text incorrectly implied the app backend lives in `functions/`.
- **Fix:** Roadmap = product themes and feature backlog; GUIDE = engineering sequencing and tasks; point to DECISIONS for actual HTTP/runtime layout.
- **Status:** Done
- **Completed:** 2026-05-07 (historical framing); **2026-05-12** (product vs engineering + runtime accuracy)

---

## Changelog

> Every change we make gets logged here with date, item reference, and what was done.

| Date | Item | Change | Files Modified |
|------|------|--------|----------------|
| 2026-05-12 | 4.3–4.5, build | Fix Next build (`webpackBuildWorker: false`); move leaderboard service to `services/leaderboard/` + shim; `subscribeWebVitalsForPath` (INP, TTFB); dynamic imports on `/leaderboard` and `/social` | `next.config.ts`, `app/lib/services/leaderboard/*`, `app/lib/performance/subscribeWebVitals.ts`, providers, `app/leaderboard/page.tsx`, `app/social/page.tsx`, `docs/GUIDE.md`, `docs/DECISIONS.md` |
| 2026-05-12 | 4.2–4.3, 4.6 (partial), §10 | Split sidebar into `ui/sidebar/*`, edge peek via context; Suspense on root + dashboard layouts; CSRF + diagnostics use `withApiErrorHandling`; AGENTS/GUIDE drop mandatory beads; `useBenchmark` stable callback ref | `AGENTS.md`, `docs/GUIDE.md`, `app/components/ui/sidebar/*`, `app/components/navigation/shadcn-sidebar.tsx`, `app/layout.tsx`, `app/dashboard/layout.tsx`, `app/api/auth/csrf/route.ts`, `app/api/auth/diagnostics/route.ts`, `app/hooks/performance/useBenchmark.ts` |
| 2026-05-12 | 3.6, 4.1, §10 | Closed Phase 3 (TODO → epic refs); split `friendService` into `app/lib/services/social/*`; added product epic IDs; attempted `bd create` (blocked: Dolt DB missing — see §10.2) | `docs/GUIDE.md`, `app/lib/services/friendService.ts`, `app/lib/services/social/*`, `app/leaderboard/page.tsx`, `app/social/page.tsx`, `app/hooks/useFriends.ts`, `app/lib/services/leaderboardService.ts`, `AGENTS.md` |
| 2026-05-07 | 5.5 | Marked `docs/Roadmap.md` as historical/reference-only and aligned the docs tracker with the current Firebase Functions backend surface | `docs/GUIDE.md`, `docs/README.md`, `docs/Roadmap.md` |
| 2026-02-09 | — | Created this guide from comprehensive codebase analysis | `docs/GUIDE.md` |
| 2026-02-09 | — | Reorganized docs folder, removed duplicates | See docs commit |
| 2026-02-09 | 1.1 | Removed `ignoreDuringBuilds`, fixed 20 lint errors (unescaped entities, display-name in tests, rules-of-hooks in rive-animation) | `next.config.ts`, 10 component files, 4 test files, `rive-animation.tsx` |
| 2026-02-09 | 1.2 | Replaced CORS placeholder with real Firebase domains + `ALLOWED_ORIGINS` env var | `securityMiddleware.ts` |
| 2026-02-09 | 1.3 | Removed 2 debug console.logs from sidebar hover handlers | `sidebar.tsx` |
| 2026-02-09 | 1.4 | Aligned Next.js version: updated package.json from 15.2.1 to 15.3.9 to match lockfile | `package.json` |
| 2026-02-09 | 2.1 | Added email verification on registration via Firebase REST API `sendOobCode` | `auth-config.ts`, `register/route.ts` |
| 2026-02-09 | 2.2 | Added `withRateLimit` (api: 100 req/min) to 5 unprotected endpoints | `daily-quiz/route.ts`, `daily-quiz/status/route.ts`, `quiz/submit/route.ts`, `quizzes/route.ts`, `user/stats/route.ts` |
| 2026-02-09 | 2.3 | Comprehensive Firestore rules for 16 collections (users, quizzes, social, messaging, leaderboards, etc.) | `firestore.rules` |
| 2026-02-09 | 2.4 | Installed `@sentry/nextjs`, wired into `logError()`, config gated by `NEXT_PUBLIC_SENTRY_DSN` env var | `errorHandler.ts`, `next.config.ts`, `sentry.*.config.ts` |
| 2026-02-09 | 2.5 | Zod env validation at startup + `.env.example` with all vars documented | `app/lib/env.ts`, `.env.example`, `app/layout.tsx` |
| 2026-02-09 | 3.1 | Full a11y on QuestionCard: ARIA roles, keyboard nav, focus rings, aria-live timer | `QuestionCard.tsx` |
| 2026-02-09 | 3.2 | Replaced ~20 `any` types with `unknown`, `AuthResult`, `Record<string, unknown>` in 5 key files | `authActions.ts`, `csrfFetch.ts`, `cacheUtils.ts`, `errorMiddleware.ts` |

---

## Documentation Tracker

> Tracks the state of every doc. Updated as we make changes.

### Active Documents (keep updated)

| Document | Purpose | Last Verified |
|----------|---------|---------------|
| `docs/GUIDE.md` | Master improvement tracker (this file) | 2026-05-12 |
| `docs/DECISIONS.md` | Architectural decision log | 2026-05-12 |
| `docs/RUNBOOKS.md` | Operational how-to guides | 2026-01-24 |
| `docs/Roadmap.md` | Product themes and backlog (quarter labels are historical) | 2026-05-12 |
| `docs/setup/firebase.md` | Firebase setup guide | 2026-01-24 |
| `docs/setup/environment.md` | Environment configuration | 2026-01-19 |
| `docs/setup/ports.md` | Port configuration | 2026-01-24 |
| `docs/architecture/` | System architecture docs | 2026-01-19 |
| `docs/patterns/` | Code patterns and best practices | 2026-01-19 |
| `README.md` (root) | Project README | 2026-05-12 |

### Archived Documents

| Document | Reason | Archived |
|----------|--------|----------|
| `docs/CODEBASE_ANALYSIS.md` | Superseded by this guide + beads issues | 2026-02-09 |
| `docs/METRICS.md` | Metrics folded into this guide's phase tracking | 2026-02-09 |
| `docs/SERVICES_REORGANIZATION_PLAN.md` | Plan tracked as item 4.4 in this guide | 2026-02-09 |
| `docs/SERVICES_REORGANIZATION_PROGRESS.md` | Progress tracked in this guide | 2026-02-09 |
| `docs/SERVICE_LAYER_IMPROVEMENTS.md` | Consolidated into item 4.4 | 2026-02-09 |
| `docs/LEADERBOARD_SERVICE_CONSOLIDATION.md` | Completed work, no longer actionable | 2026-02-09 |
| `docs/ARCHITECTURE_CONSOLIDATION.md` | Completed work, no longer actionable | 2026-02-09 |
| `docs/FRONTEND_IMPROVEMENTS.md` | Items tracked in this guide | 2026-02-09 |
| `docs/SOCIAL_FEATURES_IMPLEMENTATION.md` | Feature spec, not active | 2026-02-09 |
| `docs/USER_SERVICE_REFACTOR.md` | Completed work | 2026-02-09 |
| `docs/PRODUCT_REQUIREMENTS.md` | Static reference, not actively maintained | 2026-02-09 |
| `docs/GAME_DESIGN.md` | Static reference, not actively maintained | 2026-02-09 |
| `codebase_analysis.md` (root) | Superseded by `docs/CODEBASE_ANALYSIS.md`, now archived | 2026-02-09 |

---

## 10. Product epics & issue tracking

Stable IDs for the **friend challenges** product thread and **friends leaderboard** depth. Code comments point here (`docs/GUIDE.md §10`).

| ID | Scope | Code / notes |
|----|--------|----------------|
| **FC-1** | Challenge modal on social | **Shipped:** `ChallengeFriendDialog` + `handleChallengeClick` on `app/social/page.tsx` |
| **FC-2** | Friend stats from real challenge data | **Shipped:** `useFriendStats` reads `getChallenges` via shared query key (`app/hooks/useFriends.ts`) |
| **LB-1** | Friends-only leaderboard + `isFriend` on entries | **Shipped:** Friends type + bounded global slice (`DECISIONS.md` §8) |

**Product thread:** FC/LB vertical slice is in place; iterate on UX and data quality as challenges/notifications grow.

### 10.1 Issue tracking without beads

**Beads (`bd`) is optional.** If `bd` fails (Dolt / local database), do not block delivery — use **this GUIDE**, GitHub issues, and epic IDs **FC-*** / **LB-*** in commits. To try repairing beads: run `bd doctor` and follow `.beads/` / project docs only if you explicitly want local issue sync.

---

## How to Use This Guide

### Starting a work session
1. Read the current phase and pick the next pending item
2. Check the changelog for recent context
3. Mark the item status as you work
4. When done, add a changelog entry with date, item ref, and files modified

### After completing work
1. Update the item's **Status** to `Done` and set **Completed** date
2. Add a **Changelog** entry
3. If the work changed any documented behavior, update the relevant doc in the **Documentation Tracker**
4. If you created or deleted any docs, update the tracker tables

### Rules
- One source of truth: this file. Don't create parallel tracking docs.
- Every item has a clear file reference so you can jump straight to the code.
- Changelog entries are append-only. Never delete history.
- If an item spawns new work, add it as a new item in the appropriate phase.
