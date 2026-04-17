import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface GlobalSearchBarProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onSearch, isSearching = false }) => {
  const [query, setQuery] = useState('');
  const debounceTimeout = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isSearching ? (
          <svg className="w-5 h-5 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <SearchIcon className="h-5 w-5 text-text-tertiary group-focus-within:text-accent transition-colors" />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search any Indian politician by name or constituency..."
        className="w-full pl-12 pr-12 py-3.5 bg-surface-tertiary border border-surface-border rounded-card text-[15px] text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent transition-all"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {query.length === 1 && (
        <p className="absolute -bottom-6 left-0 text-xs text-text-tertiary animate-fade-in">
          Type at least 2 characters to search across election databases
        </p>
      )}
    </div>
  );
};
