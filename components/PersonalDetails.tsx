import React from 'react';

interface PersonalDetailsProps {
  name: string;
  party: string;
  constituency: string;
  state?: string;
  education: string;
  age?: string;
  additionalInfo?: {
    selfProfession: string;
    spouseProfession: string;
    panGiven: string;
  };
  profileUrl: string;
  totalAssets?: number;
  totalLiabilities?: number;
  criminalCaseCount: number;
}

const DetailRow: React.FC<{ label: string; value: string; icon: React.ReactNode; highlight?: 'danger' | 'clean' | 'warning' }> = ({
  label, value, icon, highlight,
}) => {
  const highlightClass = highlight === 'danger' ? 'text-status-danger'
    : highlight === 'clean' ? 'text-status-clean'
    : highlight === 'warning' ? 'text-status-warning'
    : 'text-text-primary';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-surface-border/50 last:border-b-0">
      <span className="text-text-tertiary mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-tertiary uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${highlightClass}`}>{value}</p>
      </div>
    </div>
  );
};

function formatCurrency(amount: number): string {
  if (amount >= 1_00_00_000) {
    return `Rs ${(amount / 1_00_00_000).toFixed(2)} Cr`;
  }
  if (amount >= 1_00_000) {
    return `Rs ${(amount / 1_00_000).toFixed(2)} Lakh`;
  }
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  name, party, constituency, state, education, age, additionalInfo, profileUrl,
  totalAssets, totalLiabilities, criminalCaseCount,
}) => {
  return (
    <div className="bg-surface-secondary border border-surface-border p-5 rounded-card">
      <h3 className="text-lg font-semibold text-text-primary mb-1">Affidavit Details</h3>
      <p className="text-[11px] text-text-tertiary mb-4">Self-declared information from election affidavit</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
        <div>
          <DetailRow
            label="Full Name"
            value={name}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>}
          />
          <DetailRow
            label="Political Party"
            value={party}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>}
          />
          <DetailRow
            label="Constituency"
            value={`${constituency}${state ? `, ${state}` : ''}`}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>}
          />
          {age && (
            <DetailRow
              label="Age"
              value={`${age} years`}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
            />
          )}
          <DetailRow
            label="Education"
            value={education || 'Not declared'}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>}
          />
        </div>

        <div>
          {additionalInfo?.selfProfession && (
            <DetailRow
              label="Profession (Self)"
              value={additionalInfo.selfProfession}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>}
            />
          )}
          {additionalInfo?.spouseProfession && (
            <DetailRow
              label="Profession (Spouse)"
              value={additionalInfo.spouseProfession}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
            />
          )}
          {additionalInfo?.panGiven && (
            <DetailRow
              label="PAN Card Given"
              value={additionalInfo.panGiven}
              highlight={additionalInfo.panGiven.toLowerCase() === 'yes' ? 'clean' : 'warning'}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>}
            />
          )}
          {totalAssets !== undefined && totalAssets > 0 && (
            <DetailRow
              label="Declared Total Assets"
              value={formatCurrency(totalAssets)}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          )}
          {totalLiabilities !== undefined && totalLiabilities > 0 && (
            <DetailRow
              label="Declared Liabilities"
              value={formatCurrency(totalLiabilities)}
              highlight="warning"
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>}
            />
          )}
          <DetailRow
            label="Criminal Cases"
            value={criminalCaseCount > 0 ? `${criminalCaseCount} case${criminalCaseCount !== 1 ? 's' : ''} declared` : 'No cases declared'}
            highlight={criminalCaseCount > 0 ? 'danger' : 'clean'}
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-surface-border/50">
        <p className="text-[11px] text-text-tertiary">
          Data sourced from self-sworn election affidavit filed with the Election Commission of India.{' '}
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
            View original affidavit
          </a>
        </p>
      </div>
    </div>
  );
};
