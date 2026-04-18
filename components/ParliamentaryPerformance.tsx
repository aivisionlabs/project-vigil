import React from 'react';
import type { ParliamentaryPerformance as PerfData } from '../types';

interface ParliamentaryPerformanceProps {
  data: PerfData;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}> = ({ label, value, subtitle, icon }) => (
  <div className="bg-surface-primary border border-surface-border rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-accent">{icon}</span>
      <span className="text-xs text-text-tertiary uppercase tracking-wider font-medium">{label}</span>
    </div>
    <p className="text-2xl font-bold font-data text-text-primary">{value}</p>
    {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
  </div>
);

const AttendanceBar: React.FC<{
  label: string;
  percentage: number;
  color: string;
}> = ({ label, percentage, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-text-secondary w-28 flex-shrink-0">{label}</span>
    <div className="flex-1 bg-surface-primary rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
    <span className="text-xs font-data text-text-primary w-12 text-right">{percentage}%</span>
  </div>
);

export const ParliamentaryPerformance: React.FC<ParliamentaryPerformanceProps> = ({ data }) => {
  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
          </svg>
          Parliamentary Performance
        </h3>
        <span className="text-xs text-text-tertiary bg-surface-primary px-2 py-1 rounded">
          {data.term}
        </span>
      </div>

      {/* Attendance section */}
      {data.attendance && (
        <div className="mb-5 space-y-2.5">
          <AttendanceBar
            label="This MP"
            percentage={data.attendance.percentage}
            color={data.attendance.percentage >= data.attendance.nationalAverage ? 'bg-status-success' : 'bg-status-warning'}
          />
          {data.attendance.nationalAverage > 0 && (
            <AttendanceBar
              label="National Avg"
              percentage={data.attendance.nationalAverage}
              color="bg-text-tertiary/40"
            />
          )}
          {data.attendance.stateAverage > 0 && (
            <AttendanceBar
              label="State Avg"
              percentage={data.attendance.stateAverage}
              color="bg-text-tertiary/30"
            />
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.questionsAsked !== null && (
          <StatCard
            label="Questions"
            value={data.questionsAsked}
            subtitle="Asked in Parliament"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            }
          />
        )}

        {data.debatesParticipated !== null && (
          <StatCard
            label="Debates"
            value={data.debatesParticipated}
            subtitle="Participated in"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            }
          />
        )}

        {data.billsIntroduced !== null && (
          <StatCard
            label="Bills"
            value={data.billsIntroduced}
            subtitle="Introduced"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
          />
        )}
      </div>

      {/* Source attribution */}
      <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          Source: PRS Legislative Research
        </p>
        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline"
        >
          View on PRS India
        </a>
      </div>
    </div>
  );
};
