import postgres from "postgres";
import { env, features } from "@/lib/env";
import type { StockBriefing } from "@/lib/types";

/**
 * Lookup history storage.
 * - With a Postgres DATABASE_URL (Supabase/Neon) → persists across deploys.
 * - Without it (or on DB error) → in-memory (works in dev; resets on restart).
 */

export interface LookupRecord {
  id: string;
  symbol: string;
  createdAt: string; // ISO
  briefing: StockBriefing;
}

const MAX_MEM = 200;

// Stored on globalThis so they're shared across route entrypoints and survive
// HMR in dev (module-level singletons aren't reliably shared in Next.js).
const g = globalThis as unknown as {
  __jpLookups?: LookupRecord[];
  __jpSql?: ReturnType<typeof postgres>;
  __jpSchemaReady?: boolean;
};
g.__jpLookups ??= [];
const memStore = g.__jpLookups;

function sqlClient() {
  if (!g.__jpSql) {
    // prepare:false → compatible with Supabase's transaction pooler.
    // ssl:"require" → encrypt without strict CA verification (also avoids the
    // local TLS-inspection proxy tripping cert checks).
    g.__jpSql = postgres(env.databaseUrl, {
      prepare: false, // compatible with Supabase transaction pooler
      ssl: "require",
      connect_timeout: 10, // fail fast instead of hanging a page render
      idle_timeout: 20,
      max: 3,
    });
  }
  return g.__jpSql;
}

async function ensureSchema(sql: ReturnType<typeof sqlClient>) {
  if (g.__jpSchemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS lookups (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      briefing JSONB NOT NULL
    )
  `;
  g.__jpSchemaReady = true;
}

type Row = { id: string; symbol: string; created_at: string | Date; briefing: StockBriefing };

function rememberInMemory(record: LookupRecord) {
  memStore.unshift(record);
  if (memStore.length > MAX_MEM) memStore.length = MAX_MEM;
}

export async function saveLookup(briefing: StockBriefing): Promise<void> {
  const record: LookupRecord = {
    id: crypto.randomUUID(),
    symbol: briefing.symbol,
    createdAt: briefing.generatedAt,
    briefing,
  };

  if (!features.db()) {
    rememberInMemory(record);
    return;
  }

  try {
    const sql = sqlClient();
    await ensureSchema(sql);
    await sql`
      INSERT INTO lookups (id, symbol, created_at, briefing)
      VALUES (${record.id}, ${record.symbol}, ${record.createdAt}, ${sql.json(briefing as never)})
    `;
  } catch {
    rememberInMemory(record); // never lose a lookup over a DB hiccup
  }
}

export async function getRecentLookups(limit = 60): Promise<LookupRecord[]> {
  if (!features.db()) return memStore.slice(0, limit);
  try {
    const sql = sqlClient();
    await ensureSchema(sql);
    const rows = (await sql`
      SELECT id, symbol, created_at, briefing
      FROM lookups ORDER BY created_at DESC LIMIT ${limit}
    `) as unknown as Row[];
    return rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      createdAt: new Date(r.created_at).toISOString(),
      briefing: r.briefing,
    }));
  } catch {
    return memStore.slice(0, limit);
  }
}

export async function getLookupById(id: string): Promise<LookupRecord | null> {
  if (!features.db()) return memStore.find((r) => r.id === id) ?? null;
  try {
    const sql = sqlClient();
    await ensureSchema(sql);
    const rows = (await sql`
      SELECT id, symbol, created_at, briefing FROM lookups WHERE id = ${id} LIMIT 1
    `) as unknown as Row[];
    if (rows.length === 0) return memStore.find((r) => r.id === id) ?? null;
    const r = rows[0];
    return {
      id: r.id,
      symbol: r.symbol,
      createdAt: new Date(r.created_at).toISOString(),
      briefing: r.briefing,
    };
  } catch {
    return memStore.find((r) => r.id === id) ?? null;
  }
}
