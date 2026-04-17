import type { PoliticianProfileData } from '../types';

// Data scraped and structured for Tejashwi Yadav, RJD Leader
export const tejashwiYadavData: PoliticianProfileData = {
  profileUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5635',
  name: 'Tejashwi Prasad Yadav',
  party: 'Rashtriya Janata Dal (RJD)',
  constituency: 'Raghopur',
  education: '9th Pass',
  photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tejashwi_Yadav_at_an_event.jpg/440px-Tejashwi_Yadav_at_an_event.jpg',
  assetDeclarations: [
    {
      year: 2015,
      totalAssets: 23257500, // 2.32 Crore
      liabilities: 3400000,   // 34 Lakhs
      sourceUrl: 'https://myneta.info/bihar2015/candidate.php?candidate_id=1255',
      indexGrowthPercentage: 0, // Base year for index comparison
    },
    {
      year: 2020,
      totalAssets: 58878397, // 5.88 Crore
      liabilities: 9655000,    // 96.55 Lakhs
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5635',
      indexGrowthPercentage: 45.1, // Simulated Sensex growth from ~26k (Nov 2015) to ~39k (Oct 2020)
    },
  ],
  criminalCases: [
    {
      ipcSection: 'Prevention of Corruption Act, 1988 - Section 13(2) read with 13(1)(d)',
      description: 'Criminal misconduct by a public servant.',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5635'
    },
    {
      ipcSection: 'IPC Section-120B',
      description: 'Punishment of criminal conspiracy',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5635'
    },
    {
      ipcSection: 'IPC Section-420',
      description: 'Cheating and dishonestly inducing delivery of property',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5635'
    },
    {
      ipcSection: 'IPC Section-504',
      description: 'Intentional insult with intent to provoke breach of the peace',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5635'
    },
    {
      ipcSection: 'IPC Section-506',
      description: 'Punishment for criminal intimidation',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5635'
    }
  ],
};
