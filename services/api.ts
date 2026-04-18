/**
 * API orchestrator.
 * Search uses local fuse.js fuzzy search over the scraped politician index.
 * Profile fetching uses live API with Supabase caching.
 */
import type { PoliticianSummary, PoliticianProfileData, AssociatedReport, DataMeta } from '../types';
import { fetchLiveSearch, fetchLiveProfile, fetchLiveReports } from './liveFetcher';
import { mapApiProfile } from './profileMerger';
import { getCachedRemoteProfile, cacheRemoteProfile, getCachedSearchResults, cacheSearchResults } from './supabaseCache';
import { fuzzySearchPoliticians, getDefaultPoliticians, POLITICIAN_INDEX_COUNT } from './fuzzySearch';

// ─── Response types ───────────────────────────────────────────────────────────

export interface SearchResponse {
  results: PoliticianSummary[];
  meta: DataMeta;
  suggestions?: PoliticianSummary[];
  indexCount?: number;
}

export interface ProfileResponse {
  profile: PoliticianProfileData | null;
  meta: DataMeta;
  warnings: string[];
}

export interface ReportsResponse {
  reports: AssociatedReport[];
  meta: DataMeta;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchPoliticians(
  query: string,
  onLiveUpdate?: (response: SearchResponse) => void,
): Promise<SearchResponse> {
  const indexCount = POLITICIAN_INDEX_COUNT;

  // Short/empty queries → show default set from local index
  if (!query || query.trim().length < 2) {
    const defaults = getDefaultPoliticians(20);
    return {
      results: defaults,
      meta: { source: 'cache', reason: 'Showing notable politicians. Type 2+ characters to search.' },
      indexCount,
    };
  }

  // Run local fuzzy search and Supabase cache check in parallel
  const [fuzzySuggestions, remoteCached] = await Promise.all([
    Promise.resolve(fuzzySearchPoliticians(query, 15)),
    getCachedSearchResults(query),
  ]);

  if (remoteCached && remoteCached.length > 0) {
    return {
      results: remoteCached,
      meta: { source: 'cache', reason: 'Showing recently cached results.' },
      suggestions: fuzzySuggestions,
      indexCount,
    };
  }

  // Return fuzzy results immediately, fetch live results in background
  if (onLiveUpdate) {
    fetchLiveSearch(query)
      .then((data) => {
        if (data.results && data.results.length > 0) {
          cacheSearchResults(query, data.results);
          onLiveUpdate({
            results: data.results,
            meta: { source: 'live', fetchedAt: data.meta?.fetchedAt },
            suggestions: fuzzySuggestions,
            indexCount,
          });
        }
      })
      .catch((err) => {
        console.warn('Live search failed, keeping local results:', err);
      });

    // Return fuzzy results instantly
    if (fuzzySuggestions.length > 0) {
      return {
        results: fuzzySuggestions,
        meta: { source: 'fallback', reason: 'Showing local results. Live data loading...' },
        indexCount,
      };
    }
  }

  // No onLiveUpdate callback — blocking mode (used for slug lookups)
  try {
    const data = await fetchLiveSearch(query);

    if (data.results && data.results.length > 0) {
      cacheSearchResults(query, data.results);
      return {
        results: data.results,
        meta: { source: 'live', fetchedAt: data.meta?.fetchedAt },
        suggestions: fuzzySuggestions,
        indexCount,
      };
    }

    if (fuzzySuggestions.length > 0) {
      return {
        results: fuzzySuggestions,
        meta: { source: 'fallback', reason: 'No live results found. Showing local index results.' },
        indexCount,
      };
    }

    return { results: [], meta: { source: 'live', fetchedAt: data.meta?.fetchedAt }, indexCount };
  } catch (err) {
    console.warn('Live search failed, using local fuzzy search:', err);

    if (fuzzySuggestions.length > 0) {
      return {
        results: fuzzySuggestions,
        meta: { source: 'fallback', reason: 'Live search unavailable. Showing local index results.' },
        indexCount,
      };
    }

    return {
      results: [],
      meta: { source: 'fallback', reason: 'Live search unavailable.' },
      indexCount,
    };
  }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getPoliticianProfile(profileUrl: string): Promise<ProfileResponse> {
  const warnings: string[] = [];

  // Check Supabase remote cache
  const remoteProfile = await getCachedRemoteProfile(profileUrl);
  if (remoteProfile) {
    return {
      profile: remoteProfile,
      meta: { source: 'cache', reason: 'Loaded from database.' },
      warnings: [],
    };
  }

  // Try live API
  try {
    const data = await fetchLiveProfile(profileUrl);

    if (data.profile) {
      const profile = mapApiProfile(data.profile, profileUrl);

      if (profile.assetDeclarations.length === 0) {
        warnings.push('Asset declaration data could not be retrieved from the government source.');
      }

      // Cache to Supabase in background
      cacheRemoteProfile(profileUrl, profile);

      return {
        profile,
        meta: { source: 'live', fetchedAt: data.meta?.fetchedAt },
        warnings,
      };
    }

    throw new Error('No profile in response');
  } catch (err) {
    console.warn('Live profile fetch failed:', err);

    return {
      profile: null,
      meta: { source: 'fallback', reason: 'Profile not available from any source.' },
      warnings: ['Could not load profile from any source.'],
    };
  }
}

// ─── Associated Reports (CAG/CVC) ──────────────────────────────────────────

export async function getAssociatedReports(
  name: string,
  party?: string,
  constituency?: string,
): Promise<ReportsResponse> {
  try {
    const data = await fetchLiveReports(name, party, constituency);
    return {
      reports: data.reports ?? [],
      meta: { source: 'live', fetchedAt: data.meta?.generatedAt },
    };
  } catch (err) {
    console.warn('Reports fetch failed:', err);
    return {
      reports: [],
      meta: { source: 'fallback', reason: 'Could not generate report findings.' },
    };
  }
}
