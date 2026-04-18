import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchPrsPerformance } from './lib/prsScraper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const name = (req.query.name as string || '').trim();
  const constituency = (req.query.constituency as string || '').trim();
  const term = (req.query.term as string || '18th Lok Sabha').trim();

  if (!name) {
    return res.status(400).json({ error: 'Politician name is required.', performance: null });
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');

  try {
    const result = await fetchPrsPerformance(name, constituency || undefined, term);

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
