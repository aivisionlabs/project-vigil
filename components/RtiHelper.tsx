import React, { useState } from 'react';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface RtiHelperProps {
  politicianName: string;
  constituency: string;
}

export const RtiHelper: React.FC<RtiHelperProps> = ({ politicianName, constituency }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const rtiText = `To:
The Public Information Officer (PIO)
Election Commission of India,
Nirvachan Sadan, Ashoka Road,
New Delhi - 110001

Subject: Request for Information under the Right to Information (RTI) Act, 2005

Dear Sir/Madam,

Please provide me with the following information:

1. A certified copy of the latest affidavit (Form 26) filed by the elected representative, ${politicianName}, from the ${constituency} constituency.

This request is made in the public interest for transparency and accountability. I am an Indian citizen and am attaching the required application fee of Rs. 10.

Thank you.

Sincerely,
[Your Name]
[Your Address]
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rtiText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-surface-secondary border border-status-warning/20 p-5 rounded-card">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-status-warning mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-text-primary mb-1">Asset Data Not Available</h3>
          <p className="text-text-secondary text-sm">
            No public asset declaration data found for <span className="text-text-primary">{politicianName}</span>.
            The data may not have been digitized yet.
          </p>
        </div>
      </div>

      <div className="mt-4 bg-surface-primary/60 rounded-lg p-4 border border-surface-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-text-primary text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            RTI Request Template
          </h4>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {expanded && (
          <pre className="whitespace-pre-wrap text-sm text-text-secondary bg-transparent font-sans overflow-x-auto mb-3 animate-fade-in">
            {rtiText}
          </pre>
        )}

        {!expanded && (
          <p className="text-xs text-text-tertiary mb-3">
            Pre-filled RTI request for the election affidavit of {politicianName}.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => { if (!expanded) setExpanded(true); handleCopy(); }}
          className={`flex-1 sm:flex-none px-5 py-2.5 font-semibold text-sm rounded-button transition-all flex items-center justify-center gap-2 ${
            copied
              ? 'bg-status-clean text-text-inverse'
              : 'bg-accent text-text-inverse hover:bg-accent-hover'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Copied!
            </>
          ) : (
            'Copy RTI Request'
          )}
        </button>
        <a
          href="https://rtionline.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none px-5 py-2.5 font-medium text-sm rounded-button transition-all bg-transparent border border-surface-border text-text-secondary hover:bg-surface-tertiary flex items-center justify-center gap-2"
        >
          File at rtionline.gov.in
          <ExternalLinkIcon className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
