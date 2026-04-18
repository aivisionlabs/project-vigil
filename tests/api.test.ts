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

// Mock supabaseCache to return null (no cached data)
vi.mock('../services/supabaseCache', () => ({
  getCachedRemoteProfile: vi.fn(() => Promise.resolve(null)),
  cacheRemoteProfile: vi.fn(() => Promise.resolve()),
  getCachedSearchResults: vi.fn(() => Promise.resolve(null)),
  cacheSearchResults: vi.fn(() => Promise.resolve()),
}));

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
  describe('searchPoliticians', () => {
    it('returns default list for empty query from Supabase', async () => {
      const result = await searchPoliticians('');
      expect(result.meta.source).toBe('cache');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns default list for single-character query', async () => {
      const result = await searchPoliticians('a');
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

    it('falls back to Supabase when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await searchPoliticians('amit');
      expect(result.meta.source).toBe('fallback');
    });

    it('returns empty array when no results from any source', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], meta: { fetchedAt: '2024-01-01' } }),
      });

      const result = await searchPoliticians('zzzznonexistent');
      expect(result.results).toEqual([]);
    });
  });

  describe('getPoliticianProfile', () => {
    it('calls live API when no cached data', async () => {
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

      const result = await getPoliticianProfile('https://myneta.info/test/candidate.php?candidate_id=1');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.meta.source).toBe('live');
      expect(result.profile).not.toBeNull();
    });

    it('returns null profile when live API fails and no cache', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getPoliticianProfile('https://myneta.info/fake/candidate.php?candidate_id=999999');
      expect(result.profile).toBeNull();
      expect(result.meta.source).toBe('fallback');
      expect(result.warnings.length).toBeGreaterThan(0);
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

      const result = await getPoliticianProfile('https://myneta.info/fake/candidate.php?candidate_id=1');
      expect(result.warnings).toContain('Asset declaration data could not be retrieved from the government source.');
    });
  });
});
