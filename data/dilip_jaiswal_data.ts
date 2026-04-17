import type { PoliticianProfileData } from '../types';

// Data scraped and structured for Dilip Kumar Jaiswal, MLA from Rupauli, Bihar
export const dilipJaiswalData: PoliticianProfileData = {
  profileUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=7445',
  name: 'Dilip Kumar Jaiswal',
  party: 'Janata Dal (United) - JD(U)',
  constituency: 'Rupauli',
  education: 'Graduate',
  photoUrl: 'https://ui-avatars.com/api/?name=Dilip+Jaiswal&background=random',
  assetDeclarations: [
    {
      year: 2010,
      totalAssets: 9081000, // 90.81 Lakhs
      liabilities: 0,
      sourceUrl: 'https://myneta.info/bihar2010/candidate.php?candidate_id=1418',
      indexGrowthPercentage: 0, // Base year for index comparison
    },
    {
      year: 2015,
      totalAssets: 29075000, // 2.90 Crore
      liabilities: 2000000,   // 20 Lakhs
      sourceUrl: 'https://myneta.info/bihar2015/candidate.php?candidate_id=1067',
      indexGrowthPercentage: 25.0, // Simulated Sensex growth from ~20k (Oct 2010) to ~25k (Oct 2015)
    },
    {
      year: 2020,
      totalAssets: 49601000, // 4.96 Crore
      liabilities: 1400000,    // 14 Lakhs
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=7445',
      indexGrowthPercentage: 95.0, // Simulated Sensex growth from ~20k (Oct 2010) to ~39k (Oct 2020)
    },
  ],
  criminalCases: [
    {
      ipcSection: 'IPC Section-147',
      description: 'Punishment for Rioting',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=7445'
    },
    {
      ipcSection: 'IPC Section-323',
      description: 'Punishment for voluntarily causing hurt',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=7445'
    },
    {
      ipcSection: 'IPC Section-341',
      description: 'Punishment for wrongful restraint',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=7445'
    },
    {
      ipcSection: 'IPC Section-504',
      description: 'Intentional insult with intent to provoke breach of the peace',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=7445'
    }
  ],
};
