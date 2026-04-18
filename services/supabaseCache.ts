/**
 * Supabase caching layer.
 * Stores fetched politician profiles in a remote DB so subsequent
 * visitors get instant results without re-scraping.
 *
 * Tables expected (see supabase-schema.sql):
 *   - politician_profiles
 *   - search_cache
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { PoliticianProfileData, PoliticianSummary } from '../types';

const PROFILE_TTL_HOURS = 24;
const SEARCH_TTL_HOURS = 1;

// ─── Profile cache ───────────────────────────────────────────────────────────

export async function getCachedRemoteProfile(
  profileUrl: string,
): Promise<PoliticianProfileData | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('politician_profiles')
      .select('profile_data, cached_at')
      .eq('profile_url', profileUrl)
      .maybeSingle();

    if (error || !data) return null;

    // Check TTL
    const cachedAt = new Date(data.cached_at).getTime();
    const ageHours = (Date.now() - cachedAt) / (1000 * 60 * 60);
    if (ageHours > PROFILE_TTL_HOURS) return null;

    return data.profile_data as PoliticianProfileData;
  } catch {
    return null;
  }
}

export async function cacheRemoteProfile(
  profileUrl: string,
  profile: PoliticianProfileData,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    await supabase
      .from('politician_profiles')
      .upsert(
        {
          profile_url: profileUrl,
          name: profile.name,
          party: profile.party,
          constituency: profile.constituency,
          profile_data: profile,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'profile_url' },
      );
  } catch (err) {
    console.warn('Failed to cache profile to Supabase:', err);
  }
}

// ─── Search cache ────────────────────────────────────────────────────────────

export async function getCachedSearchResults(
  query: string,
): Promise<PoliticianSummary[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const normalizedQuery = query.trim().toLowerCase();
    const { data, error } = await supabase
      .from('search_cache')
      .select('results, cached_at')
      .eq('query', normalizedQuery)
      .maybeSingle();

    if (error || !data) return null;

    const cachedAt = new Date(data.cached_at).getTime();
    const ageHours = (Date.now() - cachedAt) / (1000 * 60 * 60);
    if (ageHours > SEARCH_TTL_HOURS) return null;

    return data.results as PoliticianSummary[];
  } catch {
    return null;
  }
}

export async function cacheSearchResults(
  query: string,
  results: PoliticianSummary[],
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const normalizedQuery = query.trim().toLowerCase();
    await supabase
      .from('search_cache')
      .upsert(
        {
          query: normalizedQuery,
          results,
          result_count: results.length,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'query' },
      );
  } catch (err) {
    console.warn('Failed to cache search results to Supabase:', err);
  }
}
