const WEBHOOK_TOKEN_BYTES = 16;
const SESSION_SECRET_BYTES = 24;

function randomUrlSafe(bytes: number): string {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return Buffer.from(raw).toString('base64url').replace(/=/g, '');
}

export function generateWebhookToken(): string {
  return randomUrlSafe(WEBHOOK_TOKEN_BYTES);
}

export function generateSessionSecret(): string {
  return randomUrlSafe(SESSION_SECRET_BYTES);
}

export function generateRowId(): string {
  return crypto.randomUUID();
}
