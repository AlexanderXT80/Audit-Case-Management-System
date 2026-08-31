#!/usr/bin/env node
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL present:', !!SUPABASE_URL, 'SUPABASE_SERVICE_ROLE present:', !!SUPABASE_SERVICE_ROLE);
console.log('SUPABASE_SERVICE_ROLE length:', SUPABASE_SERVICE_ROLE ? SUPABASE_SERVICE_ROLE.length : 0);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables. Create a .env file with these keys at the repo root.');
  process.exitCode = 1;
  process.exit();
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

async function insertRows(table: string, rows: any[] | Record<string, any>) {
  if (!rows) return;
  const arr = Array.isArray(rows) ? rows : [rows];
  const chunkSize = 50;
    
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
    const tryUpsert = async (tableName: string, chunk: any[]) => {
      const maxRetries = 5;
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const { error } = await supabase.from(tableName).upsert(chunk);
          if (!error) return { ok: true };
          // Treat some errors as non-retriable
          if (error.code && typeof error.code === 'string' && error.code.startsWith('42501')) {
            // RLS error - do not retry
            return { ok: false, error };
          }
          // otherwise, log and retry
          console.warn(`Upsert attempt ${attempt + 1} for ${tableName} failed:`, error.message || error);
        } catch (e: any) {
          console.warn(`Upsert attempt ${attempt + 1} for ${tableName} threw:`, e?.message || e);
        }
        attempt++;
        const backoff = Math.min(2000 * Math.pow(2, attempt), 20000);
        await sleep(backoff);
      }
      return { ok: false, error: { message: 'Max retries reached' } };
    };
  for (let i = 0; i < arr.length; i += chunkSize) {
    let chunk = arr.slice(i, i + chunkSize);
    // Convert keys from camelCase to snake_case to match typical DB column naming
    const toSnake = (s: string) => s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const convertKeys = (input: any): any => {
      if (input === null || input === undefined) return input;
      if (Array.isArray(input)) return input.map(convertKeys);
      if (typeof input === 'object') {
        const out: any = {};
        for (const k of Object.keys(input)) {
          const nk = toSnake(k);
          out[nk] = convertKeys(input[k]);
        }
        return out;
      }
      return input;
    };
    chunk = chunk.map(convertKeys);
      try {
      // Use snake_case table name as well if backend uses that convention
      const tableName = table.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      // Diagnostic: attempt a simple select to verify connectivity and schema
      try {
        const sel = await supabase.from(tableName).select('*').limit(1);
        if (sel.error) {
          console.error(`Select diagnostic error on ${tableName}:`, sel.error);
        } else {
          console.log(`Select diagnostic OK for ${tableName}`);
        }
      } catch (e) {
        console.error(`Select diagnostic threw for ${tableName}:`, e);
      }
      const result = await tryUpsert(tableName, chunk as any[]);
      if (!result.ok) {
        console.error(`Error inserting into ${table}:`);
        console.dir(result.error, { depth: null });
        return false;
      }
      console.log(`Upserted ${chunk.length} rows into ${table}`);
    } catch (e: any) {
      console.error(`Unexpected error inserting into ${table}:`, e?.message || e);
      return false;
    }
  }
  return true;
}

async function main() {
  const raw = await readFile(new URL('../db.json', import.meta.url), 'utf-8');
  const db = JSON.parse(raw);

  const order = [
    'users',
    'taxpayers',
    'riskAssessments',
    'auditCases',
    'caseStageHistory',
    'documentRequests',
    'evidenceDocuments',
    'findings',
    'assessments',
    'approvals',
    'appeals',
    'auditLog',
    'systemConfig'
  ];

  for (const table of order) {
    if (db[table]) {
      console.log(`Seeding table ${table}...`);
      const ok = await insertRows(table, db[table]);
      if (!ok) {
        console.error(`Seeding aborted due to error inserting into ${table}.`);
        process.exitCode = 1;
        // allow handles to close cleanly
        setImmediate(() => process.exit(1));
        return;
      }
    }
  }

  console.log('Seeding complete.');
  process.exitCode = 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
