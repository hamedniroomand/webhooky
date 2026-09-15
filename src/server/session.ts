import { config } from '@/server/config';
import { getStore } from '@/server/store-instance';
import type { ManagementSession } from '@/server/types';

function isSecureRequest(req: Request): boolean {
  if (new URL(req.url).protocol === 'https:') {
    return true;
  }
  return process.env.NODE_ENV === 'production';
}

export function buildSessionCookie(secret: string, req: Request): string {
  const parts = [
    `${config.sessionCookieName}=${encodeURIComponent(secret)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${config.sessionMaxAgeSeconds}`,
  ];
  if (isSecureRequest(req)) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function readSessionSecret(req: Request): string | null {
  const raw = req.headers.get('cookie');
  if (!raw) {
    return null;
  }
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const name = trimmed.slice(0, eq);
    if (name !== config.sessionCookieName) {
      continue;
    }
    const value = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }
  return null;
}

export function resolveSession(req: Request): ManagementSession | null {
  const secret = readSessionSecret(req);
  if (!secret) {
    return null;
  }
  const session = getStore().getSessionBySecret(secret);
  if (!session) {
    return null;
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  getStore().touchSession(session.id);
  return session;
}

export function createSession(req: Request): {
  session: ManagementSession;
  setCookie: string;
} {
  const session = getStore().createSession();
  return {
    session,
    setCookie: buildSessionCookie(session.secret, req),
  };
}
