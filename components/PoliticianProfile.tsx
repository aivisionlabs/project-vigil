import React, { useState, useEffect } from 'react';
import { getPoliticianProfile, getAssociatedReports } from '../services/api';
import type { PoliticianProfileData, AssociatedReport, DataMeta } from '../types';
import { ProfileHeader } from './ProfileHeader';
import { AssetGrowthChart } from './AssetGrowthChart';
import { CriminalCasesTable } from './CriminalCasesTable';
import { AssociatedReportsList } from './AssociatedReportsList';
import { RtiHelper } from './RtiHelper';
import { WikipediaSummary } from './WikipediaSummary';
import { PersonalDetails } from './PersonalDetails';
import { DataBadge } from './DataBadge';
import { GovtDownBanner } from './GovtDownBanner';

interface PoliticianProfileProps {
  profileUrl: string;
  politicianName: string;
  politicianParty: string;
  politicianConstituency: string;
  isCached?: boolean;
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
  'Looking up Wikipedia profile...',
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
  isCached = false,
}) => {
  const [profile, setProfile] = useState<PoliticianProfileData | null>(null);
  const [reports, setReports] = useState<AssociatedReport[]>([]);
  const [profileMeta, setProfileMeta] = useState<DataMeta | null>(null);
  const [reportsMeta, setReportsMeta] = useState<DataMeta | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [profileLoading, setProfileLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [loadStartTime] = useState(Date.now());

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError(null);
        setWarnings([]);
        const result = await getPoliticianProfile(profileUrl, isCached);
        setProfile(result.profile);
        setProfileMeta(result.meta);
        setWarnings(result.warnings);
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [profileUrl, isCached]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setReportsLoading(true);
        setReportsError(null);
        const result = await getAssociatedReports(
          politicianName,
          politicianParty,
          politicianConstituency,
        );
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

  const allLoading = profileLoading && reportsLoading;

  const allWarnings = [...warnings];
  if (reportsError) {
    allWarnings.push('AI-generated audit report could not be loaded.');
  }

  // If live fetch failed and no cached profile, build a minimal profile from props
  // so the page still renders useful content (Wikipedia, reports, etc.)
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

  if (!profileLoading && !displayProfile) {
    // This should never happen now, but keep as safety net
    return (
      <div className="space-y-5 animate-fade-in">
        <GovtDownBanner warnings={['Could not load profile from any source.']} />
      </div>
    );
  }

  const hasAssetData = displayProfile?.assetDeclarations && displayProfile.assetDeclarations.length > 0;
  const isPartialProfile = !profile && !!displayProfile; // Built from props, not from API/cache

  return (
    <div className="space-y-5 animate-fade-in">
      {allLoading && !isCached && <ProgressIndicator startTime={loadStartTime} />}

      {profileMeta && !profileLoading && (
        <DataBadge meta={profileMeta} />
      )}

      {!profileLoading && allWarnings.length > 0 && (
        <GovtDownBanner warnings={allWarnings} />
      )}

      {/* ── Profile Header ──────────────────────────────────────── */}
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
          wikipediaUrl={displayProfile.wikipediaUrl}
        />
      ) : null}

      {/* ── Affidavit unavailable notice ─────────────────────── */}
      {!profileLoading && isPartialProfile && (
        <div className="bg-surface-secondary border border-status-warning/20 p-4 rounded-card flex items-start gap-3">
          <svg className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-text-primary">Affidavit data unavailable</p>
            <p className="text-xs text-text-secondary mt-1">
              Could not fetch detailed affidavit from myneta.info. Showing available information from Wikipedia and AI-generated reports.
            </p>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:text-accent-hover mt-1.5 inline-block"
            >
              Try viewing directly on myneta.info
            </a>
          </div>
        </div>
      )}

      {/* ── Wikipedia Summary (About section) ────────────────── */}
      {!profileLoading && displayProfile && (
        <WikipediaSummary
          politicianName={displayProfile.name}
          constituency={displayProfile.constituency}
        />
      )}

      {/* ── Detailed Affidavit Info ──────────────────────────── */}
      {profileLoading ? (
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

      {/* ── Asset Growth Chart ───────────────────────────────── */}
      {profileLoading ? (
        <ChartSkeleton />
      ) : displayProfile && hasAssetData ? (
        <AssetGrowthChart data={displayProfile.assetDeclarations} />
      ) : displayProfile && !isPartialProfile ? (
        <RtiHelper politicianName={displayProfile.name} constituency={displayProfile.constituency} />
      ) : null}

      {/* ── Criminal Cases ───────────────────────────────────── */}
      {profileLoading ? (
        <TableSkeleton title="criminal cases" />
      ) : displayProfile && !isPartialProfile ? (
        <CriminalCasesTable cases={displayProfile.criminalCases} />
      ) : null}

      {/* ── Associated Audit Reports ─────────────────────────── */}
      {reportsLoading ? (
        <TableSkeleton title="audit report findings" />
      ) : (
        <AssociatedReportsList
          reports={reports}
          error={reportsError}
          meta={reportsMeta}
        />
      )}
    </div>
  );
};
