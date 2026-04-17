import React from 'react';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface SourceLinkProps {
  url: string;
  text?: string;
}

export const SourceLink: React.FC<SourceLinkProps> = ({ url, text = "Source" }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-text-tertiary hover:text-accent transition-colors flex items-center gap-1 whitespace-nowrap"
    >
      <span>{text}</span>
      <ExternalLinkIcon className="w-3 h-3" />
    </a>
  );
};
