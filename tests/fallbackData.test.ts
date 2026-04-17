import { describe, it, expect } from 'vitest';
import {
  FALLBACK_POLITICIANS,
  FALLBACK_PROFILES,
  CACHED_PROFILE_URLS,
  hasCachedProfile,
  getCachedProfile,
  filterCachedPoliticians,
} from '../services/fallbackData';

describe('fallbackData', () => {
  // ── Data integrity ────────────────────────────────────────────────────────

  describe('FALLBACK_POLITICIANS', () => {
    it('contains at least 6 politicians', () => {
      expect(FALLBACK_POLITICIANS.length).toBeGreaterThanOrEqual(6);
    });

    it('every entry has required fields', () => {
      for (const p of FALLBACK_POLITICIANS) {
        expect(p.profileUrl).toBeTruthy();
        expect(p.name).toBeTruthy();
        expect(p.party).toBeTruthy();
        expect(p.constituency).toBeTruthy();
      }
    });

    it('has no duplicate profileUrls', () => {
      const urls = FALLBACK_POLITICIANS.map(p => p.profileUrl);
      expect(new Set(urls).size).toBe(urls.length);
    });
  });

  describe('FALLBACK_PROFILES', () => {
    it('has profiles for all cached URLs', () => {
      for (const url of CACHED_PROFILE_URLS) {
        expect(FALLBACK_PROFILES[url]).toBeDefined();
      }
    });

    it('every profile has required fields', () => {
      for (const profile of Object.values(FALLBACK_PROFILES)) {
        expect(profile.name).toBeTruthy();
        expect(profile.party).toBeTruthy();
        expect(profile.constituency).toBeTruthy();
        expect(profile.education).toBeTruthy();
        expect(profile.photoUrl).toBeTruthy();
        expect(profile.profileUrl).toBeTruthy();
        expect(Array.isArray(profile.assetDeclarations)).toBe(true);
        expect(Array.isArray(profile.criminalCases)).toBe(true);
      }
    });

    it('Amit Shah has asset declarations', () => {
      const amitShah = Object.values(FALLBACK_PROFILES).find(p => p.name === 'Amit Shah');
      expect(amitShah).toBeDefined();
      expect(amitShah!.assetDeclarations.length).toBeGreaterThan(0);
    });

    it('Amit Shah has criminal cases', () => {
      const amitShah = Object.values(FALLBACK_PROFILES).find(p => p.name === 'Amit Shah');
      expect(amitShah).toBeDefined();
      expect(amitShah!.criminalCases.length).toBeGreaterThan(0);
    });

    it('asset declarations have valid structure', () => {
      for (const profile of Object.values(FALLBACK_PROFILES)) {
        for (const asset of profile.assetDeclarations) {
          expect(asset.year).toBeGreaterThan(2000);
          expect(asset.totalAssets).toBeGreaterThanOrEqual(0);
          expect(typeof asset.liabilities).toBe('number');
          expect(asset.sourceUrl).toBeTruthy();
        }
      }
    });

    it('criminal cases have valid structure', () => {
      for (const profile of Object.values(FALLBACK_PROFILES)) {
        for (const c of profile.criminalCases) {
          expect(c.ipcSection).toBeTruthy();
          expect(c.description).toBeTruthy();
          expect(c.status).toBeTruthy();
          expect(c.sourceUrl).toBeTruthy();
        }
      }
    });
  });

  // ── hasCachedProfile ──────────────────────────────────────────────────────

  describe('hasCachedProfile', () => {
    it('returns true for known profile URLs', () => {
      for (const url of CACHED_PROFILE_URLS) {
        expect(hasCachedProfile(url)).toBe(true);
      }
    });

    it('returns false for unknown URLs', () => {
      expect(hasCachedProfile('https://myneta.info/fake/candidate.php?candidate_id=999999')).toBe(false);
      expect(hasCachedProfile('')).toBe(false);
      expect(hasCachedProfile('random-string')).toBe(false);
    });
  });

  // ── getCachedProfile ──────────────────────────────────────────────────────

  describe('getCachedProfile', () => {
    it('returns full profile for known URL', () => {
      const urls = Array.from(CACHED_PROFILE_URLS);
      const profile = getCachedProfile(urls[0]);
      expect(profile).not.toBeNull();
      expect(profile!.name).toBeTruthy();
    });

    it('returns null for unknown URL', () => {
      expect(getCachedProfile('https://unknown.com/x')).toBeNull();
    });
  });

  // ── filterCachedPoliticians ───────────────────────────────────────────────

  describe('filterCachedPoliticians', () => {
    it('returns all politicians for empty query', () => {
      expect(filterCachedPoliticians('')).toEqual(FALLBACK_POLITICIANS);
    });

    it('filters by name (case-insensitive)', () => {
      const results = filterCachedPoliticians('amit');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(p => p.name.toLowerCase().includes('amit'))).toBe(true);
    });

    it('filters by constituency (case-insensitive)', () => {
      const results = filterCachedPoliticians('gandhinagar');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(p => p.constituency.toLowerCase().includes('gandhinagar'))).toBe(true);
    });

    it('returns empty array for nonsense query', () => {
      const results = filterCachedPoliticians('zzzznonexistent');
      expect(results).toEqual([]);
    });

    it('handles whitespace-only query as empty', () => {
      const results = filterCachedPoliticians('   ');
      // trimmed to empty → returns all
      expect(results).toEqual(FALLBACK_POLITICIANS);
    });
  });
});
