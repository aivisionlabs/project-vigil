import React, { useState } from 'react';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface ProfileHeaderProps {
  name: string;
  photoUrl: string;
  party: string;
  constituency: string;
  education: string;
  age?: string;
  state?: string;
  profileUrl?: string;
  wikipediaUrl?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name, photoUrl, party, constituency, education, age, state, profileUrl, wikipediaUrl,
}) => {
  const [imgError, setImgError] = useState(false);

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e8963e&color=0c0f14&size=200`;

  return (
    <div className="bg-surface-secondary border border-surface-border p-6 rounded-card">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={imgError ? fallbackAvatar : photoUrl}
            alt={name}
            className="w-24 h-24 rounded-full border-2 border-accent/20 object-cover"
            onError={() => setImgError(true)}
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-text-primary">{name}</h2>
          <p className="text-sm text-accent mt-1 font-medium">{party}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-2.5 text-text-secondary text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {constituency}{state ? `, ${state}` : ''}
            </span>
            {age && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Age: {age}
              </span>
            )}
          </div>
          {education && education !== 'Not declared' && (
            <p className="text-xs text-text-tertiary mt-2 flex items-center justify-center md:justify-start gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
              {education}
            </p>
          )}
          {education === 'Not declared' && (
            <p className="text-xs text-text-tertiary/50 mt-2 italic">Education not declared in affidavit</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {wikipediaUrl && (
            <a
              href={wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors bg-surface-primary/60 px-3 py-1.5 rounded-badge border border-surface-border"
              title="View on Wikipedia"
            >
              Wikipedia <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent transition-colors bg-surface-primary/60 px-3 py-1.5 rounded-badge border border-surface-border"
              title="View original source"
            >
              Source <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
