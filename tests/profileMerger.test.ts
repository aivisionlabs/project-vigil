import { describe, it, expect } from 'vitest';
import { mapApiProfile, mergeProfiles, generateAvatarUrl } from '../services/profileMerger';

describe('profileMerger', () => {
  // ── mapApiProfile ─────────────────────────────────────────────────────────

  describe('mapApiProfile', () => {
    it('maps complete API data correctly', () => {
      const apiData = {
        name: 'Test Politician',
        party: 'Test Party',
        constituency: 'Test City',
        state: 'Test State',
        education: 'Graduate',
        age: '50',
        photoUrl: 'https://example.com/photo.jpg',
        assetDeclarations: [
          { year: 2020, totalAssets: 1000000, liabilities: 500000, sourceUrl: 'https://source.com' },
        ],
        criminalCases: [
          { ipcSection: 'IPC 302', description: 'Murder charge', status: 'Acquitted', sourceUrl: 'https://source.com' },
        ],
        additionalInfo: { selfProfession: 'Politician', spouseProfession: 'Homemaker', panGiven: 'Yes' },
      };

      const result = mapApiProfile(apiData, 'https://test.com/profile');

      expect(result.name).toBe('Test Politician');
      expect(result.party).toBe('Test Party');
      expect(result.profileUrl).toBe('https://test.com/profile');
      expect(result.assetDeclarations).toHaveLength(1);
      expect(result.assetDeclarations[0].year).toBe(2020);
      expect(result.criminalCases).toHaveLength(1);
      expect(result.criminalCases[0].ipcSection).toBe('IPC 302');
    });

    it('handles null/undefined API data gracefully', () => {
      const result = mapApiProfile(null, 'https://test.com/profile');
      expect(result.name).toBe('Unknown');
      expect(result.party).toBe('Not available');
      expect(result.education).toBe('Not declared');
      expect(result.assetDeclarations).toEqual([]);
      expect(result.criminalCases).toEqual([]);
    });

    it('handles empty object', () => {
      const result = mapApiProfile({}, 'https://test.com/profile');
      expect(result.name).toBe('Unknown');
      expect(result.photoUrl).toContain('ui-avatars.com');
    });

    it('handles missing asset declarations array', () => {
      const result = mapApiProfile({ name: 'X', assetDeclarations: null }, 'https://x.com');
      expect(result.assetDeclarations).toEqual([]);
    });

    it('handles missing criminal cases array', () => {
      const result = mapApiProfile({ name: 'X', criminalCases: undefined }, 'https://x.com');
      expect(result.criminalCases).toEqual([]);
    });

    it('provides default values for missing fields in asset declarations', () => {
      const result = mapApiProfile({
        assetDeclarations: [{ year: 2020 }],
      }, 'https://x.com');

      expect(result.assetDeclarations[0].totalAssets).toBe(0);
      expect(result.assetDeclarations[0].liabilities).toBe(0);
      expect(result.assetDeclarations[0].sourceUrl).toBe('https://x.com');
    });

    it('provides default values for missing fields in criminal cases', () => {
      const result = mapApiProfile({
        criminalCases: [{}],
      }, 'https://x.com');

      expect(result.criminalCases[0].ipcSection).toBe('Not specified');
      expect(result.criminalCases[0].description).toBe('Details in affidavit');
      expect(result.criminalCases[0].status).toBe('Pending');
    });

    it('generates avatar URL when photoUrl is missing', () => {
      const result = mapApiProfile({ name: 'Amit Shah' }, 'https://x.com');
      expect(result.photoUrl).toContain('ui-avatars.com');
      expect(result.photoUrl).toContain('Amit%20Shah');
    });
  });

  // ── mergeProfiles ─────────────────────────────────────────────────────────

  describe('mergeProfiles', () => {
    const localProfile = {
      profileUrl: 'https://local.com',
      name: 'Local Politician',
      party: 'Local Party',
      constituency: 'Local City',
      education: 'PhD in Economics',
      photoUrl: 'https://local.com/photo.jpg',
      assetDeclarations: [{ year: 2020, totalAssets: 5000000, liabilities: 0, sourceUrl: 'https://local.com' }],
      criminalCases: [{ ipcSection: 'IPC 420', description: 'Fraud', status: 'Pending' as const, sourceUrl: 'https://local.com' }],
    };

    it('live data takes precedence when available', () => {
      const liveProfile = {
        ...localProfile,
        name: 'Live Politician',
        education: 'MBA',
        photoUrl: 'https://live.com/photo.jpg',
        assetDeclarations: [{ year: 2024, totalAssets: 9000000, liabilities: 100000, sourceUrl: 'https://live.com' }],
        criminalCases: [{ ipcSection: 'IPC 302', description: 'Murder', status: 'Acquitted' as const, sourceUrl: 'https://live.com' }],
      };

      const merged = mergeProfiles(liveProfile, localProfile);

      expect(merged.name).toBe('Live Politician');
      expect(merged.education).toBe('MBA');
      expect(merged.photoUrl).toBe('https://live.com/photo.jpg');
      expect(merged.assetDeclarations[0].year).toBe(2024);
      expect(merged.criminalCases[0].ipcSection).toBe('IPC 302');
    });

    it('falls back to local education when live says "Not declared"', () => {
      const liveProfile = { ...localProfile, education: 'Not declared' };
      const merged = mergeProfiles(liveProfile, localProfile);
      expect(merged.education).toBe('PhD in Economics');
    });

    it('falls back to local photo when live has ui-avatars placeholder', () => {
      const liveProfile = {
        ...localProfile,
        photoUrl: 'https://ui-avatars.com/api/?name=Test',
      };
      const merged = mergeProfiles(liveProfile, localProfile);
      expect(merged.photoUrl).toBe('https://local.com/photo.jpg');
    });

    it('falls back to local assets when live has empty array', () => {
      const liveProfile = { ...localProfile, assetDeclarations: [] };
      const merged = mergeProfiles(liveProfile, localProfile);
      expect(merged.assetDeclarations).toHaveLength(1);
      expect(merged.assetDeclarations[0].year).toBe(2020);
    });

    it('falls back to local criminal cases when live has empty array', () => {
      const liveProfile = { ...localProfile, criminalCases: [] };
      const merged = mergeProfiles(liveProfile, localProfile);
      expect(merged.criminalCases).toHaveLength(1);
    });

    it('uses live data for empty fields if local also empty', () => {
      const emptyLive = { ...localProfile, assetDeclarations: [], criminalCases: [] };
      const emptyLocal = { ...localProfile, assetDeclarations: [], criminalCases: [] };
      const merged = mergeProfiles(emptyLive, emptyLocal);
      expect(merged.assetDeclarations).toEqual([]);
      expect(merged.criminalCases).toEqual([]);
    });
  });

  // ── generateAvatarUrl ─────────────────────────────────────────────────────

  describe('generateAvatarUrl', () => {
    it('generates a valid URL', () => {
      const url = generateAvatarUrl('Amit Shah');
      expect(url).toContain('ui-avatars.com');
      expect(url).toContain('Amit%20Shah');
    });

    it('handles special characters', () => {
      const url = generateAvatarUrl('M. K. Gandhi');
      expect(url).toContain('M.%20K.%20Gandhi');
    });

    it('handles empty string', () => {
      const url = generateAvatarUrl('');
      expect(url).toContain('ui-avatars.com');
    });
  });
});
