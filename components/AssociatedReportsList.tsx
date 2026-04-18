import React from 'react';
import type { AssociatedReport, DataMeta } from '../types';
import { SourceLink } from './SourceLink';

interface AssociatedReportsListProps {
  reports: AssociatedReport[];
  error?: string | null;
  meta?: DataMeta | null;
}

export const AssociatedReportsList: React.FC<AssociatedReportsListProps> = ({ reports, error, meta }) => {
  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Associated Report Findings</h3>
          <p className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI-generated illustrative examples — not sourced from actual CAG/CVC reports
          </p>
        </div>
        {meta && (
          <span className={`text-[11px] px-2 py-0.5 rounded-badge font-medium ${
            meta.source === 'live' ? 'bg-status-info/10 text-status-info' : 'bg-status-warning/10 text-status-warning'
          }`}>
            {meta.source === 'live' ? 'AI Generated' : 'Fallback'}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-status-danger/5 border border-status-danger/15 rounded-lg p-3 mb-4">
          <p className="text-sm text-status-danger/80">{error}</p>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-10 h-10 text-surface-border mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-text-secondary text-sm">No associated audit findings available.</p>
          <p className="text-xs text-text-tertiary mt-1">
            Visit <a href="https://cag.gov.in/en/reports-list" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">cag.gov.in</a> for official CAG/CVC audit reports.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, index) => (
            <div key={index} className="border-l-2 border-accent/40 pl-4 hover:bg-surface-tertiary/20 transition-colors rounded-r-lg py-2">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-text-primary text-sm">{report.department_name}</p>
                  {report.loss_amount_rs_crore && report.loss_amount_rs_crore !== 'N/A' && (
                    <p className="text-xs font-medium text-status-danger mt-0.5 font-data">
                      Presumptive Loss: Rs {report.loss_amount_rs_crore} Crore
                    </p>
                  )}
                  {report.loss_amount_rs_crore === 'N/A' && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Loss: Not quantified / Procedural
                    </p>
                  )}
                </div>
                <SourceLink url={report.sourceUrl} text={report.source_report_page} />
              </div>
              <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{report.finding_summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
