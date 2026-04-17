import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLiveSearch, fetchLiveProfile, fetchLiveReports } from '../services/liveFetcher';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('liveFetcher', () => {
  // ── fetchLiveSearch ───────────────────────────────────────────────────────

  describe('fetchLiveSearch', () => {
    it('calls correct URL with encoded query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], meta: {} }),
      });

      await fetchLiveSearch('Amit Shah');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toBe('/api/search?q=Amit%20Shah');
    });

    it('trims query whitespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], meta: {} }),
      });

      await fetchLiveSearch('  test  ');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toBe('/api/search?q=test');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(fetchLiveSearch('test')).rejects.toThrow('Search API returned 500');
    });

    it('uses provided timeout', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], meta: {} }),
      });

      await fetchLiveSearch('test', 5000);
      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.signal).toBeDefined();
    });
  });

  // ── fetchLiveProfile ──────────────────────────────────────────────────────

  describe('fetchLiveProfile', () => {
    it('calls correct URL with encoded profile URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: {}, meta: {} }),
      });

      await fetchLiveProfile('https://myneta.info/test?id=123');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/api/profile?url=');
      expect(url).toContain(encodeURIComponent('https://myneta.info/test?id=123'));
      expect(url).toContain('history=true');
    });

    it('can disable history fetching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: {}, meta: {} }),
      });

      await fetchLiveProfile('https://myneta.info/test', false);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('history=false');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(fetchLiveProfile('https://test.com')).rejects.toThrow('Profile API returned 404');
    });
  });

  // ── fetchLiveReports ──────────────────────────────────────────────────────

  describe('fetchLiveReports', () => {
    it('calls correct URL with all params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reports: [], meta: {} }),
      });

      await fetchLiveReports('Amit Shah', 'BJP', 'Gandhinagar');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('name=Amit+Shah');
      expect(url).toContain('party=BJP');
      expect(url).toContain('constituency=Gandhinagar');
    });

    it('works with only name param', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reports: [], meta: {} }),
      });

      await fetchLiveReports('Test Name');
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('name=Test+Name');
      expect(url).not.toContain('party=');
      expect(url).not.toContain('constituency=');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
      await expect(fetchLiveReports('test')).rejects.toThrow('Reports API returned 503');
    });
  });
});
