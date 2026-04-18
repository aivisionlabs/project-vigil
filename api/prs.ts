import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';
import { toPrsSlug, normalizeName, normalizeConstituency, nameSimilarity } from './lib/matchIdentity';

const PRS_BASE = 'https://prsindia.org';
const USER_AGENT = 'Mozilla/5.0 (compatible; ProjectVigil/1.0; +https://projectvigil.in)';

interface PrsPerformance {
  name: string;
  constituency: string;
  state: string;
  party: string;
  term: string;
  attendance: {
    percentage: number;
    nationalAverage: number;
    stateAverage: number;
  } | null;
  questionsAsked: number | null;
  debatesParticipated: number | null;
  billsIntroduced: number | null;
  sourceUrl: string;
}

// ─── Fetch and parse PRS MP profile page ────────────────────────────────────

async function fetchPrsProfile(name: string, term: string): Promise<PrsPerformance | null> {
  const slug = toPrsSlug(name);
  const termSlug = term.toLowerCase().replace(/\s+/g, '-'); // "18th Lok Sabha" → "18th-lok-sabha"
  const profileUrl = `${PRS_BASE}/mptrack/${termSlug}/${slug}`;

  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Verify we're on an actual MP page (not a 404/search page)
    const pageTitle = $('h1, .mp-name, .field-name-title').first().text().trim();
    if (!pageTitle || pageTitle.toLowerCase().includes('page not found')) return null;

    // Verify the name matches (PRS may redirect or show a different person)
    const similarity = nameSimilarity(name, pageTitle);
    if (similarity < 0.4) return null;

    const result: PrsPerformance = {
      name: pageTitle,
      constituency: '',
      state: '',
      party: '',
      term,
      attendance: null,
      questionsAsked: null,
      debatesParticipated: null,
      billsIntroduced: null,
      sourceUrl: profileUrl,
    };

    // Extract constituency
    const constituencyEl = $('.mp_constituency, .field-name-field-constituency').first();
    result.constituency = constituencyEl.text().trim();

    // Extract state
    const stateEl = $('.mp_state, .field-name-field-state').first();
    result.state = stateEl.text().trim();

    // Extract party
    const partyEl = $('.mp_political_party, .field-name-field-political-party').first();
    result.party = partyEl.text().trim();

    // Extract attendance
    const bodyText = $('body').text();

    const attendanceMatch = bodyText.match(/Attendance\s*[:\s]*(\d+(?:\.\d+)?)\s*%/i);
    const nationalAvgMatch = bodyText.match(/National\s*(?:Average|Avg)\s*[:\s]*(\d+(?:\.\d+)?)\s*%/i);
    const stateAvgMatch = bodyText.match(/State\s*(?:Average|Avg)\s*[:\s]*(\d+(?:\.\d+)?)\s*%/i);

    if (attendanceMatch) {
      result.attendance = {
        percentage: parseFloat(attendanceMatch[1]),
        nationalAverage: nationalAvgMatch ? parseFloat(nationalAvgMatch[1]) : 0,
        stateAverage: stateAvgMatch ? parseFloat(stateAvgMatch[1]) : 0,
      };
    }

    // Extract questions asked
    const questionsMatch = bodyText.match(/Questions?\s*(?:Asked)?\s*[:\s]*(\d+)/i);
    if (questionsMatch) {
      result.questionsAsked = parseInt(questionsMatch[1], 10);
    }

    // Extract debates
    const debatesMatch = bodyText.match(/Debates?\s*(?:Participated)?\s*[:\s]*(\d+)/i);
    if (debatesMatch) {
      result.debatesParticipated = parseInt(debatesMatch[1], 10);
    }

    // Extract private member bills
    const billsMatch = bodyText.match(/(?:Private\s*Member)?\s*Bills?\s*(?:Introduced)?\s*[:\s]*(\d+)/i);
    if (billsMatch) {
      result.billsIntroduced = parseInt(billsMatch[1], 10);
    }

    return result;
  } catch (err) {
    console.warn(`PRS fetch failed for ${slug}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Fallback: search PRS MP list for the candidate ─────────────────────────

async function searchPrsList(
  name: string,
  constituency: string,
  term: string,
): Promise<PrsPerformance | null> {
  const termSlug = term.toLowerCase().replace(/\s+/g, '-');
  const searchUrl = `${PRS_BASE}/mptrack/${termSlug}?MpTrackSearch%5Bmp_name%5D=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // PRS lists MPs in card-style layout with links
    const candidates: Array<{ name: string; slug: string; constituency: string }> = [];

    $('a[href*="/mptrack/"]').each((_i, el) => {
      const href = $(el).attr('href') || '';
      const linkText = $(el).text().trim();

      // Match profile links like /mptrack/18th-lok-sabha/some-name
      const profileMatch = href.match(/\/mptrack\/[\w-]+\/([\w-]+)$/);
      if (profileMatch && linkText && linkText.length > 2) {
        // Try to find constituency near this element
        const parent = $(el).closest('.mp-card, .views-row, tr, .col-md-4, .col-lg-3');
        const constText = parent.find('.mp_constituency, .constituency').text().trim();

        candidates.push({
          name: linkText,
          slug: profileMatch[1],
          constituency: constText,
        });
      }
    });

    // Find best match using constituency as primary key, name as secondary
    let bestMatch: (typeof candidates)[0] | null = null;
    let bestScore = 0;

    for (const c of candidates) {
      const nameScore = nameSimilarity(name, c.name);
      const constMatch = constituency && c.constituency
        ? normalizeConstituency(constituency) === normalizeConstituency(c.constituency)
        : false;

      const score = nameScore + (constMatch ? 0.5 : 0);
      if (score > bestScore && nameScore >= 0.4) {
        bestScore = score;
        bestMatch = c;
      }
    }

    if (!bestMatch) return null;

    // Fetch the matched profile
    return fetchPrsProfile(bestMatch.name, term);
  } catch (err) {
    console.warn('PRS search failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const name = (req.query.name as string || '').trim();
  const constituency = (req.query.constituency as string || '').trim();
  const term = (req.query.term as string || '18th Lok Sabha').trim();

  if (!name) {
    return res.status(400).json({ error: 'Politician name is required.', performance: null });
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');

  try {
    // Try direct slug-based fetch first (fast path)
    let result = await fetchPrsProfile(name, term);

    // Fallback: search the PRS MP list
    if (!result && constituency) {
      result = await searchPrsList(name, constituency, term);
    }

    // Try alternate name orderings if still no match
    if (!result) {
      const tokens = normalizeName(name).split(' ');
      if (tokens.length >= 2) {
        // Try "Last First" → "First Last"
        const reversed = [...tokens].reverse().join(' ');
        result = await fetchPrsProfile(reversed, term);
      }
    }

    if (!result) {
      return res.status(200).json({
        performance: null,
        meta: {
          source: 'prsindia.org',
          reason: 'No matching MP found on PRS India. This may be a state-level legislator (PRS tracks Lok Sabha MPs).',
          searchedName: name,
          searchedTerm: term,
        },
      });
    }

    return res.status(200).json({
      performance: result,
      meta: {
        source: 'prsindia.org',
        fetchedAt: new Date().toISOString(),
        matchedName: result.name,
        sourceUrl: result.sourceUrl,
      },
    });
  } catch (err) {
    console.error('PRS handler error:', err);
    return res.status(500).json({
      error: 'Failed to fetch parliamentary performance data.',
      performance: null,
    });
  }
}
