/**
 * Local fuzzy search over the full politician index (4000+ entries).
 * Uses fuse.js — runs entirely in the browser, no Supabase needed.
 */
import Fuse from 'fuse.js';
import politicianIndex from '../data/politician_index.json';
import type { PoliticianSummary } from '../types';

export interface IndexedPolitician {
  name: string;
  constituency: string;
  party: string;
  state: string;
  electionType: string;
  election: string;
  profileUrl: string;
  criminalCases: number | null;
  totalAssets: string;
  education: string;
}

const allPoliticians = politicianIndex as IndexedPolitician[];

// Build Fuse index once at module load
const fuse = new Fuse<IndexedPolitician>(allPoliticians, {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'constituency', weight: 0.25 },
    { name: 'party', weight: 0.15 },
    { name: 'state', weight: 0.1 },
  ],
  threshold: 0.4,
  distance: 200,
  includeScore: true,
  minMatchCharLength: 2,
});

/**
 * Fuzzy-search the full politician index.
 * Returns top matches as PoliticianSummary objects.
 */
export function fuzzySearchPoliticians(
  query: string,
  limit = 15,
): PoliticianSummary[] {
  if (!query || query.trim().length < 2) return [];

  const results = fuse.search(query.trim(), { limit });

  return results.map((r) => ({
    profileUrl: r.item.profileUrl,
    name: r.item.name,
    party: r.item.party,
    constituency: r.item.constituency,
    election: r.item.election,
    criminalCases: r.item.criminalCases ?? undefined,
    totalAssets: r.item.totalAssets || undefined,
    education: r.item.education || undefined,
  }));
}

// ─── Featured politicians (top BJP Lok Sabha 2024 leaders) ──────────────────

const FEATURED_PROFILE_URLS = [
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=8974',  // Narendra Modi
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=4427',  // Amit Shah
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=329',   // Nitin Gadkari
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=7169',  // Raj Nath Singh
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=8760',  // Anurag Singh Thakur
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=7093',  // Piyush Goyal
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=4448',  // Shivraj Singh Chouhan
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=9505',  // Ravi Shankar Prasad
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=8053',  // Dharmendra Pradhan
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=5058',  // Giriraj Singh
  'https://www.myneta.info/LokSabha2024/candidate.php?candidate_id=2629',  // Tejasvi Surya
];

const featuredSet = new Set(FEATURED_PROFILE_URLS);

function toSummary(p: IndexedPolitician): PoliticianSummary {
  return {
    profileUrl: p.profileUrl,
    name: p.name,
    party: p.party,
    constituency: p.constituency,
    election: p.election,
    criminalCases: p.criminalCases ?? undefined,
    totalAssets: p.totalAssets || undefined,
    education: p.education || undefined,
  };
}

/**
 * Get default homepage politicians.
 * Featured BJP leaders first, then others sorted by criminal cases.
 */
export function getDefaultPoliticians(limit = 20): PoliticianSummary[] {
  // Build featured list in order
  const featured: PoliticianSummary[] = [];
  for (const url of FEATURED_PROFILE_URLS) {
    const p = allPoliticians.find((x) => x.profileUrl === url);
    if (p) featured.push(toSummary(p));
  }

  // Fill remaining slots with other notable politicians (by criminal cases)
  const remaining = limit - featured.length;
  if (remaining > 0) {
    const others = allPoliticians
      .filter((p) => !featuredSet.has(p.profileUrl) && p.criminalCases !== null && p.criminalCases > 0)
      .sort((a, b) => (b.criminalCases ?? 0) - (a.criminalCases ?? 0))
      .slice(0, remaining)
      .map(toSummary);
    return [...featured, ...others];
  }

  return featured;
}

/** Total count of indexed politicians */
export const POLITICIAN_INDEX_COUNT = allPoliticians.length;
