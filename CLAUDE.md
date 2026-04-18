# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Vigil is a transparent governance dashboard for visualizing public data about Indian politicians — assets, criminal cases, parliamentary performance, and audit reports. It scrapes data live from myneta.info and prsindia.org, with AI-powered extraction and graceful fallback to a bundled local index of 4000+ politicians.

## Commands

- `npm run dev` — Start Vite dev server on port 3000 (API routes unavailable locally; falls back to cached/local data)
- `npm run build` — Production build via Vite
- `npm run preview` — Preview production build
- `npm run test` — Run Vitest once
- `npm run test:watch` — Run Vitest in watch mode
- `npm run seed` — Seed Supabase from CSV files via `tsx scripts/seed-supabase.ts`

## Architecture

### Frontend

React 19 + TypeScript, bundled with Vite. Tailwind CSS is loaded via CDN in `index.html` (not a build dependency) with custom brand colors defined inline. No router library — `App.tsx` uses manual URL parsing with `window.location.pathname` and the History API for two routes: `/` (search) and `/politician/<slug>` (profile).

### Data Flow

```
App.tsx (search/profile)
  → services/api.ts (orchestrator: local → cache → live → fallback)
    ├→ services/fuzzySearch.ts (Fuse.js on data/politician_index.json, instant)
    ├→ services/supabaseCache.ts (Supabase cache: 24h profiles, 1h searches)
    └→ services/liveFetcher.ts (fetch /api/* with AbortSignal timeouts)
        → api/*.ts (Vercel serverless functions)
          ├→ Scrapes myneta.info (cheerio) + prsindia.org
          ├→ Claude Haiku for HTML extraction (fallback: regex)
          └→ Gemini 2.5 Flash for audit report generation
  → services/profileMerger.ts (maps raw API data → domain types)
```

Every response includes a `DataMeta` object (`source: 'live' | 'cache' | 'fallback'`) so the UI can show data provenance.

### API Layer (`api/`)

Vercel serverless functions that scrape external sites. These only run in production (Vercel), not during local dev.

- `api/search.ts` — Searches myneta.info across 13 election paths, deduplicates results
- `api/profile.ts` — Scrapes full politician profile (assets, criminal cases, ITR income)
- `api/reports.ts` — Generates audit report findings via Gemini AI
- `api/prs.ts` — Fetches parliamentary performance from PRS India
- `api/lib/aiExtractor.ts` — Claude Haiku extraction (truncates to 8KB, returns structured JSON)
- `api/lib/prsScraper.ts` — PRS India scraper
- `api/lib/matchIdentity.ts` — Fuzzy identity matching across data sources

### Services Layer (`services/`)

- `api.ts` — Main orchestrator: `searchPoliticians()` and `getPoliticianProfile()` with three-tier fallback
- `liveFetcher.ts` — Fetch wrappers with explicit timeouts (15s search, 20s profile) and HTML-response guards
- `fuzzySearch.ts` — Fuse.js over bundled `data/politician_index.json` (4000+ entries)
- `supabaseCache.ts` — Read/write Supabase cache with TTLs; gracefully handles missing config
- `profileMerger.ts` — Maps raw API responses to `PoliticianProfileData` type

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json` and `vite.config.ts`).

## Environment Variables

In `.env.local`:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase client (optional; app works without)
- `ANTHROPIC_API_KEY` — Claude API for HTML extraction in serverless functions
- `GEMINI_API_KEY` — Gemini API for audit report generation (also exposed to client via Vite `define`)

## Testing

Tests use Vitest with jsdom environment. Config in `vitest.config.ts`, setup in `tests/setup.ts`. Test files live in `tests/` (not colocated with source).

## Deployment

Deployed on Vercel. `vercel.json` defines rewrites for each API route with per-function timeouts (profile: 60s, others: 30s) and SPA fallback (`/politician/*` → `/index.html`).
