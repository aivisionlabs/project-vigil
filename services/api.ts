/**
 * API orchestrator.
 * Coordinates between live fetchers, fallback data, and profile merger.
 * This is the public API consumed by React components.
 */
import type { PoliticianSummary, PoliticianProfileData, AssociatedReport, DataMeta } from '../types';
import { FALLBACK_POLITICIANS, getCachedProfile, filterCachedPoliticians, hasCachedProfile } from './fallbackData';
import { fetchLiveSearch, fetchLiveProfile, fetchLiveReports } from './liveFetcher';
import { mapApiProfile, mergeProfiles } from './profileMerger';
import { getCachedRemoteProfile, cacheRemoteProfile, getCachedSearchResults, cacheSearchResults } from './supabaseCache';

// ─── Response types ───────────────────────────────────────────────────────────

export interface SearchResponse {
  results: PoliticianSummary[];
  meta: DataMeta;
}

export interface ProfileResponse {
  profile: PoliticianProfileData | null;
  meta: DataMeta;
  /** Sections that partially failed (shown as subtle warnings). */
  warnings: string[];
}

export interface ReportsResponse {
  reports: AssociatedReport[];
  meta: DataMeta;
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchPoliticians(query: string): Promise<SearchResponse> {
  // Short/empty queries → return full cached list immediately (no API call)
  if (!query || query.trim().length < 2) {
    return {
      results: FALLBACK_POLITICIANS,
      meta: { source: 'cache', reason: 'Showing cached politicians. Type 2+ characters for real-time search.' },
    };
  }

  // Check Supabase remote cache first
  const remoteCached = await getCachedSearchResults(query);
  if (remoteCached && remoteCached.length > 0) {
    return {
      results: remoteCached,
      meta: { source: 'cache', reason: 'Showing recently cached results.' },
    };
  }

  try {
    const data = await fetchLiveSearch(query);

    if (data.results && data.results.length > 0) {
      // Cache results to Supabase in background
      cacheSearchResults(query, data.results);
      return {
        results: data.results,
        meta: { source: 'live', fetchedAt: data.meta?.fetchedAt },
      };
    }

    // API returned 0 results — try local match as supplement
    const localFiltered = filterCachedPoliticians(query);
    if (localFiltered.length > 0) {
      return {
        results: localFiltered,
        meta: { source: 'fallback', reason: 'No live results found. Showing cached matches.' },
      };
    }

    return { results: [], meta: { source: 'live', fetchedAt: data.meta?.fetchedAt } };
  } catch (err) {
    console.warn('Live search failed, falling back to local data:', err);
    return {
      results: query ? filterCachedPoliticians(query) : FALLBACK_POLITICIANS,
      meta: { source: 'fallback', reason: 'Live search unavailable. Showing cached results.' },
    };
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getPoliticianProfile(
  profileUrl: string,
  /** If true, skip live API and serve from cache only. */
  cacheOnly = false,
): Promise<ProfileResponse> {
  const warnings: string[] = [];

  // ── Cache-only mode (homepage cached profiles) ──────────────────────────
  if (cacheOnly) {
    const cached = getCachedProfile(profileUrl);
    if (cached) {
      return { profile: cached, meta: { source: 'cache' }, warnings: [] };
    }
    // Not in cache despite cacheOnly — fall through to live
  }

  // ── If cached locally, serve immediately (but still try enrichment) ─────
  const localProfile = getCachedProfile(profileUrl);

  // ── Check Supabase remote cache ────────────────────────────────────────
  const remoteProfile = await getCachedRemoteProfile(profileUrl);
  if (remoteProfile) {
    return {
      profile: remoteProfile,
      meta: { source: 'cache', reason: 'Loaded from remote cache.' },
      warnings: [],
    };
  }

  // ── Try live API ────────────────────────────────────────────────────────
  try {
    const data = await fetchLiveProfile(profileUrl);

    if (data.profile) {
      const liveProfile = mapApiProfile(data.profile, profileUrl);

      // Merge with local if available
      const merged = localProfile ? mergeProfiles(liveProfile, localProfile) : liveProfile;

      // Check for sections with missing data and add warnings
      if (merged.assetDeclarations.length === 0) {
        warnings.push('Asset declaration data could not be retrieved from the government source.');
      }
      if (merged.criminalCases.length === 0 && localProfile && localProfile.criminalCases.length > 0) {
        // Live missed criminal cases that local has — use local
        merged.criminalCases = localProfile.criminalCases;
        warnings.push('Criminal case data was loaded from cache — live source did not respond.');
      }

      // Cache to Supabase in background
      cacheRemoteProfile(profileUrl, merged);

      return {
        profile: merged,
        meta: { source: 'live', fetchedAt: data.meta?.fetchedAt },
        warnings,
      };
    }

    throw new Error('No profile in response');
  } catch (err) {
    console.warn('Live profile fetch failed:', err);

    // Fallback to local
    if (localProfile) {
      warnings.push('Government data source is currently unavailable. Showing cached profile.');
      return {
        profile: localProfile,
        meta: { source: 'fallback', reason: 'Live data unavailable. Showing cached profile.' },
        warnings,
      };
    }

    // No data at all
    return {
      profile: null,
      meta: { source: 'fallback', reason: 'Profile not available from any source.' },
      warnings: ['Could not load profile from any source.'],
    };
  }
}

// ─── Associated Reports ───────────────────────────────────────────────────────

export async function getAssociatedReports(
  name: string,
  party?: string,
  constituency?: string,
): Promise<ReportsResponse> {
  try {
    const data = await fetchLiveReports(name, party, constituency);
    return {
      reports: data.reports || [],
      meta: {
        source: data.meta?.source === 'gemini-ai' ? 'live' : 'fallback',
        fetchedAt: data.meta?.generatedAt,
        reason: data.meta?.reason,
      },
    };
  } catch (err) {
    console.warn('Reports fetch failed:', err);
    return {
      reports: [{
        department_name: 'Government Audit Observations',
        finding_summary: `AI-generated audit summary is temporarily unavailable. Please refer to the official CAG reports portal for findings related to ${name}.`,
        loss_amount_rs_crore: 'N/A',
        source_report_page: 'Visit cag.gov.in',
        sourceUrl: 'https://cag.gov.in/en/reports-list',
      }],
      meta: { source: 'fallback', reason: 'Reports service unavailable.' },
    };
  }
}

// ─── Re-exports for convenience ───────────────────────────────────────────────

export { hasCachedProfile } from './fallbackData';
