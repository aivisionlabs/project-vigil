import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface RequestPoliticianProps {
  prefillName?: string;
}

export const RequestPolitician: React.FC<RequestPoliticianProps> = ({ prefillName = '' }) => {
  const [name, setName] = useState(prefillName);
  const [constituency, setConstituency] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [expanded, setExpanded] = useState(!!prefillName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setStatus('submitting');

    if (!isSupabaseConfigured) {
      // No Supabase — just show success (request is "noted")
      setTimeout(() => setStatus('success'), 500);
      return;
    }

    try {
      const { error } = await supabase
        .from('scrape_requests')
        .insert({
          politician_name: name.trim(),
          constituency: constituency.trim() || null,
          state: state.trim() || null,
          status: 'pending',
          requested_at: new Date().toISOString(),
        });

      if (error) throw error;
      setStatus('success');
      setName('');
      setConstituency('');
      setState('');
    } catch (err) {
      console.warn('Failed to submit request:', err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-status-clean/5 border border-status-clean/20 rounded-card p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-status-clean flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-status-clean">Request submitted</p>
            <p className="text-xs text-text-tertiary mt-0.5">
              We'll scrape this politician's data from public records. Check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full text-left bg-surface-secondary/50 border border-dashed border-surface-border rounded-card p-4 hover:border-accent/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
              Can't find your neta?
            </p>
            <p className="text-xs text-text-tertiary">
              Request us to scrape any politician's public data
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-surface-secondary border border-surface-border rounded-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Request a Politician Profile
        </h3>
        {!prefillName && (
          <button onClick={() => setExpanded(false)} className="text-text-tertiary hover:text-text-secondary transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-text-tertiary mb-1 block">Politician Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Rahul Gandhi"
            required
            className="w-full px-3 py-2 bg-surface-tertiary border border-surface-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">Constituency</label>
            <input
              type="text"
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              placeholder="e.g., Amethi"
              className="w-full px-3 py-2 bg-surface-tertiary border border-surface-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs text-text-tertiary mb-1 block">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., Uttar Pradesh"
              className="w-full px-3 py-2 bg-surface-tertiary border border-surface-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-transparent"
            />
          </div>
        </div>

        {status === 'error' && (
          <p className="text-xs text-status-danger">Failed to submit. Please try again.</p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || status === 'submitting'}
          className="w-full py-2.5 bg-accent text-text-inverse font-semibold text-sm rounded-button hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'submitting' ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </>
          ) : (
            'Request Scrape'
          )}
        </button>

        <p className="text-[10px] text-text-tertiary text-center">
          We'll search public election affidavits on myneta.info for this politician's data.
        </p>
      </form>
    </div>
  );
};
