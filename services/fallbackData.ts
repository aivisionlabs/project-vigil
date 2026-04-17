/**
 * Fallback / cached data module.
 * All locally stored politician data lives here.
 * This module is the single source of truth for offline & test data.
 */
import type { PoliticianSummary, PoliticianProfileData } from '../types';
import { amitShahData } from '../data/amit_shah_data';
import { biharBjp2020 } from '../data/bihar_bjp_2020';
import { manojManzilData } from '../data/manoj_manzil_data';
import { tejashwiYadavData } from '../data/tejashwi_yadav_data';
import { jagannathMishraData } from '../data/jagannath_mishra_data';
import { dilipJaiswalData } from '../data/dilip_jaiswal_data';
import { samratChoudharyData } from '../data/samrat_choudhary_data';

// ─── Full profile records (keyed by profileUrl) ───────────────────────────────

export const FALLBACK_PROFILES: Record<string, PoliticianProfileData> = {
  [amitShahData.profileUrl]: amitShahData,
  [tejashwiYadavData.profileUrl]: tejashwiYadavData,
  [manojManzilData.profileUrl]: manojManzilData,
  [jagannathMishraData.profileUrl]: jagannathMishraData,
  [dilipJaiswalData.profileUrl]: dilipJaiswalData,
  [samratChoudharyData.profileUrl]: samratChoudharyData,
};

// ─── Summary list (homepage listing) ──────────────────────────────────────────

export const FALLBACK_POLITICIANS: PoliticianSummary[] = [
  amitShahData, tejashwiYadavData, manojManzilData,
  jagannathMishraData, dilipJaiswalData, samratChoudharyData,
  ...biharBjp2020,
].map(p => ({
  profileUrl: p.profileUrl,
  name: p.name,
  party: p.party,
  constituency: p.constituency,
}));

// ─── Set of profileUrls that have local full-profile data ─────────────────────

export const CACHED_PROFILE_URLS = new Set(Object.keys(FALLBACK_PROFILES));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check whether a profileUrl has cached local data */
export function hasCachedProfile(profileUrl: string): boolean {
  return CACHED_PROFILE_URLS.has(profileUrl);
}

/** Get a cached profile by URL. Returns null if not found. */
export function getCachedProfile(profileUrl: string): PoliticianProfileData | null {
  return FALLBACK_PROFILES[profileUrl] ?? null;
}

/** Filter cached politicians by name or constituency (case-insensitive). */
export function filterCachedPoliticians(query: string): PoliticianSummary[] {
  if (!query) return FALLBACK_POLITICIANS;
  const q = query.toLowerCase().trim();
  return FALLBACK_POLITICIANS.filter(
    p => p.name.toLowerCase().includes(q) || p.constituency.toLowerCase().includes(q),
  );
}
