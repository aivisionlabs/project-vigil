/**
 * PRS India scraping logic — shared between api/prs.ts (standalone endpoint)
 * and api/profile.ts (bundled into profile scrape).
 */
import * as cheerio from 'cheerio';
import { toPrsSlug, normalizeName, normalizeConstituency, nameSimilarity } from './matchIdentity.js';

const PRS_BASE = 'https://prsindia.org';
const USER_AGENT = 'Mozilla/5.0 (compatible; ProjectVigil/1.0; +https://projectvigil.in)';

export interface PrsQuestion {
  date: string;
  title: string;
  type: string;
  ministry: string;
  documentUrl?: string;
}

export interface PrsPerformance {
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
  questions: PrsQuestion[];
  sourceUrl: string;
}

// ─── Fetch and parse PRS MP profile page ────────────────────────────────────

async function fetchPrsProfile(name: string, term: string): Promise<PrsPerformance | null> {
  const slug = toPrsSlug(name);
  const termSlug = term.toLowerCase().replace(/\s+/g, '-');
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

    const pageTitle = $('h1, .mp-name, .field-name-title').first().text().trim();
    if (!pageTitle || pageTitle.toLowerCase().includes('page not found')) return null;

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
      questions: [],
      sourceUrl: profileUrl,
    };

    // Extract constituency — PRS wraps it in .mp_constituency
    const constituencyEl = $('.mp_constituency').first();
    result.constituency = constituencyEl.text().replace(/Constituency\s*:\s*/i, '').trim();

    // Extract state — PRS puts it in the first .mp_state
    const stateEl = $('.mp_state').first();
    const stateLink = stateEl.find('a').first();
    result.state = stateLink.length
      ? stateLink.text().replace(/\s*\(.*\)/, '').trim()
      : stateEl.text().replace(/State\s*:\s*/i, '').trim();

    // Extract party — PRS puts party in the second .mp_state or a separate element
    // The party link is usually the second .mp_state block
    const allMpState = $('.mp_state');
    if (allMpState.length >= 2) {
      const partyLink = $(allMpState[1]).find('a').first();
      result.party = partyLink.length
        ? partyLink.text().replace(/\s*\(.*\)/, '').trim()
        : '';
    }

    // Helper to extract numeric value from PRS field (handles "N/A", "28 %", etc.)
    function extractFieldValue(selector: string): number | null {
      const el = $(selector).find('.field-item').first();
      if (!el.length) return null;
      const text = el.text().trim();
      if (!text || text === 'N/A' || text === 'NA' || text === '-') return null;
      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
      return isNaN(num) ? null : num;
    }

    // Extract attendance using CSS selectors
    const attendance = extractFieldValue('.field-name-field-attendance');
    const nationalAvg = extractFieldValue('.field-name-field-national-attendance');
    const stateAvg = extractFieldValue('.field-name-field-state-attendance');

    if (attendance !== null) {
      result.attendance = {
        percentage: attendance,
        nationalAverage: nationalAvg ?? 0,
        stateAverage: stateAvg ?? 0,
      };
    }

    // Extract questions — from .mp-questions section
    const questions = extractFieldValue('.field-name-field-questions');
    if (questions !== null) result.questionsAsked = questions;

    // Extract debates
    const debates = extractFieldValue('.field-name-field-debate');
    if (debates !== null) result.debatesParticipated = debates;

    // Extract private member bills
    const bills = extractFieldValue('.field-name-field-pmb');
    if (bills !== null) result.billsIntroduced = bills;

    // Fallback: try regex on body text if CSS selectors didn't work
    if (result.attendance === null && result.questionsAsked === null) {
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

      const questionsMatch = bodyText.match(/Questions?\s*(?:Asked)?\s*[:\s]*(\d+)/i);
      if (questionsMatch) result.questionsAsked = parseInt(questionsMatch[1], 10);

      const debatesMatch = bodyText.match(/Debates?\s*(?:Participated)?\s*[:\s]*(\d+)/i);
      if (debatesMatch) result.debatesParticipated = parseInt(debatesMatch[1], 10);

      const billsMatch = bodyText.match(/(?:Private\s*Member)?\s*Bills?\s*(?:Introduced)?\s*[:\s]*(\d+)/i);
      if (billsMatch) result.billsIntroduced = parseInt(billsMatch[1], 10);
    }

    // ─── Extract individual questions from the questions table ──────────
    $('table.views-table tbody tr').each((_i, row) => {
      if (result.questions.length >= 50) return false; // cap at 50

      const cells = $(row).find('td');
      if (cells.length < 4) return;

      const date = $(cells[0]).text().trim();
      const titleEl = $(cells[1]).find('a').first();
      const title = titleEl.text().trim() || $(cells[1]).text().trim();
      const documentUrl = titleEl.attr('href') || undefined;
      const type = $(cells[2]).text().trim();
      const ministry = $(cells[3]).text().trim();

      if (title && date) {
        result.questions.push({ date, title, type, ministry, documentUrl });
      }
    });

    // Check if this MP is a minister (PRS shows a note about ministers not signing attendance)
    const bodyText = $('body').text();
    const isMinister = bodyText.includes('This MP is a minister');
    if (isMinister && result.attendance === null) {
      // Ministers don't sign attendance register — note this in the result
      // Still return the result so the UI can show "Minister — attendance N/A"
      result.attendance = { percentage: -1, nationalAverage: 0, stateAverage: 0 };
    }

    return result;
  } catch (err) {
    console.warn(`PRS fetch failed for ${slug}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Fallback: search PRS MP list ───────────────────────────────────────────

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

    const candidates: Array<{ name: string; slug: string; constituency: string }> = [];

    $('a[href*="/mptrack/"]').each((_i, el) => {
      const href = $(el).attr('href') || '';
      const linkText = $(el).text().trim();

      const profileMatch = href.match(/\/mptrack\/[\w-]+\/([\w-]+)$/);
      if (profileMatch && linkText && linkText.length > 2) {
        const parent = $(el).closest('.mp-card, .views-row, tr, .col-md-4, .col-lg-3');
        const constText = parent.find('.mp_constituency, .constituency').text().trim();
        candidates.push({ name: linkText, slug: profileMatch[1], constituency: constText });
      }
    });

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
    return fetchPrsProfile(bestMatch.name, term);
  } catch (err) {
    console.warn('PRS search failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Public API: fetch PRS performance for a politician ─────────────────────

export async function fetchPrsPerformance(
  name: string,
  constituency?: string,
  term = '18th Lok Sabha',
): Promise<PrsPerformance | null> {
  // Try direct slug-based fetch first (fast path)
  let result = await fetchPrsProfile(name, term);

  // Fallback: search the PRS MP list
  if (!result && constituency) {
    result = await searchPrsList(name, constituency, term);
  }

  // Try reversed name order
  if (!result) {
    const tokens = normalizeName(name).split(' ');
    if (tokens.length >= 2) {
      const reversed = [...tokens].reverse().join(' ');
      result = await fetchPrsProfile(reversed, term);
    }
  }

  return result;
}
