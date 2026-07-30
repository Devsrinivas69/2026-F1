
# F1 Live Commander — Build Plan

A cinematic, Netflix-broadcast-grade F1 live race app. All 10 features in one build, on the Lovable stack with your Firebase for historical caching.

## Stack (adapted from your spec)

| Layer | What we'll use | Notes |
|---|---|---|
| Frontend | Vite + React + TanStack Router + TypeScript | Lovable's standard; replaces Next.js |
| Styling | Tailwind + dark cinematic theme | Your palette exactly |
| Backend / API proxy | Lovable Cloud edge functions (Deno) | Replaces `/app/api/*` routes; bypasses CORS for OpenF1 |
| Cache / Historical | Your Firebase (Firestore) | Race summaries, replay cache, user prefs |
| AI race summary | Lovable AI Gateway (`google/gemini-2.5-flash`) by default, or your OpenAI key | Your call |
| 3D | three + @react-three/fiber + drei + postprocessing | As specified |
| Charts | recharts + d3 | As specified |
| Animation | framer-motion | As specified |
| Fonts | Orbitron + JetBrains Mono | Loaded via Google Fonts |
| Data | OpenF1 REST (`api.openf1.org/v1`) | Proxied via edge function |

## What you'll need to provide later

- Firebase web config (apiKey, projectId, etc.) — pasted into the app
- OpenAI key only if you want OpenAI instead of Gemini
- Iconic race `session_key`s if your hardcoded ones (7953, 8128, 9149) turn out wrong — I'll verify against OpenF1 at build time

## Phase 0 — Design directions (first, before any code)

Per your pick, I'll generate 3 rendered cinematic broadcast directions, all locked to:
- Palette: `#0a0a0a` / `#111111` / `#E8002D` / `#FFD700` / `#00D2BE` / `#F5F5F5` / `#888888`
- Typography: Orbitron headings, JetBrains Mono data
- Mood: pit wall + Netflix F1, scanlines, glow, no AI-slop

They'll vary in composition/density/hierarchy (e.g. data-dense FIA-teletype vs. cinematic broadcast hero vs. minimalist pit-wall HUD). You pick one, I build the whole app against it.

## Phase 1 — Foundation

1. Enable Lovable Cloud (for edge functions + secrets)
2. Wire Orbitron + JetBrains Mono, install Tailwind tokens for the palette
3. Build shared primitives: `DriverBadge`, `TireIcon`, `DRSIndicator`, `TeamColorBar`, `ScanlineOverlay`
4. App shell: top nav (desktop) + bottom tab bar (mobile), routes for `/`, `/live`, `/telemetry/:driverNo`, `/pitwall`, `/netflix`, `/replay/:raceId`
5. Firebase init (lazy, only when config provided)

## Phase 2 — Edge functions (OpenF1 proxy)

Single edge function `openf1-proxy` that accepts `{endpoint, params}` and returns OpenF1 JSON with CORS + 2s edge-cache. Saves per-endpoint hammering and centralizes error handling. Polling hooks (`useOpenF1(endpoint, params, intervalMs)`) on the client use `AbortController` for stale-request cancellation.

Plus `ai-summary` edge function that takes race context and calls Gemini (or OpenAI if you switched).

## Phase 3 — Live race surface

Built in this order, each verified visually before moving on:

1. **Landing** (`/`) — mode selector with Three.js `CircuitScene` hero (rotating circuit + 3 looping cars + star particles)
2. **TimingTower** — Framer Motion `layoutId` row reordering, sector colors (purple/green/yellow), DRS glow, pit flash, team color border, mobile collapse
3. **TrackMap 2D** (D3) — circuit SVG path + animated driver dots with `d3.transition`
4. **TrackMap 3D** (R3F) — `TubeGeometry` circuit, `F1Car3D` per driver with emissive team color, OrbitControls, leader-follow camera, bloom post-processing, exhaust particles
5. **TelemetryChart** — 6 scrolling Recharts (speed/throttle/brake/gear/rpm/drs), 60-point sliding window, driver picker, A/B compare with delta trace
6. **TeamRadioFeed** — polled, inline audio, slide-in animation, driver badges
7. **RaceControlFeed** — color-coded teletype with blinking cursor on newest
8. **TireCompound3D** modal — `TorusGeometry` tire, compound color, slow rotation, wear stats

## Phase 4 — Modes

9. **Pit Wall** (`/pitwall`) — CSS Grid 5-zone layout, fullscreen, `P` keyboard shortcut, scanline overlay, race-time clock, red flashing border when SC deployed
10. **Netflix Story Mode** (`/netflix`) — scroll-driven `useScroll`/`useTransform` sections (Title → Championship → Flashpoint → Strategy → The Moment → Standings), parallax circuit bg, staggered reveals
11. **Historical Replay** (`/replay/:raceId`) — hardcoded iconic races (verified session keys), preload all laps via edge function, scrubber + 1×/5×/20×/60× speed, drives all live components from replay frames

## Phase 5 — Polish & verification

- Mobile: bottom tab bar, swipe-to-reveal sectors, pinch-zoom 3D, horizontal-scroll charts, full-screen bottom-sheet modals
- All Three.js components loaded via `React.lazy` + Suspense (Lovable equivalent of Next dynamic ssr:false)
- `useMemo` on chart data, AbortController on polls, WebP images, ≤10k tris per scene
- TypeScript clean
- QA: take screenshots of each route at desktop + mobile, verify no slop patterns (generic CTAs, default shadcn buttons, stock 3-col feature grids, etc.) per Lovable's direction-fidelity checklist

## Technical notes for the technical reader

- **Polling cadence**: timing 2s, race_control 3s, radio 5s, weather 30s — staggered to avoid synced bursts
- **Sector color logic**: track `fastest_overall` and per-driver `personal_best` in a Zustand store updated on each `/laps` poll
- **3D perf**: instanced meshes for cars if >10 on track; share one `MeshStandardMaterial` per team
- **Replay**: load all `/car_data` + `/position` + `/intervals` once into IndexedDB (via Firebase cache mirror), step with `requestAnimationFrame` keyed to virtual race-time
- **Firebase scope**: client-side only (Web SDK) — write `race_summaries`, `user_preferences`, `replay_cache` collections. No admin SDK (no Next API routes to host it in).
- **CORS**: OpenF1 actually allows CORS, but proxying still buys us caching + a single point to add retries/backoff

## Out of scope (call out now)

- Auth / user accounts (your spec mentions `user_preferences/{uid}` — I'll store prefs in localStorage unless you want Lovable Cloud auth added)
- Audio transcription of team radio (OpenF1 doesn't transcribe; we show the audio player only — the example transcripts in your prompt aren't real OpenF1 data)
- Lighthouse run (sandbox can't run it; I'll hit the perf targets structurally)
- Vercel deploy (Lovable publishes via its own publish flow, not Vercel)

## On approval

I'll start with Phase 0 design directions. Once you pick one, I build straight through Phases 1→5, checking in only if Firebase config or a real blocker appears.
