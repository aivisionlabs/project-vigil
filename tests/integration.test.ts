import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchPoliticians, getPoliticianProfile, getAssociatedReports } from '../services/api';
import { FALLBACK_POLITICIANS, CACHED_PROFILE_URLS } from '../services/fallbackData';

/**
 * Integration tests that verify end-to-end flows:
 * - Homepage → cached profile (no API)
 * - Search → live API → profile
 * - Partial failure → warnings + partial data
 * - Complete failure → fallback everything
 */

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Integration: Homepage flow', () => {
  it('loads homepage politicians from cache without API calls', async () => {
    const search = await searchPoliticians('');
    expect(search.meta.source).toBe('cache');
    expect(search.results.length).toBe(FALLBACK_POLITICIANS.length);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('clicking a cached profile loads instantly from cache', async () => {
    const cachedUrl = Array.from(CACHED_PROFILE_URLS)[0];

    const profile = await getPoliticianProfile(cachedUrl, true);
    expect(profile.meta.source).toBe('cache');
    expect(profile.profile).not.toBeNull();
    expect(profile.profile!.name).toBeTruthy();
    expect(profile.profile!.assetDeclarations.length).toBeGreaterThan(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('Integration: Live search flow', () => {
  it('search → live results → profile (full success)', async () => {
    // Step 1: Search
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

    // Step 2: Profile
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

    const profile = await getPoliticianProfile(search.results[0].profileUrl, false);
    expect(profile.meta.source).toBe('live');
    expect(profile.profile!.assetDeclarations).toHaveLength(1);
    expect(profile.profile!.criminalCases).toHaveLength(1);
  });
});

describe('Integration: Partial failure', () => {
  it('profile loads from cache, reports fail → still shows profile with warning-ready data', async () => {
    const cachedUrl = Array.from(CACHED_PROFILE_URLS)[0];

    // Profile from cache — no API call
    const profile = await getPoliticianProfile(cachedUrl, true);
    expect(profile.profile).not.toBeNull();

    // Reports fail
    mockFetch.mockRejectedValueOnce(new Error('Reports service down'));
    const reports = await getAssociatedReports(profile.profile!.name);
    expect(reports.meta.source).toBe('fallback');
    expect(reports.reports.length).toBeGreaterThan(0); // fallback report
  });

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
          assetDeclarations: [], // <-- empty
          criminalCases: [{ ipcSection: 'IPC 302', description: 'Murder', status: 'Pending', sourceUrl: 'https://x.com' }],
        },
        meta: { fetchedAt: new Date().toISOString() },
      }),
    });

    // Use uncached URL so no merge
    const result = await getPoliticianProfile('https://myneta.info/new/candidate.php?candidate_id=999', false);
    expect(result.profile).not.toBeNull();
    expect(result.profile!.criminalCases).toHaveLength(1);
    expect(result.profile!.assetDeclarations).toHaveLength(0);
    expect(result.warnings).toContain('Asset declaration data could not be retrieved from the government source.');
  });
});

describe('Integration: Complete failure (offline)', () => {
  it('search falls back to local data when API is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const result = await searchPoliticians('amit');
    expect(result.meta.source).toBe('fallback');
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('profile falls back to cache when API is unreachable', async () => {
    const cachedUrl = Array.from(CACHED_PROFILE_URLS)[0];
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const result = await getPoliticianProfile(cachedUrl, false);
    expect(result.meta.source).toBe('fallback');
    expect(result.profile).not.toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('uncached profile returns null with warning when completely offline', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const result = await getPoliticianProfile('https://myneta.info/fake/candidate.php?candidate_id=0', false);
    expect(result.profile).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('reports return fallback when API is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

    const result = await getAssociatedReports('Test');
    expect(result.meta.source).toBe('fallback');
    expect(result.reports.length).toBe(1);
    expect(result.reports[0].sourceUrl).toContain('cag.gov.in');
  });
});

describe('Integration: Edge cases', () => {
  it('handles API returning malformed JSON gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    const result = await searchPoliticians('test query');
    // Should fall back
    expect(result.meta.source).toBe('fallback');
  });

  it('handles API returning null profile', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: null, meta: {} }),
    });

    const cachedUrl = Array.from(CACHED_PROFILE_URLS)[0];
    const result = await getPoliticianProfile(cachedUrl, false);
    // Should fall back to cached
    expect(result.profile).not.toBeNull();
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
