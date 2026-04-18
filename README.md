# Project Vigil

**Open-source governance transparency dashboard for Indian democracy.**

Project Vigil aggregates publicly available data about Indian politicians — asset declarations, criminal cases, parliamentary performance, and audit reports — into a single, searchable interface. It aims to make democratic accountability data accessible and understandable for every citizen.

## Features

- **Search 4,000+ politicians** — Instant fuzzy search across Lok Sabha and state assembly candidates with data from myneta.info
- **Asset & liability tracking** — Visualize asset growth over multiple election cycles with interactive charts
- **Criminal case records** — View pending cases, IPC sections, and case status from affidavit disclosures
- **Parliamentary performance** — Attendance, questions asked, debates participated, and bills introduced (via PRS India)
- **ITR income data** — Self, spouse, and HUF income declarations across financial years
- **AI-generated audit summaries** — Contextual CAG/CVC audit findings relevant to a politician's constituency
- **RTI request helper** — Generate pre-filled RTI request templates
- **Data provenance** — Every data point shows whether it was fetched live, from cache, or from local fallback

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS (CDN), Recharts
- **Backend**: Vercel Serverless Functions (Node.js)
- **Data extraction**: Web scraping (Cheerio) + AI-powered parsing (Claude Haiku)
- **Search**: Fuse.js (client-side fuzzy search over bundled index)
- **Database**: Supabase (PostgreSQL) for caching
- **AI**: Anthropic Claude (HTML extraction), Google Gemini (report generation)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Fill in API keys (see Environment Variables below)

# Start development server
npm run dev
```

The app runs at `http://localhost:3000`. API routes (scraping) only work when deployed to Vercel — locally the app falls back to the bundled politician index for search and cached data for profiles.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | No | Supabase project URL (caching layer) |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | No | Claude API key for AI-powered HTML extraction |
| `GEMINI_API_KEY` | No | Gemini API key for audit report generation |

The app works without any API keys — it degrades gracefully to local data and regex-based extraction.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run seed` | Seed Supabase database from CSV files |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  React Frontend (App.tsx)                       │
│  Search ─→ Politician List ─→ Profile Detail    │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  Services Layer (services/)                     │
│  api.ts (orchestrator)                          │
│  ├─ fuzzySearch.ts (local Fuse.js, instant)     │
│  ├─ supabaseCache.ts (24h profile / 1h search)  │
│  └─ liveFetcher.ts (fetch with timeouts)        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│  API Layer (api/) — Vercel Serverless           │
│  search.ts · profile.ts · reports.ts · prs.ts   │
│  ├─ Scrapes myneta.info & prsindia.org          │
│  ├─ Claude Haiku extraction (fallback: regex)    │
│  └─ Gemini audit report generation              │
└─────────────────────────────────────────────────┘
```

**Three-tier data resolution**: Live scraping → Supabase cache → Local fallback. Every response includes source metadata so the UI shows data provenance.

## Data Sources

- [MyNeta.info](https://myneta.info) — Election affidavits (assets, criminal cases, education)
- [PRS India](https://prsindia.org) — Parliamentary performance data
- CAG/CVC reports — AI-generated summaries for contextual audit findings

## Disclaimer

Project Vigil displays publicly available data from government sources and election affidavits. The information is provided as-is for transparency and civic awareness. AI-generated content (audit summaries) is clearly labeled. This is a proof-of-concept and not a substitute for official records.

## License

MIT
