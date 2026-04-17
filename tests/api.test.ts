import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchPoliticians, getPoliticianProfile, getAssociatedReports } from '../services/api';
import { FALLBACK_POLITICIANS, CACHED_PROFILE_URLS } from '../services/fallbackData';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API orchestrator', () => {
  // ── searchPoliticians ─────────────────────────────────────────────────────

  describe('searchPoliticians', () => {
    it('returns cached list for empty query without calling API', async () => {
      const result = await searchPoliticians('');
      expect(result.results).toEqual(FALLBACK_POLITICIANS);
      expect(result.meta.source).toBe('cache');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns cached list for single-character query', async () => {
      const result = await searchPoliticians('a');
      expect(result.results).toEqual(FALLBACK_POLITICIANS);
      expect(result.meta.source).toBe('cache');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls live API for queries with 2+ characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ name: 'Test', party: 'TP', constituency: 'TC', profileUrl: 'https://test.com' }],
          meta: { fetchedAt: '2024-01-01T00:00:00Z' },
        }),
      });

      const result = await searchPoliticians('Te');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.results).toHaveLength(1);
      expect(result.meta.source).toBe('live');
    });

    it('falls back to filtered local data when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await searchPoliticians('amit');
      expect(result.meta.source).toBe('fallback');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.every(p => p.name.toLowerCase().includes('amit'))).toBe(true);
    });

    it('falls back to local when API returns non-ok status', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const result = await searchPoliticians('amit');
      expect(result.meta.source).toBe('fallback');
    });

    it('falls back to filtered local when API returns empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], meta: { fetchedAt: '2024-01-01' } }),
      });

      const result = await searchPoliticians('amit');
      // Should find amit in local data
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.meta.source).toBe('fallback');
    });

    it('returns empty array when no live or local matches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], meta: { fetchedAt: '2024-01-01' } }),
      });

      const result = await searchPoliticians('zzzznonexistent');
      expect(result.results).toEqual([]);
      expect(result.meta.source).toBe('live');
    });
  });

  // ── getPoliticianProfile ──────────────────────────────────────────────────

  describe('getPoliticianProfile', () => {
    const cachedUrl = Array.from(CACHED_PROFILE_URLS)[0];

    it('returns cached profile instantly in cacheOnly mode', async () => {
      const result = await getPoliticianProfile(cachedUrl, true);
      expect(result.profile).not.toBeNull();
      expect(result.meta.source).toBe('cache');
      expect(result.warnings).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls live API when cacheOnly is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            name: 'Live Name',
            party: 'Live Party',
            constituency: 'Live City',
            education: 'Live Education',
            photoUrl: 'https://live.com/photo.jpg',
            assetDeclarations: [{ year: 2024, totalAssets: 1000, liabilities: 0, sourceUrl: 'https://x.com' }],
            criminalCases: [],
          },
          meta: { fetchedAt: '2024-01-01T00:00:00Z' },
        }),
      });

      const result = await getPoliticianProfile(cachedUrl, false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.meta.source).toBe('live');
      expect(result.profile).not.toBeNull();
    });

    it('falls back to cached data when live API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getPoliticianProfile(cachedUrl, false);
      expect(result.profile).not.toBeNull();
      expect(result.meta.source).toBe('fallback');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('returns null profile for uncached URL when live also fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getPoliticianProfile('https://myneta.info/fake/candidate.php?candidate_id=999999', false);
      expect(result.profile).toBeNull();
      expect(result.meta.source).toBe('fallback');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('merges live + local data for cached URLs', async () => {
      // Live returns data with placeholder photo and empty education
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            name: 'Merged Name',
            party: 'Party',
            constituency: 'City',
            education: 'Not declared',
            photoUrl: 'https://ui-avatars.com/api/?name=Test',
            assetDeclarations: [{ year: 2024, totalAssets: 5000000, liabilities: 0, sourceUrl: 'https://x.com' }],
            criminalCases: [],
          },
          meta: { fetchedAt: '2024-01-01T00:00:00Z' },
        }),
      });

      const result = await getPoliticianProfile(cachedUrl, false);
      expect(result.profile).not.toBeNull();
      // Photo should come from local (since live has ui-avatars)
      expect(result.profile!.photoUrl).not.toContain('ui-avatars');
      // Education should come from local (since live says "Not declared")
      expect(result.profile!.education).not.toBe('Not declared');
    });

    it('adds warning when asset data is missing from live', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          profile: {
            name: 'Test',
            party: 'P',
            constituency: 'C',
            education: 'Grad',
            photoUrl: 'https://test.com/photo.jpg',
            assetDeclarations: [],
            criminalCases: [{ ipcSection: 'X', description: 'Y', status: 'Pending', sourceUrl: 'https://x.com' }],
          },
          meta: { fetchedAt: '2024-01-01T00:00:00Z' },
        }),
      });

      // Use an uncached URL so no merge happens
      const result = await getPoliticianProfile('https://myneta.info/fake/candidate.php?candidate_id=1', false);
      expect(result.warnings).toContain('Asset declaration data could not be retrieved from the government source.');
    });
  });

  // ── getAssociatedReports ──────────────────────────────────────────────────

  describe('getAssociatedReports', () => {
    it('returns reports from live API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reports: [{ department_name: 'Dept', finding_summary: 'Summary', loss_amount_rs_crore: '10', source_report_page: 'p.1', sourceUrl: 'https://x.com' }],
          meta: { source: 'gemini-ai', generatedAt: '2024-01-01' },
        }),
      });

      const result = await getAssociatedReports('Test Name', 'Party', 'City');
      expect(result.reports).toHaveLength(1);
      expect(result.meta.source).toBe('live');
    });

    it('returns fallback report when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getAssociatedReports('Test Name');
      expect(result.reports).toHaveLength(1);
      expect(result.meta.source).toBe('fallback');
      expect(result.reports[0].department_name).toBe('Government Audit Observations');
    });

    it('includes politician name in fallback message', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fail'));

      const result = await getAssociatedReports('Narendra Modi');
      expect(result.reports[0].finding_summary).toContain('Narendra Modi');
    });

    it('passes party and constituency as query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reports: [], meta: { source: 'fallback' } }),
      });

      await getAssociatedReports('Name', 'BJP', 'Varanasi');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('name=Name');
      expect(calledUrl).toContain('party=BJP');
      expect(calledUrl).toContain('constituency=Varanasi');
    });
  });
});
