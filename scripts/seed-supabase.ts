/**
 * Seed script: loads politician_index.json into Supabase politicians table.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-supabase.ts
 *
 * Or with .env.local vars:
 *   npm run seed
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') });

// ── Config ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Types ────────────────────────────────────────────────────────────────────

interface IndexEntry {
  name: string;
  constituency: string;
  party: string;
  state: string;
  electionType: string;
  election: string;
  profileUrl: string;
  criminalCases: number | null;
  totalAssets: string;
  education: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Seed politicians index ───────────────────────────────────────────────────

async function seedPoliticiansIndex() {
  console.log('Reading politician_index.json...');
  const raw = readFileSync(resolve(__dirname, '../data/politician_index.json'), 'utf-8');
  const entries: IndexEntry[] = JSON.parse(raw);
  console.log(`Found ${entries.length} politicians in index.`);

  const rows = entries.map((e) => ({
    name: e.name,
    constituency: e.constituency,
    party: e.party,
    state: e.state || '',
    election_type: e.electionType || '',
    election: e.election || '',
    profile_url: e.profileUrl,
    criminal_cases: e.criminalCases,
    total_assets: e.totalAssets || '',
    education: e.education || '',
  }));

  const batches = chunk(rows, 500);
  let inserted = 0;

  for (const [i, batch] of batches.entries()) {
    const { error } = await supabase
      .from('politicians')
      .upsert(batch, { onConflict: 'profile_url' });

    if (error) {
      console.error(`Batch ${i + 1}/${batches.length} failed:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Batch ${i + 1}/${batches.length} — ${inserted}/${rows.length} upserted`);
    }
  }

  console.log(`Politicians index seeded: ${inserted} rows.\n`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Project Vigil — Supabase Seed ===\n');
  await seedPoliticiansIndex();
  console.log('=== Done ===');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
