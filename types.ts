export interface PoliticianSummary {
  profileUrl: string;
  name: string;
  party: string;
  constituency: string;
  election?: string;
  criminalCases?: number;
  totalAssets?: string;
  education?: string;
}

export interface AssetDeclaration {
  year: number;
  totalAssets: number;
  liabilities: number;
  sourceUrl: string;
  indexGrowthPercentage?: number;
}

export interface ItrIncome {
  financialYear: string;
  selfIncome: number;
  spouseIncome: number;
  hufIncome: number;
  totalIncome: number;
}

export interface CriminalCase {
  ipcSection: string;
  description: string;
  status: 'Pending' | 'Convicted' | 'Acquitted' | string;
  sourceUrl: string;
}

export interface AssociatedReport {
  department_name: string;
  finding_summary: string;
  loss_amount_rs_crore: string;
  source_report_page: string;
  sourceUrl: string;
}

export interface ParliamentaryQuestion {
  date: string;           // "02.04.2026"
  title: string;          // "Flights from Shravasti Airport"
  type: 'Starred' | 'Unstarred' | string;
  ministry: string;       // "Civil Aviation"
  documentUrl?: string;   // sansad.in PDF link
}

export interface ParliamentaryPerformance {
  attendance: {
    percentage: number;
    nationalAverage: number;
    stateAverage: number;
  } | null;
  questionsAsked: number | null;
  debatesParticipated: number | null;
  billsIntroduced: number | null;
  questions?: ParliamentaryQuestion[];
  term: string; // e.g. "18th Lok Sabha"
  sourceUrl: string;
}

export interface PoliticianProfileData {
  profileUrl: string;
  name: string;
  party: string;
  constituency: string;
  state?: string;
  education: string;
  age?: string;
  photoUrl: string;
  assetDeclarations: AssetDeclaration[];
  itrIncome?: ItrIncome[];
  criminalCases: CriminalCase[];
  additionalInfo?: {
    selfProfession: string;
    spouseProfession: string;
    panGiven: string;
  };
  wikipediaUrl?: string;
  parliamentaryPerformance?: ParliamentaryPerformance;
}

export interface WikipediaSummaryData {
  title: string;
  extract: string;
  pageUrl: string;
  thumbnail?: string;
}

// Data freshness metadata
export interface DataMeta {
  source: 'live' | 'fallback' | 'cache';
  fetchedAt?: string;
  reason?: string;
}
