import React from 'react';

interface GovtDownBannerProps {
  warnings: string[];
}

export const GovtDownBanner: React.FC<GovtDownBannerProps> = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-status-warning/5 border border-status-warning/15 rounded-card p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <svg
          className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-status-warning/90 font-medium">
            Some data sections couldn't load
          </p>
          <ul className="mt-1.5 space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-text-tertiary flex items-start gap-1.5">
                <span className="text-status-warning/40 mt-0.5">&#8226;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
