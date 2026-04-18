/**
 * Profile merge & mapping utilities.
 * Pure functions — no side effects, no network calls. Fully testable.
 */
import type { PoliticianProfileData, ItrIncome } from '../types';

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
    itrIncome: Array.isArray(apiData?.itrIncome)
      ? apiData.itrIncome.map((i: any) => ({
          financialYear: i.financialYear || '',
          selfIncome: i.selfIncome ?? 0,
          spouseIncome: i.spouseIncome ?? 0,
          hufIncome: i.hufIncome ?? 0,
          totalIncome: i.totalIncome ?? 0,
        }))
      : undefined,
    additionalInfo: apiData?.additionalInfo,
    parliamentaryPerformance: apiData?.parliamentaryPerformance
      ? {
          attendance: apiData.parliamentaryPerformance.attendance ?? null,
          questionsAsked: apiData.parliamentaryPerformance.questionsAsked ?? null,
          debatesParticipated: apiData.parliamentaryPerformance.debatesParticipated ?? null,
          billsIntroduced: apiData.parliamentaryPerformance.billsIntroduced ?? null,
          questions: Array.isArray(apiData.parliamentaryPerformance.questions)
            ? apiData.parliamentaryPerformance.questions.map((q: any) => ({
                date: q.date || '',
                title: q.title || '',
                type: q.type || '',
                ministry: q.ministry || '',
                documentUrl: q.documentUrl || undefined,
              }))
            : undefined,
          term: apiData.parliamentaryPerformance.term || '18th Lok Sabha',
          sourceUrl: apiData.parliamentaryPerformance.sourceUrl || '',
        }
      : undefined,
  };
}

/** Generate a deterministic avatar URL from a name. */
export function generateAvatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f6ad55&color=1a202c&size=200`;
}
