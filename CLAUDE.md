# ChessMind — Claude Code Project Guide

## Project Overview

ChessMind is a client-side AI chess coach web app that connects to Chess.com or Lichess accounts, analyzes recent games using statistical algorithms and browser-based Stockfish, then generates personalized 8-week training plans with daily modules tailored to the player's weaknesses, archetype, and rating bracket.

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
- **Utilities:** clsx 2.1.1, tailwind-merge 3.5.0

No database. No auth. No backend beyond Next.js API routes. All user data lives in `localStorage`.

## Folder Structure

```
chessmind/
├── public/
│   ├── stockfish-worker.js    # Web Worker wrapper for Stockfish WASM
│   ├── stockfish.js           # Stockfish JS engine
│   └── stockfish.wasm         # Stockfish WASM binary
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (Inter font, QueryProvider, ChessProvider)
│   │   ├── page.tsx           # Root redirect (→ /dashboard or /onboarding)
│   │   ├── globals.css        # Tailwind theme tokens + keyframe animations
│   │   ├── onboarding/
│   │   │   └── page.tsx       # Platform selector + username input
│   │   ├── (app)/             # Route group with sidebar/tab bar layout
│   │   │   ├── layout.tsx     # App shell: sidebar (desktop) + bottom tabs (mobile)
│   │   │   ├── dashboard/page.tsx     # Stats overview, donut chart, top openings, quick insights
│   │   │   ├── games/page.tsx         # Filterable game list (last 30 days)
│   │   │   ├── games/[gameId]/page.tsx # Game detail: board, moves, accuracy, AI commentary
│   │   │   ├── analysis/page.tsx      # AI analysis report: 6-axis scores, strengths/weaknesses, engine analysis
│   │   │   ├── training/page.tsx      # 8-week plan overview with week cards and module checkboxes
│   │   │   ├── training/week/[n]/page.tsx # Week detail: day selector, module list per day
│   │   │   ├── training/chess-os/page.tsx # Chess OS reference doc: repertoire, endgames, ritual, tilt protocol
│   │   │   └── settings/page.tsx      # Profile, toggles, clear data, disconnect
│   │   └── api/chess/
│   │       ├── profile/route.ts       # GET: fetch player profile from Chess.com/Lichess
│   │       ├── stats/route.ts         # GET: fetch player stats (ratings)
│   │       └── games/route.ts         # GET: fetch recent games (last 30 days)
│   ├── components/
│   │   ├── ChessBoard.tsx     # SVG chess board renderer (from FEN)
│   │   ├── DonutChart.tsx     # SVG donut chart (wins/draws/losses)
│   │   ├── GameCard.tsx       # Game list item card
│   │   ├── StatCard.tsx       # Reusable stat display card
│   │   └── ui/               # 21st.dev animated UI components
│   │       ├── animated-card.tsx
│   │       ├── animated-shiny-text.tsx
│   │       ├── aurora-background.tsx
│   │       ├── border-beam.tsx
│   │       ├── chess-background.tsx
│   │       ├── glow-effect.tsx
│   │       ├── neon-gradient-card.tsx
│   │       ├── number-ticker.tsx
│   │       └── shimmer-button.tsx
│   └── lib/
│       ├── ChessContext.tsx       # Global state: user, analysis, training plan, mutations
│       ├── QueryProvider.tsx      # React Query client provider
│       ├── chessApi.ts            # Chess.com + Lichess API fetchers
│       ├── analysisEngine.ts      # Stats-based analysis (strengths, weaknesses, 6-axis scores)
│       ├── diagnosticEngine.ts    # Deep player diagnostic (archetype, adaptive flags, tilt detection)
│       ├── trainingPlanner.ts     # 8-week training plan generator with Chess OS document
│       ├── gameAnalyzer.ts        # Stockfish-powered game analysis (blunders, mistakes, critical moments)
│       ├── stockfishClient.ts     # Stockfish WASM Web Worker singleton wrapper
│       ├── openingExplorer.ts     # Lichess Opening Explorer API (master game stats)
│       ├── colors.ts              # Design system color constants
│       ├── types.ts               # All TypeScript types/interfaces
│       └── utils.ts               # cn() utility (clsx + tailwind-merge)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/ChessContext.tsx` | Central state management — all data flows through here |
| `src/lib/chessApi.ts` | Chess.com and Lichess API integration |
| `src/lib/analysisEngine.ts` | Stats-based analysis algorithm |
| `src/lib/diagnosticEngine.ts` | Player diagnostic + archetype detection |
| `src/lib/trainingPlanner.ts` | 8-week training plan generation |
| `src/lib/gameAnalyzer.ts` | Stockfish engine analysis |
| `src/lib/types.ts` | All shared TypeScript types |
| `src/lib/colors.ts` | Design system color tokens |
| `src/app/(app)/layout.tsx` | App shell with navigation |
| `src/app/globals.css` | Tailwind theme tokens and animations |

## Database

**There is no database.** All state is stored in `localStorage` under these keys:

| Key | Data |
|-----|------|
| `chessmind_user` | `{ username, platform }` |
| `chessmind_analysis` | Full `AnalysisReport` JSON |
| `chessmind_training` | Legacy flat `TrainingTask[]` (backward compat) |
| `chessmind_plan` | Full `TrainingPlan` JSON (8-week plan + diagnostic + Chess OS) |

## API Routes

All routes are `GET` and take `?username=X&platform=Y` query params.

| Route | Does |
|-------|------|
| `/api/chess/profile` | Proxies Chess.com/Lichess player profile fetch |
| `/api/chess/stats` | Proxies Chess.com/Lichess player stats (ratings) fetch |
| `/api/chess/games` | Proxies Chess.com/Lichess recent games fetch (last 30 days, max 100) |

API routes exist to keep external API calls server-side. No authentication.

## External APIs

### Chess.com API
- Base: `https://api.chess.com/pub`
- Endpoints: `/player/{username}`, `/player/{username}/stats`, `/player/{username}/games/{YYYY}/{MM}`
- Fetches last 2 months of games, filters to 30 days
- Extracts: profile, ratings (rapid/blitz/bullet), games with PGN, accuracy, openings
- Code: `src/lib/chessApi.ts` — `fetchChessComProfile()`, `fetchChessComStats()`, `fetchChessComGames()`

### Lichess API
- Base: `https://lichess.org/api`
- Endpoints: `/user/{username}`, `/games/user/{username}` (ndjson)
- Uses `Accept: application/x-ndjson` for game streaming
- Code: `src/lib/chessApi.ts` — `fetchLichessProfile()`, `fetchLichessStats()`, `fetchLichessGames()`

### Lichess Opening Explorer
- URL: `https://explorer.lichess.ovh/masters?fen={fen}`
- Fetches master game statistics for opening positions
- Has in-memory cache and 200ms delay between calls
- Code: `src/lib/openingExplorer.ts`

### Stockfish (Browser)
- Runs entirely in-browser via WASM Web Worker
- Files: `public/stockfish-worker.js`, `public/stockfish.js`, `public/stockfish.wasm`
- Singleton worker with promise-based evaluation
- Default depth: 14 for game analysis, 18 for single position
- Code: `src/lib/stockfishClient.ts`, `src/lib/gameAnalyzer.ts`

**There is no Claude/Anthropic API integration.** All "AI" analysis is algorithmic (statistical analysis + Stockfish engine).

## Naming Conventions

- **Components:** PascalCase, default export, one component per file (`ChessBoard.tsx`, `GameCard.tsx`)
- **Pages:** `page.tsx` within Next.js App Router folder structure, default export
- **Hooks:** Exported from `ChessContext.tsx` as `useChess()`, `useProfile()`, `useStats()`, `useGames()`
- **Lib files:** camelCase (`chessApi.ts`, `analysisEngine.ts`)
- **Types:** PascalCase interfaces in `types.ts` (`ChessGame`, `AnalysisReport`, `TrainingPlan`)
- **UI components:** kebab-case files in `components/ui/` (`animated-shiny-text.tsx`, `shimmer-button.tsx`)
- **Colors:** Object exported as `Colors` from `colors.ts` — also mirrored as CSS custom properties in `globals.css`
- **localStorage keys:** `chessmind_` prefix with snake_case

## Current Feature Status

### Working:
- Chess.com and Lichess account connection (username-only, no OAuth)
- Game fetching with filtering (last 30 days, by result/time control)
- Game detail view with board, moves, accuracy, template-based commentary
- Statistical analysis engine (6-axis scores, strengths, weaknesses, playing style narrative)
- Opening analysis with win rates and keep/improve/drop recommendations
- Browser Stockfish engine analysis (blunders, mistakes, critical moments with board positions)
- 8-week personalized training plan generation with archetype detection
- Daily training modules with Lichess links, rationale, and completion tracking
- Chess OS reference document (repertoire, endgame reference, pre-move ritual, tilt protocol)
- Week-by-week progress tracking with visual indicators
- Settings page with disconnect and data clearing
- Responsive layout (sidebar on desktop, bottom tabs on mobile)
- Aurora background, shimmer buttons, neon gradient cards, number tickers

### In Progress / Placeholder:
- "Upgrade to Pro" button in settings (UI only, no functionality)
- Auto-sync toggle (UI only, no backend)
- Training reminders toggle (UI only, no notifications)
- AI Commentary in game detail is template-based, not actual AI analysis

### Known Issues / Do Not Touch:
- Legacy 7-day training system (`trainingTasks`, `initTrainingMutation`) is kept for backward compatibility but unused by current UI — do not remove without checking all references
- `eslint-disable` comments in `chessApi.ts` for Chess.com raw game parsing — intentional due to untyped API response

## Established Patterns

### API Route Pattern
All API routes follow the same structure — validate query params, call `chessApi.ts` function, return JSON or error:
```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const platform = searchParams.get('platform') as Platform;
  if (!username || !platform) return NextResponse.json({ error: '...' }, { status: 400 });
  try {
    const data = await fetchSomething(username, platform);
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

### State Management Pattern
All global state lives in `ChessContext.tsx`. Data fetching uses React Query hooks exported alongside the context. Mutations handle loading/error states and persist results to `localStorage`. Components access state via `useChess()` and data via `useProfile()`, `useStats()`, `useGames()`.

### UI Pattern
Pages use framer-motion `stagger` + `fadeUp` animation variants. Cards use inline `style={{ backgroundColor: Colors.card, borderColor: Colors.border }}` alongside Tailwind classes. 21st.dev components (`ShimmerButton`, `NeonGradientCard`, `AnimatedShinyText`, `BorderBeam`, `NumberTicker`) are used for polish — they live in `components/ui/` and should not be modified.

## Critical Rules

- **No database** — all data is client-side localStorage. Do not add Supabase or any DB.
- **No auth** — the app uses username-only connection. Do not add authentication.
- **No Claude/Anthropic API** — analysis is algorithmic. The "AI" label is marketing.
- **Do not modify `components/ui/`** — these are 21st.dev community components, copied as-is.
- **Keep API routes thin** — they are pure proxies to `chessApi.ts` functions. Business logic belongs in `lib/`.
- **Colors must stay consistent** — use `Colors` import from `colors.ts` or Tailwind theme tokens from `globals.css`. Never hardcode color values in components.
- **All chess API calls go through API routes** — never call Chess.com/Lichess directly from client components.
- **Stockfish runs client-side only** — the WASM worker cannot run on the server.
- **localStorage keys use `chessmind_` prefix** — maintain this convention.

## Commands

```
dev:   next dev
build: next build
start: next start
lint:  eslint
```

## Environment Variables

None. The app has no `.env` file and references no environment variables. All API endpoints (Chess.com, Lichess) are public and hardcoded in `chessApi.ts` and `openingExplorer.ts`.
