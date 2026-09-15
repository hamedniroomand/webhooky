const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function dbPath(): string {
  return process.env.WEBHOOKY_DB_PATH ?? 'data/webhooky.sqlite';
}

export const config = {
  get dbPath() {
    return dbPath();
  },
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',
  sessionCookieName: 'webhooky_session',
  sessionMaxAgeSeconds: 7 * 24 * 60 * 60,
  inboxLifetimeMs: DAY_MS,
  maxStoredRequests: 100,
  maxBodyBytes: 1024 * 1024,
  serverMaxBodyBytes: 2 * 1024 * 1024,
  rateLimit: {
    ingestionPerMinute: 120,
    inboxCreatePerMinute: 10,
    managementPerMinute: 300,
  },
  sweeperIntervalMs: 5 * 60 * 1000,
} as const;
