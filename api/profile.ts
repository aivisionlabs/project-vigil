import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';
import { aiExtractProfile, aiExtractAssets } from './lib/aiExtractor.js';
import { fetchPrsPerformance } from './lib/prsScraper.js';

const MYNETA_BASE = 'https://www.myneta.info';

interface ScrapedProfile {
  name: string;
  party: string;
  constituency: string;
  state: string;
  education: string;
  age: string;
  photoUrl: string;
  profileUrl: string;
  assetDeclarations: Array<{
    year: number;
    totalAssets: number;
    liabilities: number;
    sourceUrl: string;
  }>;
  criminalCases: Array<{
    ipcSection: string;
    description: string;
    status: string;
    sourceUrl: string;
  }>;
  additionalInfo: {
    selfProfession: string;
    spouseProfession: string;
    panGiven: string;
  };
  itrIncome?: Array<{
    financialYear: string;
    selfIncome: number;
    spouseIncome: number;
    hufIncome: number;
    totalIncome: number;
  }>;
  parliamentaryPerformance?: {
    attendance: { percentage: number; nationalAverage: number; stateAverage: number } | null;
    questionsAsked: number | null;
    debatesParticipated: number | null;
    billsIntroduced: number | null;
    questions: Array<{ date: string; title: string; type: string; ministry: string; documentUrl?: string }>;
    term: string;
    sourceUrl: string;
  };
}

function parseIndianCurrency(text: string): number {
  if (!text || text.toLowerCase() === 'nil' || text === '---') return 0;
  const cleaned = text.replace(/Rs\.?|,|\s|~|₹/gi, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function toTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── Extract photo URL from HTML (always uses Cheerio — images need DOM) ─────

function extractPhotoUrl($: cheerio.CheerioAPI, name: string): string {
  let photoUrl = '';
  $('img').each((_i, img) => {
    const src = $(img).attr('src') || '';
    if (src.includes('images_candidate') || src.includes('candidate')) {
      photoUrl = src.startsWith('http') ? src : `${MYNETA_BASE}/${src}`;
    }
  });
  return photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f6ad55&color=1a202c&size=200`;
}

// ─── Extract election year from URL ──────────────────────────────────────────

function extractElectionYear(profileUrl: string): number {
  // Match any slug followed by a 4-digit year (covers all states + Lok Sabha)
  const yearMatch = profileUrl.match(/myneta\.info\/\w+?(\d{4})\//i);
  return yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
}

// ─── Extract assets from "Other Elections" / "Declared Assets" HTML table ────

function extractDeclaredAssetsTable($: cheerio.CheerioAPI): Array<{
  year: number;
  totalAssets: number;
  sourceUrl: string;
  election: string;
}> {
  const results: Array<{ year: number; totalAssets: number; sourceUrl: string; election: string }> = [];

  $('table').each((_i, table) => {
    const headerText = $(table).find('th').first().text();
    const tableText = $(table).text();
    if (!tableText.includes('Declared Assets') && !headerText.includes('Other Elections')) return;

    $(table).find('tr').each((_j, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const electionText = $(cells[0]).text().trim();
      const assetText = $(cells[1]).text().trim();

      const yearMatch = electionText.match(/(\d{4})/);
      if (!yearMatch) return;
      const year = parseInt(yearMatch[1], 10);

      const rsMatch = assetText.match(/Rs\.?\s*([\d,]+)/i);
      if (!rsMatch) return;

      const totalAssets = parseIndianCurrency(rsMatch[0]);
      if (totalAssets > 0) {
        results.push({ year, totalAssets, sourceUrl: '', election: electionText });
      }
    });
  });

  return results;
}

// ─── Extract ITR income data from HTML table ────────────────────────────────

function extractItrIncome($: cheerio.CheerioAPI): ScrapedProfile['itrIncome'] {
  let itrTable = $('table#income_tax');
  if (!itrTable.length) {
    $('table').each((_i, t) => {
      if ($(t).text().includes('Total Income Shown in ITR')) {
        itrTable = $(t);
        return false;
      }
    });
  }
  if (!itrTable.length) return undefined;

  const byYear: Record<string, { self: number; spouse: number; huf: number }> = {};

  itrTable.find('tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;

    const relation = $(cells[0]).text().trim().toLowerCase();
    if (!['self', 'spouse', 'huf'].includes(relation)) return;

    const cellHtml = $(cells[3]).html() || '';
    const entries = cellHtml.split(/<br\s*\/?>/gi);

    for (const entry of entries) {
      const yearMatch = entry.match(/(\d{4})\s*-\s*(\d{4})/);
      const amountMatch = entry.match(/Rs(?:&nbsp;|\s)*([\d,]+)/i);
      if (!yearMatch || !amountMatch) continue;

      const fy = `${yearMatch[1]}-${yearMatch[2]}`;
      const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
      if (isNaN(amount) || amount <= 0) continue;

      if (!byYear[fy]) byYear[fy] = { self: 0, spouse: 0, huf: 0 };
      if (relation === 'self') byYear[fy].self = amount;
      else if (relation === 'spouse') byYear[fy].spouse = amount;
      else if (relation === 'huf') byYear[fy].huf = amount;
    }
  });

  const years = Object.keys(byYear).sort();
  if (years.length === 0) return undefined;

  return years.map(fy => ({
    financialYear: fy,
    selfIncome: byYear[fy].self,
    spouseIncome: byYear[fy].spouse,
    hufIncome: byYear[fy].huf,
    totalIncome: byYear[fy].self + byYear[fy].spouse + byYear[fy].huf,
  }));
}

// ─── Regex fallback extraction (original logic) ─────────────────────────────

function regexFallbackExtract($: cheerio.CheerioAPI, bodyText: string, profileUrl: string): ScrapedProfile {
  const name = $('h2').first().text().trim() || $('h1').first().text().trim() || 'Unknown';

  const constituencyText = $('h5').first().text().trim();
  const constituencyMatch = constituencyText.match(/^(.+?)\s*\((.+?)\)$/);
  const constituency = constituencyMatch ? constituencyMatch[1].trim() : constituencyText;
  const state = constituencyMatch ? constituencyMatch[2].trim() : '';

  let party = '';
  let education = '';
  let age = '';
  let selfProfession = '';
  let spouseProfession = '';
  let panGiven = '';

  const partyMatch = bodyText.match(/Party\s*:\s*(.+?)(?:\n|$)/i);
  if (partyMatch) party = partyMatch[1].trim();

  const eduMatch = bodyText.match(/(?:Category|Education)\s*:\s*(.+?)(?:\n|$)/i);
  if (eduMatch) education = eduMatch[1].trim();

  const ageMatch = bodyText.match(/Age\s*:\s*(\d+)/i);
  if (ageMatch) age = ageMatch[1];

  const profMatch = bodyText.match(/Self Profession\s*:\s*(.+?)(?:\n|Spouse)/i);
  if (profMatch) selfProfession = profMatch[1].trim();

  const spouseProfMatch = bodyText.match(/Spouse Profession\s*:\s*(.+?)(?:\n|$)/i);
  if (spouseProfMatch) spouseProfession = spouseProfMatch[1].trim();

  const panMatch = bodyText.match(/PAN\s*(?:Given|Card)\s*:\s*(.+?)(?:\n|$)/i);
  if (panMatch) panGiven = panMatch[1].trim();

  let totalAssets = 0;
  let totalLiabilities = 0;

  const assetMatches = bodyText.match(/Total\s*Assets\s*[:\s]*Rs\.?\s*([\d,]+)/gi);
  if (assetMatches && assetMatches.length > 0) {
    totalAssets = parseIndianCurrency(assetMatches[assetMatches.length - 1].replace(/Total\s*Assets\s*[:\s]*/i, ''));
  } else {
    const movableMatch = bodyText.match(/(?:Totals?\s*(?:of\s*)?Movable\s*Assets?)\s*[:\s]*Rs\.?\s*([\d,]+)/i);
    const immovableMatch = bodyText.match(/(?:Totals?\s*(?:of\s*)?Immovable\s*Assets?)\s*[:\s]*Rs\.?\s*([\d,]+)/i);
    if (movableMatch) totalAssets += parseIndianCurrency(movableMatch[1]);
    if (immovableMatch) totalAssets += parseIndianCurrency(immovableMatch[1]);
  }

  const liabilityMatch = bodyText.match(/(?:Total\s*Liabilit(?:y|ies))\s*[:\s]*Rs\s*([\d,]+)/i);
  if (liabilityMatch) totalLiabilities = parseIndianCurrency(liabilityMatch[1]);

  const electionYear = extractElectionYear(profileUrl);
  const assetDeclarations = [];
  if (totalAssets > 0 || totalLiabilities > 0) {
    assetDeclarations.push({ year: electionYear, totalAssets, liabilities: totalLiabilities, sourceUrl: profileUrl });
  }

  const criminalCases: ScrapedProfile['criminalCases'] = [];
  const noCriminalCases = bodyText.match(/No\s*criminal\s*cases/i);

  if (!noCriminalCases) {
    $('table').each((_i, table) => {
      const tableText = $(table).text();
      if (tableText.includes('IPC') || tableText.includes('Section') || tableText.includes('Criminal')) {
        $(table).find('tr').each((_j, row) => {
          const cells = $(row).find('td');
          if (cells.length >= 2) {
            const section = $(cells[0]).text().trim();
            const description = $(cells[1]).text().trim();
            const statusCell = cells.length >= 3 ? $(cells[2]).text().trim() : 'Pending';
            if (section && (section.includes('IPC') || section.includes('Section') || /^\d+/.test(section))) {
              criminalCases.push({ ipcSection: section, description: description || 'Details in affidavit', status: statusCell || 'Pending', sourceUrl: profileUrl });
            }
          }
        });
      }
    });

    if (criminalCases.length === 0) {
      const casePattern = /(?:IPC\s*)?Section[\s-]*(\d+[A-Z]?(?:\/\d+[A-Z]?)*)/gi;
      let match;
      while ((match = casePattern.exec(bodyText)) !== null) {
        criminalCases.push({ ipcSection: `IPC Section-${match[1]}`, description: 'As declared in election affidavit', status: 'Pending', sourceUrl: profileUrl });
      }
    }
  }

  return {
    name: toTitleCase(name),
    party: party || 'Independent',
    constituency: toTitleCase(constituency),
    state,
    education: education || 'Not declared',
    age,
    photoUrl: extractPhotoUrl($, name),
    profileUrl,
    assetDeclarations,
    criminalCases,
    additionalInfo: { selfProfession, spouseProfession, panGiven },
  };
}

// ─── AI-powered profile extraction ──────────────────────────────────────────

async function scrapeProfile(profileUrl: string): Promise<ScrapedProfile | null> {
  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProjectVigil/1.0; +https://projectvigil.in)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);
    const bodyText = $('body').text();

    // Always extract from plain HTML tables (not behind JS)
    const tableAssets = extractDeclaredAssetsTable($);
    const itrIncome = extractItrIncome($);

    // Try AI extraction first
    const aiResult = await aiExtractProfile(bodyText);

    let profile: ScrapedProfile;

    if (aiResult && aiResult.name && aiResult.name !== 'Unknown') {
      const electionYear = extractElectionYear(profileUrl);
      const assetDeclarations: ScrapedProfile['assetDeclarations'] = [];
      if (aiResult.totalAssets > 0 || aiResult.totalLiabilities > 0) {
        assetDeclarations.push({
          year: electionYear,
          totalAssets: aiResult.totalAssets,
          liabilities: aiResult.totalLiabilities,
          sourceUrl: profileUrl,
        });
      }

      profile = {
        name: aiResult.name,
        party: aiResult.party || 'Independent',
        constituency: aiResult.constituency || 'Not available',
        state: aiResult.state || '',
        education: aiResult.education || 'Not declared',
        age: aiResult.age || '',
        photoUrl: extractPhotoUrl($, aiResult.name),
        profileUrl,
        assetDeclarations,
        criminalCases: (aiResult.criminalCases || []).map(c => ({
          ...c,
          sourceUrl: profileUrl,
        })),
        additionalInfo: {
          selfProfession: aiResult.selfProfession || '',
          spouseProfession: aiResult.spouseProfession || '',
          panGiven: aiResult.panGiven || '',
        },
      };
    } else {
      // Fallback to regex extraction
      console.warn('AI extraction failed or returned empty, using regex fallback');
      profile = regexFallbackExtract($, bodyText, profileUrl);
    }

    // Merge "Declared Assets" table data into assetDeclarations
    if (tableAssets.length > 0) {
      const existingYears = new Set(profile.assetDeclarations.map(a => a.year));
      for (const ta of tableAssets) {
        if (!existingYears.has(ta.year)) {
          profile.assetDeclarations.push({
            year: ta.year,
            totalAssets: ta.totalAssets,
            liabilities: 0,
            sourceUrl: profileUrl,
          });
          existingYears.add(ta.year);
        }
      }
      profile.assetDeclarations.sort((a, b) => a.year - b.year);
    }

    // Attach ITR income data
    if (itrIncome && itrIncome.length > 0) {
      profile.itrIncome = itrIncome;
    }

    return profile;
  } catch (err) {
    console.error('Profile scrape error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Historical data (also AI-powered) ──────────────────────────────────────

async function findHistoricalData(
  name: string,
  currentUrl: string,
): Promise<Array<{ year: number; totalAssets: number; liabilities: number; sourceUrl: string }>> {
  const historicalAssets: Array<{ year: number; totalAssets: number; liabilities: number; sourceUrl: string }> = [];

  const currentElectionMatch = currentUrl.match(/myneta\.info\/(\w+)\//);
  const currentElection = currentElectionMatch ? currentElectionMatch[1] : '';

  const elections = [
    'LokSabha2024', 'LokSabha2019', 'LokSabha2014', 'LokSabha2009',
    'Bihar2025', 'Bihar2020', 'Bihar2015', 'Bihar2010',
    'UP2022', 'UP2017', 'Gujarat2022', 'Gujarat2017',
    'Maharashtra2024', 'Maharashtra2019',
    'Delhi2025', 'Delhi2020', 'Delhi2015',
    'Karnataka2023', 'Karnataka2018',
  ].filter(e => e !== currentElection);

  const toSearch = elections.slice(0, 4);

  const promises = toSearch.map(async (election) => {
    try {
      const searchUrl = `https://www.myneta.info/${election}/index.php?action=search&searchquery=${encodeURIComponent(name)}`;
      const resp = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProjectVigil/1.0)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!resp.ok) return null;

      const html = await resp.text();
      const $ = cheerio.load(html);

      let matchUrl = '';
      $('table tr').each((_i, row) => {
        const nameCell = $(row).find('td').eq(1).find('a');
        const candidateName = nameCell.text().trim().toLowerCase();
        if (candidateName === name.toLowerCase()) {
          const href = nameCell.attr('href') || '';
          const idMatch = href.match(/candidate_id=(\d+)/);
          if (idMatch) {
            matchUrl = `https://www.myneta.info/${election}/candidate.php?candidate_id=${idMatch[1]}`;
          }
        }
      });

      if (!matchUrl) return null;

      const profileResp = await fetch(matchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProjectVigil/1.0)' },
        signal: AbortSignal.timeout(6000),
      });
      if (!profileResp.ok) return null;

      const profileHtml = await profileResp.text();
      const bodyText = cheerio.load(profileHtml)('body').text();

      // Try AI extraction for assets
      const aiAssets = await aiExtractAssets(bodyText);

      let assets = 0;
      let liabilities = 0;

      if (aiAssets && aiAssets.totalAssets > 0) {
        assets = aiAssets.totalAssets;
        liabilities = aiAssets.totalLiabilities;
      } else {
        // Regex fallback
        const assetMatch = bodyText.match(/Total\s*Assets\s*[:\s]*Rs\s*([\d,]+)/gi);
        if (assetMatch) {
          assets = parseIndianCurrency(assetMatch[assetMatch.length - 1].replace(/Total\s*Assets\s*[:\s]*/i, ''));
        }
        const liabMatch = bodyText.match(/(?:Total\s*Liabilit(?:y|ies))\s*[:\s]*Rs\s*([\d,]+)/i);
        if (liabMatch) liabilities = parseIndianCurrency(liabMatch[1]);
      }

      const yearMatch = election.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;

      if (year && assets > 0) {
        return { year, totalAssets: assets, liabilities, sourceUrl: matchUrl };
      }
      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.allSettled(promises);
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      historicalAssets.push(r.value);
    }
  });

  return historicalAssets.sort((a, b) => a.year - b.year);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.query.url as string;
  const includeHistory = req.query.history !== 'false';

  if (!url) {
    return res.status(400).json({ error: 'Profile URL is required.' });
  }

  if (!url.includes('myneta.info')) {
    return res.status(400).json({ error: 'Only myneta.info profile URLs are supported.' });
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  try {
    const profile = await scrapeProfile(url);

    if (!profile) {
      return res.status(404).json({
        error: 'Could not fetch politician profile. The page may be unavailable.',
        profileUrl: url,
      });
    }

    // Run historical data + PRS performance fetch in parallel
    const [historicalResult, prsResult] = await Promise.allSettled([
      includeHistory && profile.name && profile.assetDeclarations.length < 2
        ? findHistoricalData(profile.name, url)
        : Promise.resolve([]),
      fetchPrsPerformance(profile.name, profile.constituency),
    ]);

    // Merge historical asset data
    if (historicalResult.status === 'fulfilled' && historicalResult.value.length > 0) {
      const existingYears = new Set(profile.assetDeclarations.map(a => a.year));
      for (const h of historicalResult.value) {
        if (!existingYears.has(h.year)) {
          profile.assetDeclarations.push(h);
        }
      }
      profile.assetDeclarations.sort((a, b) => a.year - b.year);
    }

    // Attach PRS parliamentary performance data
    if (prsResult.status === 'fulfilled' && prsResult.value) {
      const prs = prsResult.value;
      profile.parliamentaryPerformance = {
        attendance: prs.attendance,
        questionsAsked: prs.questionsAsked,
        debatesParticipated: prs.debatesParticipated,
        billsIntroduced: prs.billsIntroduced,
        questions: prs.questions,
        term: prs.term,
        sourceUrl: prs.sourceUrl,
      };
    }

    return res.status(200).json({
      profile,
      meta: {
        source: 'myneta.info',
        fetchedAt: new Date().toISOString(),
        dataComplete: profile.assetDeclarations.length > 0,
        hasCriminalCases: profile.criminalCases.length > 0,
        hasPrsData: !!profile.parliamentaryPerformance,
        extractionMethod: process.env.ANTHROPIC_API_KEY ? 'ai' : 'regex',
      },
    });
  } catch (err) {
    console.error('Profile handler error:', err);
    return res.status(500).json({
      error: 'Failed to fetch profile. Please try again.',
    });
  }
}
