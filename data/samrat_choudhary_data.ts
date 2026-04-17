import type { PoliticianProfileData } from '../types';

export const samratChoudharyData: PoliticianProfileData = {
  profileUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=10016',
  name: 'Samrat Choudhary',
  party: 'Bharatiya Janata Party (BJP)',
  constituency: 'Bihar Legislative Council (MLC)',
  education: 'Graduate',
  photoUrl: 'https://ui-avatars.com/api/?name=Samrat+Choudhary&background=ff9933&color=fff&size=256',
  assetDeclarations: [
    {
      year: 2014,
      totalAssets: 8540000, // ~85.4 Lakhs
      liabilities: 0,
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=10016',
      indexGrowthPercentage: 0,
    },
    {
      year: 2021,
      totalAssets: 21050000, // ~2.10 Crore (Estimated based on MLC filings)
      liabilities: 1500000,
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=10016', // Placeholder for MLC affidavit
      indexGrowthPercentage: 75.5, 
    },
  ],
  criminalCases: [
    {
      ipcSection: 'IPC Section-188',
      description: 'Disobedience to order duly promulgated by public servant',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=10016'
    },
    {
      ipcSection: 'IPC Section-143',
      description: 'Punishment for Unlawful Assembly',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=10016'
    },
    {
      ipcSection: 'IPC Section-353',
      description: 'Assault or criminal force to deter public servant from discharge of his duty',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=10016'
    }
  ],
};