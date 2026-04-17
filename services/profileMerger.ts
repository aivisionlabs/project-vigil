/**
 * Profile merge & mapping utilities.
 * Pure functions — no side effects, no network calls. Fully testable.
 */
import type { PoliticianProfileData } from '../types';

/**
 * Map raw API response data to our PoliticianProfileData shape.
 * Handles missing/null fields gracefully.
 */
export function mapApiProfile(apiData: any, profileUrl: string): PoliticianProfileData {
  const name = apiData?.name || 'Unknown';
  return {
    profileUrl,
    name,
    party: apiData?.party || 'Not available',
    constituency: apiData?.constituency || 'Not available',
    state: apiData?.state || '',
    education: apiData?.education || 'Not declared',
    age: apiData?.age || '',
    photoUrl: apiData?.photoUrl || generateAvatarUrl(name),
    assetDeclarations: Array.isArray(apiData?.assetDeclarations)
      ? apiData.assetDeclarations.map((a: any) => ({
          year: a.year ?? 0,
          totalAssets: a.totalAssets ?? 0,
          liabilities: a.liabilities ?? 0,
          sourceUrl: a.sourceUrl || profileUrl,
        }))
      : [],
    criminalCases: Array.isArray(apiData?.criminalCases)
      ? apiData.criminalCases.map((c: any) => ({
          ipcSection: c.ipcSection || 'Not specified',
          description: c.description || 'Details in affidavit',
          status: c.status || 'Pending',
          sourceUrl: c.sourceUrl || profileUrl,
        }))
      : [],
    additionalInfo: apiData?.additionalInfo,
  };
}

/**
 * Merge a live-fetched profile with local cached data.
 * Live data takes precedence, but local fills gaps.
 */
export function mergeProfiles(
  live: PoliticianProfileData,
  local: PoliticianProfileData,
): PoliticianProfileData {
  return {
    ...live,
    education: live.education !== 'Not declared' ? live.education : local.education,
    photoUrl: live.photoUrl.includes('ui-avatars') ? local.photoUrl : live.photoUrl,
    assetDeclarations:
      live.assetDeclarations.length > 0 ? live.assetDeclarations : local.assetDeclarations,
    criminalCases:
      live.criminalCases.length > 0 ? live.criminalCases : local.criminalCases,
  };
}

/** Generate a deterministic avatar URL from a name. */
export function generateAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f6ad55&color=1a202c&size=200`;
}
