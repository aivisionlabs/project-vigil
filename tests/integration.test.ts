import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchPoliticians, getPoliticianProfile } from '../services/api';

// Mock supabase client
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'not found' } })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
  isSupabaseConfigured: true,
}));

vi.mock('../services/supabaseCache', () => ({
  getCachedRemoteProfile: vi.fn(() => Promise.resolve(null)),
  cacheRemoteProfile: vi.fn(() => Promise.resolve()),
  getCachedSearchResults: vi.fn(() => Promise.resolve(null)),
  cacheSearchResults: vi.fn(() => Promise.resolve()),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Integration: Live search flow', () => {
  it('search → live results → profile (full success)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{
          name: 'Live Politician',
          party: 'LP',
          constituency: 'LC',
          profileUrl: 'https://myneta.info/test/candidate.php?candidate_id=1',
          election: 'LokSabha2024',
        }],
        meta: { fetchedAt: new Date().toISOString() },
      }),
    });

    const search = await searchPoliticians('Live');
    expect(search.meta.source).toBe('live');
    expect(search.results).toHaveLength(1);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          name: 'Live Politician',
          party: 'LP',
          constituency: 'LC',
          education: 'Graduate',
          photoUrl: 'https://example.com/photo.jpg',
          assetDeclarations: [{ year: 2024, totalAssets: 5000000, liabilities: 100000, sourceUrl: 'https://x.com' }],
          criminalCases: [{ ipcSection: 'IPC 420', description: 'Fraud', status: 'Pending', sourceUrl: 'https://x.com' }],
        },
        meta: { fetchedAt: new Date().toISOString() },
      }),
    });

    const profile = await getPoliticianProfile(search.results[0].profileUrl);
    expect(profile.meta.source).toBe('live');
    expect(profile.profile!.assetDeclarations).toHaveLength(1);
    expect(profile.profile!.criminalCases).toHaveLength(1);
  });
});

describe('Integration: Partial failure', () => {
  it('live profile has no assets → warns but still shows criminal cases', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        profile: {
          name: 'Partial Data',
          party: 'PP',
          constituency: 'PC',
          education: 'Grad',
          photoUrl: 'https://x.com/photo.jpg',
          assetDeclarations: [],
          criminalCases: [{ ipcSection: 'IPC 302', description: 'Murder', status: 'Pending', sourceUrl: 'https://x.com' }],
        },
        meta: { fetchedAt: new Date().toISOString() },
      }),
    });

    const result = await getPoliticianProfile('https://myneta.info/new/candidate.php?candidate_id=999');
    expect(result.profile).not.toBeNull();
    expect(result.profile!.criminalCases).toHaveLength(1);
    expect(result.profile!.assetDeclarations).toHaveLength(0);
    expect(result.warnings).toContain('Asset declaration data could not be retrieved from the government source.');
  });
});

describe('Integration: Complete failure (offline)', () => {
  it('search falls back when API is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const result = await searchPoliticians('amit');
    expect(result.meta.source).toBe('fallback');
  });

  it('uncached profile returns null with warning when completely offline', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const result = await getPoliticianProfile('https://myneta.info/fake/candidate.php?candidate_id=0');
    expect(result.profile).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('Integration: Edge cases', () => {
  it('handles API returning malformed JSON gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    const result = await searchPoliticians('test query');
    expect(result.meta.source).toBe('fallback');
  });

  it('handles special characters in search query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [], meta: { fetchedAt: new Date().toISOString() } }),
    });

    await searchPoliticians('M.K. Gandhi & Sons (test)');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain(encodeURIComponent('M.K. Gandhi & Sons (test)'));
  });
});
