/**
 * AI-powered data extraction using Claude API.
 * Sends raw page text to Claude and gets structured data back.
 * This makes extraction resilient to HTML format changes.
 */
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5-20251001'; // fast + cheap for extraction

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!_client) _client = new Anthropic({ apiKey });
  return _client;
}

// ─── Profile extraction ──────────────────────────────────────────────────────

export interface AIExtractedProfile {
  name: string;
  party: string;
  constituency: string;
  state: string;
  education: string;
  age: string;
  selfProfession: string;
  spouseProfession: string;
  panGiven: string;
  totalAssets: number;
  totalLiabilities: number;
  criminalCases: Array<{
    ipcSection: string;
    description: string;
    status: string;
  }>;
}

export async function aiExtractProfile(pageText: string): Promise<AIExtractedProfile | null> {
  const client = getClient();
  if (!client) return null;

  // Truncate to avoid token limits — profile data is usually in the first portion
  const truncated = pageText.slice(0, 8000);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract politician profile data from this Indian election affidavit page text. Return ONLY valid JSON, no explanation.

Page text:
"""
${truncated}
"""

Return JSON with this exact structure:
{
  "name": "full name in title case",
  "party": "political party name or 'Independent'",
  "constituency": "constituency name in title case",
  "state": "state name",
  "education": "education level or 'Not declared'",
  "age": "age as string or empty string",
  "selfProfession": "self profession or empty string",
  "spouseProfession": "spouse profession or empty string",
  "panGiven": "PAN status or empty string",
  "totalAssets": 0,
  "totalLiabilities": 0,
  "criminalCases": [{"ipcSection": "section", "description": "details", "status": "Pending/Convicted/Acquitted"}]
}

For totalAssets and totalLiabilities, extract the numeric value in rupees (no commas). If amounts say "Rs 1,23,45,678" that equals 12345678.
If there are no criminal cases or it says "No criminal cases", return an empty array.
Only return the JSON object, nothing else.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    // Extract JSON from response (handle possible markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as AIExtractedProfile;
  } catch (err) {
    console.error('AI profile extraction failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Search results extraction ───────────────────────────────────────────────

export interface AIExtractedSearchResult {
  name: string;
  party: string;
  constituency: string;
  criminalCases: number;
  totalAssets: string;
  education: string;
  candidateId: string;
}

export async function aiExtractSearchResults(
  pageText: string,
  query: string,
): Promise<AIExtractedSearchResult[]> {
  const client = getClient();
  if (!client) return [];

  const truncated = pageText.slice(0, 12000);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Extract candidate search results from this Indian election website page. The search query was "${query}". Return ONLY a JSON array, no explanation.

Page text:
"""
${truncated}
"""

Return a JSON array where each element has:
{
  "name": "candidate full name",
  "party": "party abbreviation or full name",
  "constituency": "constituency name",
  "criminalCases": 0,
  "totalAssets": "asset string as shown (e.g. 'Rs 1,23,456')",
  "education": "education level",
  "candidateId": "numeric ID from any candidate_id references"
}

Only include candidates whose name contains "${query}" (case-insensitive).
If no candidates found, return an empty array [].
Only return the JSON array, nothing else.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]) as AIExtractedSearchResult[];
  } catch (err) {
    console.error('AI search extraction failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Historical asset extraction ─────────────────────────────────────────────

export interface AIExtractedAssets {
  totalAssets: number;
  totalLiabilities: number;
}

export async function aiExtractAssets(pageText: string): Promise<AIExtractedAssets | null> {
  const client = getClient();
  if (!client) return null;

  const truncated = pageText.slice(0, 6000);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Extract total assets and liabilities from this Indian election affidavit page text. Return ONLY valid JSON.

Page text:
"""
${truncated}
"""

Return: {"totalAssets": <number in rupees>, "totalLiabilities": <number in rupees>}
Convert Indian number format (e.g. "Rs 1,23,45,678") to plain number (12345678). Return 0 if not found.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as AIExtractedAssets;
  } catch (err) {
    console.error('AI asset extraction failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
