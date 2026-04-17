import React from 'react';
import type { CriminalCase } from '../types';
import { SourceLink } from './SourceLink';

interface CriminalCasesTableProps {
  cases: CriminalCase[];
}

export const CriminalCasesTable: React.FC<CriminalCasesTableProps> = ({ cases }) => {
  const getStatusColor = (status: CriminalCase['status']) => {
    const s = status.toLowerCase();
    if (s.includes('convicted') || s.includes('chargeframed')) return 'text-status-danger bg-status-danger/10';
    if (s.includes('acquitted') || s.includes('discharged')) return 'text-status-clean bg-status-clean/10';
    if (s.includes('pending') || s.includes('trial')) return 'text-status-warning bg-status-warning/10';
    return 'text-text-tertiary bg-surface-tertiary';
  };

  const pendingCount = cases.filter(c => {
    const s = c.status.toLowerCase();
    return s.includes('pending') || s.includes('trial');
  }).length;

  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Declared Criminal Cases</h3>
          {cases.length > 0 && (
            <p className="text-xs text-text-tertiary mt-0.5">
              <span className="font-data">{cases.length}</span> case{cases.length !== 1 ? 's' : ''} declared
              {pendingCount > 0 && (
                <span className="text-status-warning ml-1 font-data">({pendingCount} pending)</span>
              )}
            </p>
          )}
        </div>
        {cases.length > 0 && <SourceLink url={cases[0].sourceUrl} />}
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-10 h-10 text-status-clean/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-status-clean text-sm font-medium">No declared criminal cases</p>
          <p className="text-xs text-text-tertiary mt-1">
            No cases found in the public election affidavit.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="p-3 text-[11px] font-medium tracking-wider uppercase text-text-tertiary">Section</th>
                <th className="p-3 text-[11px] font-medium tracking-wider uppercase text-text-tertiary">Description</th>
                <th className="p-3 text-[11px] font-medium tracking-wider uppercase text-text-tertiary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {cases.map((caseItem, index) => (
                <tr key={index} className="hover:bg-surface-tertiary/30 transition-colors">
                  <td className="p-3 whitespace-nowrap text-text-primary font-medium text-sm font-data">{caseItem.ipcSection}</td>
                  <td className="p-3 text-text-secondary text-sm">{caseItem.description}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-badge ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
