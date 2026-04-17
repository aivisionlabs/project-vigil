import type { PoliticianProfileData } from '../types';

// Data scraped and structured for Amit Shah (Home Minister of India)
export const amitShahData: PoliticianProfileData = {
  // FIX: The 'id' property is not defined in PoliticianProfileData. Removed it and added the required 'profileUrl'.
  profileUrl: 'https://myneta.info/LokSabha2024/candidate.php?candidate_id=4427',
  name: 'Amit Shah',
  party: 'Bharatiya Janata Party (BJP)',
  constituency: 'Gandhinagar',
  education: 'Graduate Professional (B.Sc. in Biochemistry)',
  photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Official_Photograph_of_Amit_Shah.png/440px-Official_Photograph_of_Amit_Shah.png',
  assetDeclarations: [
    {
      year: 2012,
      totalAssets: 109900000, // 10.99 Crore
      liabilities: 27900000,   // 2.79 Crore
      sourceUrl: 'https://myneta.info/gujarat2012/candidate.php?candidate_id=742',
      indexGrowthPercentage: 0, // Base year for index comparison
    },
    {
      year: 2017,
      totalAssets: 343100000, // 34.31 Crore
      liabilities: 1570000,    // 15.7 Lakhs
      sourceUrl: 'https://myneta.info/gujarat2017/candidate.php?candidate_id=6223',
      indexGrowthPercentage: 62.5, // Simulated Sensex growth from ~20k to ~32.5k
    },
    {
      year: 2019,
      totalAssets: 403900000, // 40.39 Crore
      liabilities: 28600000,   // 2.86 Crore
      sourceUrl: 'https://myneta.info/LokSabha2024/candidate.php?candidate_id=4427',
      indexGrowthPercentage: 85, // Simulated Sensex growth from ~20k to ~37k
    },
  ],
  criminalCases: [
    {
      ipcSection: 'IPC Section-302',
      description: 'Charges related to murder',
      status: 'Acquitted',
      sourceUrl: 'https://myneta.info/LokSabha2024/candidate.php?candidate_id=4427'
    },
    {
      ipcSection: 'IPC Section-307',
      description: 'Charges related to attempt to murder',
      status: 'Acquitted',
      sourceUrl: 'https://myneta.info/LokSabha2024/candidate.php?candidate_id=4427'
    },
    {
      ipcSection: 'IPC Section-120B',
      description: 'Charges related to criminal conspiracy',
      status: 'Acquitted',
      sourceUrl: 'https://myneta.info/LokSabha2024/candidate.php?candidate_id=4427'
    },
    {
      ipcSection: 'IPC Section-365',
      description: 'Charges related to kidnapping or abducting with intent secretly and wrongfully to confine person',
      status: 'Acquitted',
      sourceUrl: 'https://myneta.info/LokSabha2024/candidate.php?candidate_id=4427'
    }
  ],
};
