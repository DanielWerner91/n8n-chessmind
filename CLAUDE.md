# ChessMind — Claude Code Project Guide

## Project Overview

ChessMind is an AI chess coach web app that connects to Chess.com or Lichess accounts, analyzes recent games using statistical algorithms and browser-based Stockfish, then generates personalized 8-week training plans with daily modules tailored to the player's weaknesses, archetype, and rating bracket.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **React:** 19.2.3
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x (with `@tailwindcss/postcss`)
- **State/Data Fetching:** @tanstack/react-query 5.90.21
- **Animations:** framer-motion 12.35.0
- **Icons:** lucide-react 0.577.0
- **Chess Logic:** chess.js 1.4.0
- **Engine:** stockfish 18.0.5 (WASM, runs in Web Worker)
- **Auth:** Supabase Auth (Google + Apple OAuth)
- **Database:** Supabase (profiles + webhook_events tables)
- **Payments:** Lemon Squeezy (subscriptions)
- **Legal:** Termly (privacy policy + terms of service)
- **Utilities:** clsx 2.1.1, tailwind-merge 3.5.0

## Auth & Subscription Architecture

- **Authentication:** Supabase Auth with Google OAuth (+ Apple Sign-In). Middleware protects all routes except `/login`, `/auth`, `/privacy`, `/terms`, `/api/webhooks`.
- **Profiles:** Auto-created on signup via DB trigger. Stores `subscription_status` ('free' | 'pro').
- **Payments:** Lemon Squeezy checkout + webhook handler. Webhook verifies HMAC signature, checks idempotency, updates profile subscription status.
- **Gating:** Training plans (8-week) require Pro subscription. Analysis/dashboard/games are free.
- **Client state:** Chess data (games, analysis, training plans) still lives in `localStorage`. Auth/subscription state comes from Supabase.

## Folder Structure

```
chessmind/
├── middleware.ts             # Supabase auth session refresh + route protection
├── public/
│   ├── stockfish-worker.js  # Web Worker wrapper for Stockfish WASM
│   ├── stockfish.js         # Stockfish JS engine
│   └── stockfish.wasm       # Stockfish WASM binary
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout (Inter font, QueryProvider, ChessProvider)
│   │   ├── page.tsx         # Root redirect (→ /dashboard or /onboarding)
│   │   ├── globals.css      # Tailwind theme tokens + keyframe animations
│   │   ├── login/page.tsx   # OAuth login page (Google + Apple)
│   │   ├── onboarding/      # Platform selector + username input
│   │   ├── privacy/page.tsx # Termly privacy policy embed
│   │   ├── terms/page.tsx   # Termly terms of service embed
│   │   ├── auth/
│   │   │   ├── callback/route.ts  # OAuth callback (exchange code for session)
│   │   │   └── signout/route.ts   # Sign out (clear session + redirect)
│   │   ├── (app)/           # Route group with sidebar/tab bar layout
│   │   │   ├── layout.tsx   # App shell: sidebar (desktop) + bottom tabs (mobile)
│   │   │   ├── dashboard/   # Stats overview, donut chart, top openings
│   │   │   ├── games/       # Game list + game detail views
│   │   │   ├── analysis/    # AI analysis report
│   │   │   ├── training/    # 8-week plan (Pro-gated) + week details + Chess OS
│   │   │   └── settings/    # Profile, subscription, sign out
│   │   └── api/
│   │       ├── chess/       # Proxy routes for Chess.com/Lichess APIs
│   │       ├── checkout/route.ts   # POST: Create Lemon Squeezy checkout
│   │       ├── billing/route.ts    # POST: Get Lemon Squeezy customer portal
│   │       └── webhooks/
│   │           └── lemonsqueezy/route.ts  # POST: Webhook handler (HMAC verified)
│   ├── components/
│   │   ├── ChessBoard.tsx   # SVG chess board renderer
│   │   ├── DonutChart.tsx   # SVG donut chart
│   │   ├── GameCard.tsx     # Game list item card
│   │   ├── StatCard.tsx     # Reusable stat display card
│   │   ├── ProgressHeader.tsx # XP/level progress indicator
│   │   ├── WelcomeOverlay.tsx # Welcome modal for new plans
│   │   ├── pro-only.tsx     # <ProOnly> wrapper + <ProBadge>
│   │   ├── termly-embed.tsx # Termly legal page embed
│   │   ├── auth/
│   │   │   └── login-form.tsx # Google + Apple OAuth buttons
│   │   └── ui/             # 21st.dev animated UI components (DO NOT MODIFY)
│   ├── hooks/
│   │   └── use-subscription.ts # useSubscription() — reads profile from Supabase
│   └── lib/
│       ├── ChessContext.tsx     # Global state: user, analysis, training plan
│       ├── QueryProvider.tsx    # React Query client provider
│       ├── chessApi.ts          # Chess.com + Lichess API fetchers
│       ├── analysisEngine.ts    # Stats-based analysis
│       ├── diagnosticEngine.ts  # Player diagnostic + archetype detection
│       ├── trainingPlanner.ts   # 8-week training plan generator
│       ├── gameAnalyzer.ts      # Stockfish-powered game analysis
│       ├── stockfishClient.ts   # Stockfish WASM Web Worker singleton
│       ├── openingExplorer.ts   # Lichess Opening Explorer API
│       ├── gamification.ts      # XP, levels, streaks, badges
│       ├── check-subscription.ts # Server-side requirePro() helper
│       ├── colors.ts            # Design system color constants
│       ├── types.ts             # All TypeScript types/interfaces
│       ├── utils.ts             # cn() utility
│       └── supabase/
│           ├── client.ts        # Browser Supabase client
│           ├── server.ts        # Server Supabase client (cookie-aware)
│           ├── service.ts       # Service role client (webhooks ONLY)
│           └── middleware.ts    # Session refresh + route protection
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/ChessContext.tsx` | Central state management — all chess data flows through here |
| `src/lib/chessApi.ts` | Chess.com and Lichess API integration |
| `src/lib/analysisEngine.ts` | Stats-based analysis algorithm |
| `src/lib/diagnosticEngine.ts` | Player diagnostic + archetype detection |
| `src/lib/trainingPlanner.ts` | 8-week training plan generation (largest file) |
| `src/lib/supabase/middleware.ts` | Auth middleware — route protection logic |
| `src/app/api/webhooks/lemonsqueezy/route.ts` | Payment webhook handler |
| `src/hooks/use-subscription.ts` | Client-side subscription state |
| `src/lib/colors.ts` | Design system color tokens |
| `src/app/globals.css` | Tailwind theme tokens and animations |

## Data Storage

### Supabase (auth + subscription)
- `profiles` table — auto-created on signup, stores subscription_status, Lemon Squeezy IDs
- `webhook_events` table — idempotency tracking for payment webhooks
- RLS enabled: users can only read/update their own profile

### localStorage (chess data)
| Key | Data |
|-----|------|
| `chessmind_user` | `{ username, platform }` |
| `chessmind_analysis` | Full `AnalysisReport` JSON |
| `chessmind_training` | Legacy flat `TrainingTask[]` (backward compat) |
| `chessmind_plan` | Full `TrainingPlan` JSON (8-week plan + diagnostic + Chess OS) |

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/chess/profile` | GET | Yes (middleware) | Proxy Chess.com/Lichess profile |
| `/api/chess/stats` | GET | Yes (middleware) | Proxy Chess.com/Lichess ratings |
| `/api/chess/games` | GET | Yes (middleware) | Proxy Chess.com/Lichess games |
| `/api/checkout` | POST | Yes (explicit) | Create Lemon Squeezy checkout |
| `/api/billing` | POST | Yes (explicit) | Get customer billing portal |
| `/api/webhooks/lemonsqueezy` | POST | Signature | Handle subscription webhooks |

## External APIs

### Chess.com API
- Base: `https://api.chess.com/pub`
- Endpoints: `/player/{username}`, `/player/{username}/stats`, `/player/{username}/games/{YYYY}/{MM}`
- Code: `src/lib/chessApi.ts`

### Lichess API
- Base: `https://lichess.org/api`
- Uses `Accept: application/x-ndjson` for game streaming
- Code: `src/lib/chessApi.ts`

### Stockfish (Browser)
- Runs entirely in-browser via WASM Web Worker
- Default depth: 14 for game analysis, 18 for single position
- Code: `src/lib/stockfishClient.ts`, `src/lib/gameAnalyzer.ts`

**There is no Claude/Anthropic API integration.** All "AI" analysis is algorithmic.

## Naming Conventions

- **Components:** PascalCase (`ChessBoard.tsx`, `GameCard.tsx`)
- **Pages:** `page.tsx` per App Router convention
- **Hooks:** `useChess()`, `useProfile()`, `useStats()`, `useGames()` from ChessContext; `useSubscription()` from hooks/
- **Lib files:** camelCase (`chessApi.ts`, `analysisEngine.ts`)
- **Types:** PascalCase interfaces in `types.ts`
- **UI components:** kebab-case in `components/ui/` (DO NOT MODIFY)
- **Colors:** `Colors` object from `colors.ts`, mirrored as CSS custom properties in `globals.css`
- **localStorage keys:** `chessmind_` prefix with snake_case

## Current Feature Status

### Working:
- Google OAuth login (Apple Sign-In configured but requires Apple Developer setup)
- Chess.com and Lichess account connection (username-only)
- Game fetching with filtering (last 30 days, by result/time control)
- Game detail view with board, moves, accuracy
- Statistical analysis engine (6-axis scores, strengths, weaknesses)
- Opening analysis with win rates
- Browser Stockfish engine analysis
- 8-week training plan generation (Pro-gated)
- Gamification (XP, levels, streaks, badges)
- Settings with sign out, subscription management
- Responsive layout (sidebar desktop, bottom tabs mobile)
- Legal pages (Termly embeds)

### In Progress:
- Lemon Squeezy account pending approval (checkout + webhook code ready)
- Auto-sync toggle (UI only, no backend)
- Training reminders toggle (UI only, no notifications)

### Known Issues / Do Not Touch:
- Legacy 7-day training system (`trainingTasks`, `initTrainingMutation`) kept for backward compat
- `eslint-disable` comments in `chessApi.ts` for Chess.com raw game parsing — intentional

## Critical Rules

- **Do not modify `components/ui/`** — 21st.dev community components, copied as-is
- **Service role key ONLY in webhook handlers** — never import `createServiceClient` in client code
- **All Lemon Squeezy calls are server-side only** — API key never touches the browser
- **Webhook signature verification is non-negotiable** — HMAC-SHA256 + timingSafeEqual
- **Colors must stay consistent** — use `Colors` import or Tailwind theme tokens
- **All chess API calls go through API routes** — never call Chess.com/Lichess directly from client
- **Stockfish runs client-side only** — WASM worker cannot run on server
- **localStorage keys use `chessmind_` prefix**

## Environment Variables

See `.env.example` for all required variables:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side only, bypasses RLS
- `LEMONSQUEEZY_API_KEY` / `LEMONSQUEEZY_STORE_ID` / `LEMONSQUEEZY_WEBHOOK_SECRET` / `LEMONSQUEEZY_VARIANT_ID` — Payments
- `NEXT_PUBLIC_TERMLY_WEBSITE_UUID` — Legal pages
- `NEXT_PUBLIC_APP_URL` — App base URL

## Commands

```
dev:   next dev
build: next build
start: next start
lint:  eslint
```
