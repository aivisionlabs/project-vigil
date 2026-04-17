import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ReportFinding {
  department_name: string;
  finding_summary: string;
  loss_amount_rs_crore: string;
  source_report_page: string;
  sourceUrl: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const name = req.query.name as string;
  const party = req.query.party as string;
  const constituency = req.query.constituency as string;

  if (!name) {
    return res.status(400).json({ error: 'Politician name is required.', reports: [] });
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      reports: getGenericFallback(name),
      meta: { source: 'fallback', reason: 'AI service not configured' },
    });
  }

  try {
    const prompt = `Generate 2-3 fictional, plausible-sounding summaries of findings from official government audit reports (like CAG or CVC) that could be associated with a politician named "${name}" from the "${party || 'unknown'}" party, representing "${constituency || 'unknown'}" constituency in India. Focus on procedural lapses, inefficiencies, or procurement irregularities related to their ministry or state departments, NOT personal corruption. Be neutral and bureaucratic in tone. For each finding, provide a department name, a summary, a presumptive loss in Rs Crore (can be 'N/A'), and a source report page number (e.g., "Report No. 12 of 2021, p. 45").`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  department_name: { type: 'STRING' },
                  finding_summary: { type: 'STRING' },
                  loss_amount_rs_crore: { type: 'STRING' },
                  source_report_page: { type: 'STRING' },
                },
                required: ['department_name', 'finding_summary', 'loss_amount_rs_crore', 'source_report_page'],
              },
            },
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const reports: Omit<ReportFinding, 'sourceUrl'>[] = JSON.parse(text);

    const enrichedReports: ReportFinding[] = reports.map(r => ({
      ...r,
      sourceUrl: 'https://cag.gov.in/en/reports-list',
    }));

    return res.status(200).json({
      reports: enrichedReports,
      meta: { source: 'gemini-ai', generatedAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Reports generation error:', err);
    return res.status(200).json({
      reports: getGenericFallback(name),
      meta: { source: 'fallback', reason: err instanceof Error ? err.message : 'AI generation failed' },
    });
  }
}

function getGenericFallback(name: string): ReportFinding[] {
  return [
    {
      department_name: `Government Audit Observations`,
      finding_summary: `AI-generated audit summary is temporarily unavailable for ${name}. Please refer to the official CAG reports portal for the latest findings related to their ministerial or constituency responsibilities.`,
      loss_amount_rs_crore: 'N/A',
      source_report_page: 'Visit cag.gov.in for official reports',
      sourceUrl: 'https://cag.gov.in/en/reports-list',
    },
  ];
}
