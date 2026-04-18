/**
 * Cross-source identity matching for Indian politicians.
 *
 * Politicians appear on different websites with different name formats,
 * constituency spellings, and party abbreviations. This module normalizes
 * these fields so we can reliably match the same person across sources.
 *
 * Primary join key: constituency (standardized by ECI delimitation).
 * Secondary: fuzzy name match.  Tertiary: party as confidence booster.
 */

// ─── Honorifics & noise tokens to strip ────────────────────────────────────

const HONORIFICS = [
  'shri', 'smt', 'dr', 'adv', 'prof', 'justice',
  'mr', 'mrs', 'ms', 'sri', 'kumari', 'advocate',
];

const PARTY_ALIASES: Record<string, string[]> = {
  'bjp': ['bharatiya janata party', 'b.j.p.', 'bjp'],
  'inc': ['indian national congress', 'i.n.c.', 'inc', 'congress'],
  'aap': ['aam aadmi party', 'a.a.p.', 'aap'],
  'tmc': ['all india trinamool congress', 'trinamool congress', 'aitc', 'tmc'],
  'dmk': ['dravida munnetra kazhagam', 'dmk'],
  'sp': ['samajwadi party', 'sp'],
  'bsp': ['bahujan samaj party', 'bsp'],
  'ncp': ['nationalist congress party', 'ncp'],
  'ss': ['shiv sena', 'shivsena', 'ss', 'shs'],
  'jdu': ['janata dal (united)', 'janata dal united', 'jd(u)', 'jdu'],
  'rjd': ['rashtriya janata dal', 'rjd'],
  'brs': ['bharat rashtra samithi', 'brs', 'trs', 'telangana rashtra samithi'],
  'ysrcp': ['ysr congress party', 'ysrcp', 'ycp'],
  'tdp': ['telugu desam party', 'tdp'],
  'cpim': ['communist party of india (marxist)', 'cpi(m)', 'cpim', 'cpm'],
  'cpi': ['communist party of india', 'cpi'],
  'jmm': ['jharkhand mukti morcha', 'jmm'],
  'ljp': ['lok janshakti party', 'ljp'],
  'sad': ['shiromani akali dal', 'sad'],
  'ind': ['independent', 'ind'],
};

// ─── Constituency suffixes to strip ────────────────────────────────────────

const CONSTITUENCY_SUFFIXES = /\s*\((sc|st|gen|general)\)\s*$/i;

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Normalize a politician's name for comparison.
 * Strips honorifics, lowercases, collapses whitespace, removes punctuation.
 */
export function normalizeName(name: string): string {
  let n = name.toLowerCase().trim();
  // Remove periods and commas
  n = n.replace(/[.,]/g, '');
  // Strip parenthetical suffixes like (winner), (SC), (ST)
  n = n.replace(/\s*\([^)]*\)\s*/g, ' ');
  // Strip honorifics at the start
  for (const h of HONORIFICS) {
    if (n.startsWith(h + ' ')) {
      n = n.slice(h.length).trim();
    }
  }
  // Collapse whitespace
  n = n.replace(/\s+/g, ' ').trim();
  return n;
}

/**
 * Normalize a constituency name for cross-source matching.
 */
export function normalizeConstituency(name: string): string {
  let c = name.toLowerCase().trim();
  // Strip category suffixes like (SC), (ST)
  c = c.replace(CONSTITUENCY_SUFFIXES, '');
  // Remove hyphens and extra spaces
  c = c.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  return c;
}

/**
 * Normalize a party name to a canonical abbreviation.
 */
export function normalizeParty(party: string): string {
  const lower = party.toLowerCase().trim().replace(/[.()]/g, '');
  for (const [canonical, aliases] of Object.entries(PARTY_ALIASES)) {
    for (const alias of aliases) {
      if (lower === alias.replace(/[.()]/g, '') || lower.includes(alias.replace(/[.()]/g, ''))) {
        return canonical;
      }
    }
  }
  return lower;
}

/**
 * Generate a PRS India URL slug from a politician's name.
 * PRS uses kebab-case slugs like "abhishek-banerjee".
 */
export function toPrsSlug(name: string): string {
  return normalizeName(name)
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Compute token-based name similarity (Jaccard index on name tokens).
 * Handles name reordering (e.g., "Ram Kumar" vs "Kumar Ram").
 * Returns 0..1 where 1 = perfect match.
 */
export function nameSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeName(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeName(b).split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Check if two politicians are likely the same person.
 * Uses constituency as primary anchor, name similarity as secondary.
 */
export function isLikelyMatch(
  a: { name: string; constituency: string; party?: string },
  b: { name: string; constituency: string; party?: string },
): { match: boolean; confidence: number } {
  const constMatch = normalizeConstituency(a.constituency) === normalizeConstituency(b.constituency);
  const similarity = nameSimilarity(a.name, b.name);
  const partyMatch = a.party && b.party
    ? normalizeParty(a.party) === normalizeParty(b.party)
    : false;

  // Strong match: same constituency + high name similarity
  if (constMatch && similarity >= 0.5) {
    return { match: true, confidence: 0.7 + similarity * 0.2 + (partyMatch ? 0.1 : 0) };
  }

  // Name-only match needs very high similarity
  if (similarity >= 0.8 && partyMatch) {
    return { match: true, confidence: 0.5 + similarity * 0.3 + 0.1 };
  }

  return { match: false, confidence: similarity * 0.3 };
}
