import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

const MYNETA_BASE = 'https://www.myneta.info';

const ELECTION_PATHS = [
  'LokSabha2024',
  'LokSabha2019',
  'Bihar2025',
  'Bihar2020',
  'Delhi2025',
  'Delhi2020',
  'UP2022',
  'Gujarat2022',
  'Maharashtra2024',
  'Karnataka2023',
  'Rajasthan2023',
  'MP2023',
  'Telangana2023',
];

interface SearchResult {
  name: string;
  party: string;
  constituency: string;
  profileUrl: string;
  election: string;
  criminalCases: number;
  totalAssets: string;
  education: string;
}

// ─── Regex fallback extraction (original logic) ─────────────────────────────

function regexExtractResults(html: string, electionPath: string, query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const $ = cheerio.load(html);

  $('table tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 5) return;

    const nameLink = $(cells[1]).find('a');
    const name = nameLink.text().trim();
    if (!name) return;

    const href = nameLink.attr('href') || '';
    const candidateIdMatch = href.match(/candidate_id=(\d+)/);
    if (!candidateIdMatch) return;

    const profileUrl = `${MYNETA_BASE}/${electionPath}/candidate.php?candidate_id=${candidateIdMatch[1]}`;
    const party = $(cells[2]).text().trim();
    const constituency = $(cells[3]).text().trim() || $('h1, h2').first().text().trim();
    const criminalCasesText = $(cells[4]).text().trim();
    const criminalCases = parseInt(criminalCasesText, 10) || 0;
    const education = $(cells[5]).text().trim() || 'Not available';
    const totalAssets = $(cells[7]).text().trim() || 'Not available';

    if (name.toLowerCase().includes(query.toLowerCase())) {
      results.push({ name, party, constituency, profileUrl, election: electionPath, criminalCases, totalAssets, education });
    }
  });

  return results;
}

// ─── Search a single election ────────────────────────────────────────────────

async function searchElection(electionPath: string, query: string): Promise<SearchResult[]> {
  const searchUrl = `${MYNETA_BASE}/${electionPath}/index.php?action=search&searchquery=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProjectVigil/1.0; +https://projectvigil.in)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const html = await response.text();

    // Use fast regex/cheerio extraction (AI extraction skipped for search speed)
    return regexExtractResults(html, electionPath, query);
  } catch (err) {
    console.warn(`Search failed for ${electionPath}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = (req.query.q as string || '').trim();

  if (!query || query.length < 2) {
    return res.status(400).json({
      error: 'Search query must be at least 2 characters.',
      results: [],
    });
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const searchPromises = ELECTION_PATHS.map(path => searchElection(path, query));
    const allResults = await Promise.allSettled(searchPromises);

    const results: SearchResult[] = [];
    const electionsSearched: string[] = [];

    allResults.forEach((result, index) => {
      electionsSearched.push(ELECTION_PATHS[index]);
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });

    // Deduplicate by name + party (keep most recent election entry)
    const seen = new Map<string, SearchResult>();
    for (const r of results) {
      const key = `${r.name.toLowerCase()}|${r.party.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.set(key, r);
      }
    }

    const dedupedResults = Array.from(seen.values());

    return res.status(200).json({
      results: dedupedResults,
      meta: {
        query,
        totalResults: dedupedResults.length,
        electionsSearched,
        source: 'myneta.info',
        fetchedAt: new Date().toISOString(),
        extractionMethod: process.env.ANTHROPIC_API_KEY ? 'ai' : 'regex',
      },
    });
  } catch (err) {
    console.error('Search handler error:', err);
    return res.status(500).json({
      error: 'Search failed. Please try again.',
      results: [],
    });
  }
}
