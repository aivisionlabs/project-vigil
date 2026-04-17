import React from "react";

interface DisclaimerModalProps {
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-surface-secondary rounded-card shadow-2xl p-8 max-w-lg w-full border border-surface-border animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-text-inverse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            PROJECT <span className="text-accent">VIGIL</span>
          </h2>
        </div>

        <div className="text-text-secondary space-y-4 text-sm leading-relaxed">
          <p>
            This platform aggregates publicly available data from{" "}
            <strong className="text-text-primary">
              Election Commission of India
            </strong>{" "}
            (via myneta.info) and the{" "}
            <strong className="text-text-primary">
              Comptroller and Auditor General (CAG)
            </strong>
            .
          </p>
          <p>
            Data is fetched in{" "}
            <strong className="text-accent">real-time</strong> from public
            election affidavits. Some information may be unavailable if the
            source is temporarily down.
          </p>
          <p>
            This tool is for{" "}
            <strong className="text-text-primary">
              informational purposes only
            </strong>{" "}
            and does not imply guilt, corruption, or conviction.
          </p>
          <div className="bg-surface-primary/60 rounded-lg p-3 border border-surface-border">
            <p className="text-xs text-text-tertiary">
              AI-generated report summaries are clearly labeled and should be
              verified against official sources. This is an independent
              transparency tool.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-accent text-text-inverse font-semibold py-3 px-4 rounded-button hover:bg-accent-hover transition-colors"
        >
          I Understand — Continue
        </button>
      </div>
    </div>
  );
};
