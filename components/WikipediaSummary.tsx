import React, { useState, useEffect } from 'react';
import type { WikipediaSummaryData } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface WikipediaSummaryProps {
  politicianName: string;
  constituency?: string;
}

/**
 * Normalize name for Wikipedia lookup: title-case, strip honorifics.
 */
function normalizeForWiki(name: string): string {
  let n = name.trim();
  // If ALL CAPS, convert to title case
  if (n === n.toUpperCase() && n.length > 3) {
    n = n
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  // Strip common Indian honorifics
  n = n.replace(/^(Shri\.?\s+|Smt\.?\s+|Dr\.?\s+|Adv\.?\s+|Sri\.?\s+|Prof\.?\s+)/i, '');
  return n.trim();
}

/**
 * Check if a Wikipedia extract is about an Indian politician (not a cricketer, actor, etc.)
 */
function isPoliticianArticle(extract: string, constituency?: string): boolean {
  const lower = extract.toLowerCase();

  // Strong positive signals
  const politicianKeywords = [
    'politician', 'member of parliament', 'lok sabha', 'rajya sabha',
    'chief minister', 'minister', 'mla', 'mp', 'legislative assembly',
    'member of the legislative', 'elected', 'constituency',
    'bjp', 'congress', 'indian national congress', 'bharatiya janata',
    'political', 'legislature', 'vidhan sabha', 'sansad',
  ];

  const hasPoliticianSignal = politicianKeywords.some(kw => lower.includes(kw));

  // If constituency is mentioned in the article, strong match
  if (constituency) {
    const constLower = constituency.toLowerCase().replace(/\s*\((sc|st|gen)\)\s*/i, '');
    if (lower.includes(constLower)) return true;
  }

  return hasPoliticianSignal;
}

async function fetchWikipediaSummary(
  name: string,
  constituency?: string,
): Promise<WikipediaSummaryData | null> {
  const cleanName = normalizeForWiki(name);

  try {
    // Strategy 1: Direct page lookup by name
    const directResult = await tryDirectLookup(cleanName);
    if (directResult && isPoliticianArticle(directResult.extract, constituency)) {
      return directResult;
    }

    // Strategy 2: Search with "politician" qualifier
    const searchResult = await trySearchLookup(`${cleanName} Indian politician`, constituency);
    if (searchResult) return searchResult;

    // Strategy 3: Search with constituency for disambiguation
    if (constituency) {
      const constClean = constituency.replace(/\s*\((SC|ST|Gen)\)\s*/i, '').trim();
      const constResult = await trySearchLookup(`${cleanName} ${constClean}`, constituency);
      if (constResult) return constResult;
    }

    // Strategy 4: If direct lookup found *something* (even non-politician), return it
    // with a note — better than nothing for well-known figures
    if (directResult && directResult.extract.length > 100) {
      return directResult;
    }

    return null;
  } catch {
    return null;
  }
}

async function tryDirectLookup(name: string): Promise<WikipediaSummaryData | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, '_'))}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!resp.ok) return null;

    const data = await resp.json();
    // Wikipedia returns type "disambiguation" for disambiguation pages
    if (data.type === 'disambiguation') return null;
    if (!data.extract || data.extract.length < 50) return null;

    return {
      title: data.title,
      extract: data.extract,
      pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`,
      thumbnail: data.thumbnail?.source,
    };
  } catch {
    return null;
  }
}

async function trySearchLookup(
  query: string,
  constituency?: string,
): Promise<WikipediaSummaryData | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
    const resp = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;

    const data = await resp.json();
    const results = data?.query?.search;
    if (!results || results.length === 0) return null;

    // Check each result to find the one about the politician
    for (const result of results) {
      const pageTitle = result.title;
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
      const summaryResp = await fetch(summaryUrl, { signal: AbortSignal.timeout(6000) });
      if (!summaryResp.ok) continue;

      const summaryData = await summaryResp.json();
      if (summaryData.type === 'disambiguation') continue;
      if (!summaryData.extract || summaryData.extract.length < 50) continue;

      // Check if this article is about a politician
      if (isPoliticianArticle(summaryData.extract, constituency)) {
        return {
          title: summaryData.title,
          extract: summaryData.extract,
          pageUrl: summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
          thumbnail: summaryData.thumbnail?.source,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export const WikipediaSummary: React.FC<WikipediaSummaryProps> = ({
  politicianName,
  constituency,
}) => {
  const [data, setData] = useState<WikipediaSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetchWikipediaSummary(politicianName, constituency).then(result => {
      setData(result);
      setLoading(false);
    });
  }, [politicianName, constituency]);

  if (loading) {
    return (
      <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
        <div className="h-5 skeleton w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 skeleton w-full" />
          <div className="h-3 skeleton w-5/6" />
          <div className="h-3 skeleton w-4/6" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const shortExtract = data.extract.length > 300 ? data.extract.slice(0, 300) + '...' : data.extract;
  const needsTruncation = data.extract.length > 300;

  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-text-tertiary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.912-1.564.072-.437-.84-2.516-7.653-2.516-7.653-.323-.91-.627-1.667-.941-2.5-.314-.833-.502-1.667-.627-2.5h-.001c-.063-.333-.125-.667-.188-1H2.404c.084.167.168.333.252.5l.672 1.5c.336.75.672 1.5 1.008 2.25.336.75.672 1.5 1.008 2.25l1.092 2.813c.3.75.599 1.5.899 2.25.15.375.299.75.449 1.125.149.375.299.75.449 1.125.3.75.6 1.5.901 2.25l.169.418c.151.376.498.626.905.626.408 0 .754-.25.906-.627l2.38-5.596a.974.974 0 01.902-.627c.409 0 .754.25.906.627l2.38 5.596c.151.376.497.627.905.627.407 0 .754-.25.905-.626l.17-.418c.3-.75.6-1.5.9-2.25.15-.375.3-.75.45-1.125.149-.375.299-.75.449-1.125.3-.75.599-1.5.899-2.25l1.092-2.813c.336-.75.672-1.5 1.008-2.25.336-.75.672-1.5 1.008-2.25l.672-1.5c.084-.167.168-.333.252-.5h-1.006c-.063.333-.125.667-.188 1-.125.833-.313 1.667-.627 2.5-.314.833-.618 1.59-.941 2.5 0 0-2.079 6.813-2.516 7.653-.437.84-.948 1.002-1.564-.072-.636-1.18-1.917-3.796-2.853-5.728z" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary">About</h3>
        </div>
        <a
          href={data.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors bg-surface-primary/60 px-3 py-1.5 rounded-badge border border-surface-border"
        >
          Wikipedia <ExternalLinkIcon className="w-3 h-3" />
        </a>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed">
        {expanded ? data.extract : shortExtract}
      </p>

      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent hover:text-accent-hover mt-2 transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <a
        href={data.pageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
      >
        Read full article on Wikipedia
        <ExternalLinkIcon className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
