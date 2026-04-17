# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PROJECT VIGIL is a transparent governance dashboard for visualizing public data about Indian politicians — assets, criminal cases, and audit reports. It is a proof-of-concept application.

## Commands

- `npm run dev` — Start dev server on port 3000
- `npm run build` — Production build via Vite
- `npm run preview` — Preview production build

There are no test or lint scripts configured.

## Architecture

**Frontend**: React 19 + TypeScript, bundled with Vite. Tailwind CSS is loaded via CDN (`index.html`), not as a build dependency. Custom brand colors are defined inline in `index.html`'s Tailwind config.

**Data layer**: Currently uses hardcoded TypeScript data files in `data/` (one per politician). `services/api.ts` serves as the API layer — it searches/filters these local datasets and uses the Gemini API (`@google/genai`) to generate plausible associated audit reports for select profiles.

**Supabase**: Client is set up in `services/supabaseClient.ts` but not yet configured with real credentials — it's placeholder/scaffolding.

**Python scraper**: `scraper/scraper.py` (uses requests + BeautifulSoup) and a Vercel serverless function at `api/scrape.py`. These are binary/compiled files in the current state.

**Path alias**: `@/*` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`).

## Key Files

- `App.tsx` — Root component: search bar → politician list → profile detail view, with a session-scoped disclaimer modal
- `services/api.ts` — All data fetching: `searchPoliticians`, `getPoliticianProfile`, `getAssociatedReports` (Gemini-powered)
- `types.ts` — Core interfaces: `PoliticianSummary`, `PoliticianProfileData`, `AssetDeclaration`, `CriminalCase`, `AssociatedReport`
- `components/PoliticianProfile.tsx` — Profile detail page orchestrating sub-components (header, asset chart, criminal cases, reports, RTI helper)

## Environment

- `GEMINI_API_KEY` in `.env.local` — used for AI-generated audit report summaries. Exposed to the client via Vite's `define` config as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

## Deployment

Deployed on Vercel. `vercel.json` rewrites all `/api/*` routes to `/api/scrape`.
