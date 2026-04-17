import type { PoliticianProfileData } from '../types';

// Data scraped and structured for Manoj Manzil, MLA from Agiaon, Bihar
// Note: He is from the Communist Party of India (Marxist-Leninist) (Liberation), not the BJP.
export const manojManzilData: PoliticianProfileData = {
  profileUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5610',
  name: 'Manoj Manzil',
  party: 'Communist Party of India (Marxist-Leninist) (Liberation)',
  constituency: 'Agiaon (SC)',
  education: '8th Pass',
  photoUrl: 'https://ui-avatars.com/api/?name=Manoj+Manzil&background=d9534f&color=fff',
  assetDeclarations: [
    {
      year: 2020,
      totalAssets: 665000, // 6.65 Lakhs
      liabilities: 0,
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5610',
    },
  ],
  criminalCases: [
    {
      ipcSection: 'IPC Section-307',
      description: 'Attempt to murder',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5610',
    },
    {
      ipcSection: 'IPC Section-147',
      description: 'Punishment for Rioting',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5610',
    },
    {
      ipcSection: 'IPC Section-353',
      description: 'Assault or criminal force to deter public servant from discharge of his duty',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5610',
    },
     {
      ipcSection: 'IPC Section-504',
      description: 'Intentional insult with intent to provoke breach of the peace',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/Bihar2020/candidate.php?candidate_id=5610',
    },
  ],
};
