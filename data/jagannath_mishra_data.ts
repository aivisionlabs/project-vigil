import type { PoliticianProfileData } from '../types';

// Data scraped and structured for Dr. Jagannath Mishra (Former CM of Bihar)
// Based on his 2014 Lok Sabha election affidavit. He passed away in 2019.
export const jagannathMishraData: PoliticianProfileData = {
  profileUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=9872',
  name: 'Dr. Jagannath Mishra',
  party: 'Janata Dal (United) - JD(U)',
  constituency: 'Jhanjharpur',
  education: 'Post Graduate',
  photoUrl: 'https://ui-avatars.com/api/?name=Jagannath+Mishra&background=random',
  assetDeclarations: [
    {
      year: 2014,
      totalAssets: 14799285, // ~1.48 Crore
      liabilities: 2044792,   // ~20.44 Lakhs
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=9872',
    },
  ],
  criminalCases: [
    {
      ipcSection: 'Prevention of Corruption Act, 1988 - Sec 13(2) r/w 13(1)(d)',
      description: 'Criminal misconduct by a public servant.',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=9872',
    },
    {
      ipcSection: 'IPC Section-120B',
      description: 'Punishment of criminal conspiracy.',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=9872',
    },
    {
      ipcSection: 'IPC Section-420',
      description: 'Cheating and dishonestly inducing delivery of property.',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=9872',
    },
    {
      ipcSection: 'IPC Section-468',
      description: 'Forgery for purpose of cheating.',
      status: 'Pending',
      sourceUrl: 'https://myneta.info/ls2014/candidate.php?candidate_id=9872',
    },
  ],
};
