import { describe, it, expect } from 'vitest';
import { mapApiProfile, generateAvatarUrl } from '../services/profileMerger';

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
