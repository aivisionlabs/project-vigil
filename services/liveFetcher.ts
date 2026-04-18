/**
 * Live data fetching module.
 * All network calls to Vercel API routes live here.
 * Each function returns raw API data — mapping/merging is done by the caller.
 */
import type { PoliticianSummary, AssociatedReport, ParliamentaryPerformance } from '../types';

// ─── Types for raw API responses ──────────────────────────────────────────────

export interface LiveSearchResult {
  results: PoliticianSummary[];
  meta: { query: string; totalResults: number; fetchedAt: string };
}

export interface LiveProfileResult {
  profile: any; // raw from API — mapped by profileMerger
  meta: { source: string; fetchedAt: string; dataComplete: boolean };
}

export interface LivePrsResult {
  performance: {
    name: string;
    constituency: string;
    state: string;
    party: string;
    term: string;
    attendance: { percentage: number; nationalAverage: number; stateAverage: number } | null;
    questionsAsked: number | null;
    debatesParticipated: number | null;
    billsIntroduced: number | null;
    sourceUrl: string;
  } | null;
  meta: { source: string; fetchedAt?: string; reason?: string };
}

export interface LiveReportsResult {
  reports: AssociatedReport[];
  meta: { source: string; generatedAt?: string; reason?: string };
}

// ─── Configuration ────────────────────────────────────────────────────────────

const DEFAULT_SEARCH_TIMEOUT = 15_000;
const DEFAULT_PROFILE_TIMEOUT = 20_000;
const DEFAULT_REPORTS_TIMEOUT = 20_000;
const DEFAULT_PRS_TIMEOUT = 15_000;

// ─── Search ───────────────────────────────────────────────────────────────────

export async function fetchLiveSearch(
  query: string,
  timeoutMs = DEFAULT_SEARCH_TIMEOUT,
): Promise<LiveSearchResult> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query.trim())}`,
    { signal: AbortSignal.timeout(timeoutMs) },
  );

  if (!response.ok) {
    throw new Error(`Search API returned ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('API not available in dev mode. Local fuzzy search will be used.');
  }

  return response.json();
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchLiveProfile(
  profileUrl: string,
  includeHistory = true,
  timeoutMs = DEFAULT_PROFILE_TIMEOUT,
): Promise<LiveProfileResult> {
  const response = await fetch(
    `/api/profile?url=${encodeURIComponent(profileUrl)}&history=${includeHistory}`,
    { signal: AbortSignal.timeout(timeoutMs) },
  );

  if (!response.ok) {
    throw new Error(`Profile API returned ${response.status}`);
  }

  // Guard against Vite dev server returning HTML instead of JSON
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'API not available. Run "vercel dev" instead of "npm run dev" to enable scraping, or deploy to Vercel.'
    );
  }

  return response.json();
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function fetchLiveReports(
  name: string,
  party?: string,
  constituency?: string,
  timeoutMs = DEFAULT_REPORTS_TIMEOUT,
): Promise<LiveReportsResult> {
  const params = new URLSearchParams({ name });
  if (party) params.set('party', party);
  if (constituency) params.set('constituency', constituency);

  const response = await fetch(
    `/api/reports?${params.toString()}`,
    { signal: AbortSignal.timeout(timeoutMs) },
  );

  if (!response.ok) {
    throw new Error(`Reports API returned ${response.status}`);
  }

  return response.json();
}

// ─── Parliamentary Performance (PRS India) ──────────────────────────────────

export async function fetchLivePrs(
  name: string,
  constituency?: string,
  term = '18th Lok Sabha',
  timeoutMs = DEFAULT_PRS_TIMEOUT,
): Promise<LivePrsResult> {
  const params = new URLSearchParams({ name, term });
  if (constituency) params.set('constituency', constituency);

  const response = await fetch(
    `/api/prs?${params.toString()}`,
    { signal: AbortSignal.timeout(timeoutMs) },
  );

  if (!response.ok) {
    throw new Error(`PRS API returned ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('PRS API not available in dev mode.');
  }

  return response.json();
}
