/**
 * Centralized, typed access to environment configuration plus feature flags.
 * Everything optional except APP_PASSWORD + SESSION_SECRET — the app degrades
 * gracefully when an optional service isn't configured.
 */
export const env = {
  appPassword: process.env.APP_PASSWORD ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // SEC requires a descriptive User-Agent (ideally with a contact email).
  secUserAgent:
    process.env.SEC_USER_AGENT ||
    "Pump/1.0 (personal stock research; admin@pump.app)",
};

/** Which optional features are wired up, based on present env vars. */
export const features = {
  ai: () => env.geminiApiKey.length > 0,
  // History persistence needs a real Postgres connection string (Supabase/Neon).
  db: () => /^postgres(ql)?:\/\//.test(env.databaseUrl),
};
