import React, { useState, useEffect, useCallback } from 'react';
import { getPoliticianProfile, getAssociatedReports } from '../services/api';
import { fetchLiveProfile, fetchLivePrs } from '../services/liveFetcher';
import { mapApiProfile } from '../services/profileMerger';
import { cacheRemoteProfile } from '../services/supabaseCache';
import type { PoliticianProfileData, AssociatedReport, DataMeta } from '../types';
import { ProfileHeader } from './ProfileHeader';
import { AssetGrowthChart } from './AssetGrowthChart';
import { ItrIncomeChart } from './ItrIncomeChart';
import { CriminalCasesTable } from './CriminalCasesTable';
import { AssociatedReportsList } from './AssociatedReportsList';
import { RtiHelper } from './RtiHelper';
import { PersonalDetails } from './PersonalDetails';
import { DataBadge } from './DataBadge';
import { GovtDownBanner } from './GovtDownBanner';
import { ParliamentaryPerformance } from './ParliamentaryPerformance';

interface PoliticianProfileProps {
  profileUrl: string;
  politicianName: string;
  politicianParty: string;
  politicianConstituency: string;
  indexTotalAssets?: string;
  indexElection?: string;
}

const ProfileSkeleton: React.FC = () => (
  <div className="bg-surface-secondary border border-surface-border p-6 rounded-card">
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="w-24 h-24 skeleton rounded-full" />
      <div className="flex-1 space-y-3 text-center md:text-left w-full">
        <div className="h-7 skeleton w-3/4 mx-auto md:mx-0" />
        <div className="h-4 skeleton w-1/2 mx-auto md:mx-0" />
        <div className="h-3 skeleton w-1/3 mx-auto md:mx-0" />
      </div>
    </div>
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
    <div className="h-5 skeleton w-1/3 mb-4" />
    <div className="h-56 skeleton flex items-center justify-center">
      <svg className="w-8 h-8 text-text-tertiary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    </div>
  </div>
);

const TableSkeleton: React.FC<{ title: string }> = ({ title }) => (
  <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
    <div className="h-5 skeleton w-1/3 mb-4" />
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 skeleton w-1/4" />
          <div className="h-4 skeleton flex-1" />
          <div className="h-4 skeleton w-16" />
        </div>
      ))}
    </div>
    <p className="text-xs text-text-tertiary/40 mt-3">Loading {title}...</p>
  </div>
);

const progressMessages = [
  'Connecting to election database...',
  'Fetching affidavit records...',
  'Parsing asset declarations...',
  'Checking criminal case records...',
  'Searching historical data...',
  'Compiling comprehensive profile...',
  'Almost there...',
];

const ProgressIndicator: React.FC<{ startTime: number }> = ({ startTime }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => Math.min(prev + 1, progressMessages.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);

  return (
    <div className="flex items-center gap-3 text-sm text-text-secondary mb-5 bg-surface-secondary/50 border border-surface-border p-3 rounded-lg">
      <svg className="w-4 h-4 text-accent animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span className="animate-fade-in text-sm">{progressMessages[messageIndex]}</span>
      {elapsed > 3 && (
        <span className="text-xs text-text-tertiary ml-auto font-data">{elapsed}s</span>
      )}
    </div>
  );
};

export const PoliticianProfile: React.FC<PoliticianProfileProps> = ({
  profileUrl,
  politicianName,
  politicianParty,
  politicianConstituency,
  indexTotalAssets,
  indexElection,
}) => {
  const [profile, setProfile] = useState<PoliticianProfileData | null>(null);
  const [profileMeta, setProfileMeta] = useState<DataMeta | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [reports, setReports] = useState<AssociatedReport[]>([]);
  const [reportsMeta, setReportsMeta] = useState<DataMeta | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [prsLoading, setPrsLoading] = useState(true);

  const [loadStartTime] = useState(Date.now());
  const [scrapeStartTime, setScrapeStartTime] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        setWarnings([]);
        const result = await getPoliticianProfile(profileUrl);
        setProfile(result.profile);
        setProfileMeta(result.meta);
        setWarnings(result.warnings);
        // If profile already has PRS data, no need to fetch separately
        if (result.profile?.parliamentaryPerformance) {
          setPrsLoading(false);
        }
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [profileUrl]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setReportsLoading(true);
        setReportsError(null);
        const result = await getAssociatedReports(politicianName, politicianParty, politicianConstituency);
        setReports(result.reports);
        setReportsMeta(result.meta);
      } catch (err) {
        setReportsError(err instanceof Error ? err.message : 'Failed to load reports.');
      } finally {
        setReportsLoading(false);
      }
    };
    fetchReports();
  }, [politicianName, politicianParty, politicianConstituency]);

  // Fetch PRS data independently when the profile doesn't include it
  useEffect(() => {
    if (profileLoading || profile?.parliamentaryPerformance) return;

    const isLokSabha = indexElection?.toLowerCase().includes('lok sabha');
    if (!isLokSabha) {
      setPrsLoading(false);
      return;
    }

    const fetchPrs = async () => {
      setPrsLoading(true);
      try {
        const result = await fetchLivePrs(politicianName, politicianConstituency);
        if (result.performance) {
          const perf = result.performance as any;
          const prsData = {
            attendance: perf.attendance ?? null,
            questionsAsked: perf.questionsAsked ?? null,
            debatesParticipated: perf.debatesParticipated ?? null,
            billsIntroduced: perf.billsIntroduced ?? null,
            questions: Array.isArray(perf.questions)
              ? perf.questions.map((q: any) => ({
                  subject: q.subject || q.title || '',
                  type: q.type || 'Unknown',
                  date: q.date || '',
                  ministry: q.ministry || '',
                }))
              : [],
            term: perf.term || '18th Lok Sabha',
            sourceUrl: perf.sourceUrl || '',
          };
          setProfile(prev => {
            if (!prev) return null;
            const updated = { ...prev, parliamentaryPerformance: prsData };
            // Update Supabase cache with PRS data included
            cacheRemoteProfile(profileUrl, updated);
            return updated;
          });
        }
      } catch (err) {
        console.warn('Separate PRS fetch failed:', err);
      } finally {
        setPrsLoading(false);
      }
    };
    fetchPrs();
  }, [profileLoading, profile?.parliamentaryPerformance, politicianName, politicianConstituency, indexElection]);

  const handleScrapeProfile = useCallback(async () => {
    setIsScraping(true);
    setScrapeError(null);
    setScrapeStartTime(Date.now());

    try {
      const data = await fetchLiveProfile(profileUrl, true, 55_000);

      if (data.profile) {
        const scraped = mapApiProfile(data.profile, profileUrl);
        setProfile(scraped);
        setProfileMeta({ source: 'live', fetchedAt: data.meta?.fetchedAt });
        setWarnings([]);
        if (scraped.parliamentaryPerformance) {
          setPrsLoading(false);
        }

        cacheRemoteProfile(profileUrl, scraped);
      } else {
        setScrapeError('Scraper could not extract data from this page. The politician may not have a detailed affidavit on myneta.info.');
      }
    } catch (err) {
      console.error('Scrape failed:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('vercel dev') || msg.includes('API not available')) {
        setScrapeError('Scraping API is not available in dev mode. Run "vercel dev" to enable live scraping, or deploy to Vercel.');
      } else if (msg.includes('timeout')) {
        setScrapeError('Scraping timed out. myneta.info may be slow — try again in a moment.');
      } else {
        setScrapeError('Failed to scrape profile. Please try again.');
      }
    } finally {
      setIsScraping(false);
      setScrapeStartTime(null);
    }
  }, [profileUrl]);

  const allLoading = profileLoading;
  const allWarnings = [...warnings];

  const displayProfile: PoliticianProfileData | null = profile ?? (
    !profileLoading ? {
      profileUrl,
      name: politicianName,
      party: politicianParty,
      constituency: politicianConstituency,
      education: 'Not available',
      photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(politicianName)}&background=f6ad55&color=1a202c&size=200`,
      assetDeclarations: [],
      criminalCases: [],
    } : null
  );

  if (displayProfile && indexTotalAssets && indexElection) {
    const yearMatch = indexElection.match(/(\d{4})/);
    if (yearMatch) {
      const currentYear = parseInt(yearMatch[1], 10);
      const alreadyHasYear = displayProfile.assetDeclarations.some(a => a.year === currentYear);
      if (!alreadyHasYear) {
        const cleaned = indexTotalAssets.replace(/Rs\.?|,|\s|~.*$/gi, '').replace(/\u00a0/g, '').trim();
        const amount = parseFloat(cleaned);
        if (!isNaN(amount) && amount > 0) {
          displayProfile.assetDeclarations.push({
            year: currentYear,
            totalAssets: amount,
            liabilities: 0,
            sourceUrl: profileUrl,
          });
          displayProfile.assetDeclarations.sort((a, b) => a.year - b.year);
        }
      }
    }
  }

  if (!profileLoading && !displayProfile) {
    return (
      <div className="space-y-5 animate-fade-in">
        <GovtDownBanner warnings={['Could not load profile from any source.']} />
      </div>
    );
  }

  const hasAssetData = displayProfile?.assetDeclarations && displayProfile.assetDeclarations.length > 0;
  const isPartialProfile = !profile && !!displayProfile;

  return (
    <div className="space-y-5 animate-fade-in">
      {allLoading && <ProgressIndicator startTime={loadStartTime} />}

      {profileMeta && !profileLoading && (
        <DataBadge meta={profileMeta} />
      )}

      {!profileLoading && allWarnings.length > 0 && (
        <GovtDownBanner warnings={allWarnings} />
      )}

      {profileLoading ? (
        <ProfileSkeleton />
      ) : displayProfile ? (
        <ProfileHeader
          name={displayProfile.name}
          photoUrl={displayProfile.photoUrl}
          party={displayProfile.party}
          constituency={displayProfile.constituency}
          education={displayProfile.education}
          age={displayProfile.age}
          state={displayProfile.state}
          profileUrl={displayProfile.profileUrl}
          election={indexElection}
        />
      ) : null}

      {!profileLoading && isPartialProfile && !isScraping && (
        <div className="bg-surface-secondary border border-accent/20 p-5 rounded-card animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Detailed data not yet fetched
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                We'll scrape {displayProfile!.name}'s election affidavit from myneta.info — assets, criminal cases, education & more.
              </p>
              {scrapeError && (
                <p className="text-xs text-status-danger mt-2">{scrapeError}</p>
              )}
            </div>
            <button
              onClick={handleScrapeProfile}
              className="flex-shrink-0 px-5 py-2.5 bg-accent text-text-inverse font-semibold text-sm rounded-button hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Fetch Full Profile
            </button>
          </div>
        </div>
      )}

      {isScraping && scrapeStartTime && (
        <ProgressIndicator startTime={scrapeStartTime} />
      )}

      {(profileLoading || isScraping) ? (
        <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
          <div className="h-5 skeleton w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-4 h-4 skeleton rounded" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 skeleton w-1/3" />
                  <div className="h-4 skeleton w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : displayProfile && !isPartialProfile ? (
        <PersonalDetails
          name={displayProfile.name}
          party={displayProfile.party}
          constituency={displayProfile.constituency}
          state={displayProfile.state}
          education={displayProfile.education}
          age={displayProfile.age}
          additionalInfo={displayProfile.additionalInfo}
          profileUrl={displayProfile.profileUrl}
          totalAssets={hasAssetData ? displayProfile.assetDeclarations[displayProfile.assetDeclarations.length - 1].totalAssets : undefined}
          totalLiabilities={hasAssetData ? displayProfile.assetDeclarations[displayProfile.assetDeclarations.length - 1].liabilities : undefined}
          criminalCaseCount={displayProfile.criminalCases.length}
        />
      ) : null}

      {!profileLoading && !isScraping && displayProfile?.itrIncome && displayProfile.itrIncome.length > 0 && (
        <ItrIncomeChart data={displayProfile.itrIncome} />
      )}

      {(profileLoading || isScraping) ? (
        <ChartSkeleton />
      ) : displayProfile && hasAssetData ? (
        <AssetGrowthChart data={displayProfile.assetDeclarations} />
      ) : displayProfile && !isPartialProfile ? (
        <RtiHelper politicianName={displayProfile.name} constituency={displayProfile.constituency} />
      ) : null}

      {(profileLoading || isScraping) ? (
        <TableSkeleton title="criminal cases" />
      ) : displayProfile && !isPartialProfile ? (
        <CriminalCasesTable cases={displayProfile.criminalCases} />
      ) : null}

      {/* ── Associated Reports (CAG/CVC) ────────────── */}
      {(reportsLoading) ? (
        <TableSkeleton title="associated reports" />
      ) : (
        <AssociatedReportsList reports={reports} error={reportsError} meta={reportsMeta} />
      )}

      {/* ── Parliamentary Performance (PRS India) ────────────── */}
      {(profileLoading || prsLoading) ? (
        <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
          <div className="h-5 skeleton w-1/2 mb-4" />
          <div className="space-y-3">
            <div className="h-3 skeleton w-full" />
            <div className="h-3 skeleton w-3/4" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 skeleton rounded-lg" />
              ))}
            </div>
          </div>
          <p className="text-xs text-text-tertiary/40 mt-3">Checking parliamentary performance on PRS India...</p>
        </div>
      ) : displayProfile?.parliamentaryPerformance ? (
        <ParliamentaryPerformance data={displayProfile.parliamentaryPerformance} />
      ) : !profileLoading && !prsLoading && displayProfile && indexElection && !indexElection.toLowerCase().includes('lok sabha') ? (
        <div className="bg-surface-secondary border border-surface-border p-4 rounded-card">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
            <div>
              <p className="text-sm text-text-secondary">
                Parliamentary performance tracking is available for <span className="text-text-primary font-medium">Lok Sabha MPs</span> only.
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {displayProfile.name} is a state legislator ({indexElection}). PRS India does not track MLA performance.
              </p>
            </div>
          </div>
        </div>
      ) : !profileLoading && !prsLoading && displayProfile && !isPartialProfile ? (
        <div className="bg-surface-secondary border border-surface-border p-4 rounded-card">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
            </svg>
            <div>
              <p className="text-sm text-text-secondary">
                Parliamentary performance data is currently unavailable for <span className="text-text-primary font-medium">{displayProfile.name}</span>.
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                This data is sourced from PRS Legislative Research and may not be available for all representatives.
              </p>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
};
