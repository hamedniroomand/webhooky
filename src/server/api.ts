import { authorizeInbox, lookupInboxByToken } from '@/server/auth';
import { config } from '@/server/config';
import { inboxToDto, requestToDetail, requestToSummary } from '@/server/dto';
import { subscribe } from '@/server/events';
import { jsonResponse, noStore } from '@/server/http';
import { materializeInbox, purgeSessionIfExpired } from '@/server/lifecycle';
import { checkRateLimit } from '@/server/ratelimit';
import { createSession, readSessionSecret, resolveSession } from '@/server/session';
import { getStore } from '@/server/store-instance';
import type { Inbox } from '@/server/types';
import type { SessionBootstrapDto } from '@/types/api';

function withSessionCookie(res: Response, setCookie: string | null): Response {
  if (!setCookie) {
    return res;
  }
  const headers = new Headers(res.headers);
  headers.append('Set-Cookie', setCookie);
  return new Response(res.body, { status: res.status, headers });
}

function managementJson(body: unknown, init: ResponseInit = {}): Response {
  return jsonResponse(body, {
    ...init,
    headers: noStore(init),
  });
}

function authError(reason: string): Response {
  if (reason === 'NO_SESSION') {
    return managementJson(
      { error: { code: 'NO_SESSION', message: 'Session required.' } },
      { status: 401 },
    );
  }
  if (reason === 'INBOX_EXPIRED') {
    return managementJson(
      {
        error: {
          code: 'INBOX_EXPIRED',
          message: 'This webhook inbox has expired.',
        },
      },
      { status: 410 },
    );
  }
  if (reason === 'NOT_OWNER') {
    return managementJson(
      {
        error: {
          code: 'INBOX_NOT_FOUND',
          message: 'This webhook inbox does not exist.',
        },
      },
      { status: 404 },
    );
  }
  if (reason === 'INBOX_DELETED') {
    return managementJson(
      {
        error: {
          code: 'INBOX_DELETED',
          message: 'This webhook inbox is no longer available.',
        },
      },
      { status: 410 },
    );
  }
  return managementJson(
    {
      error: {
        code: 'INBOX_NOT_FOUND',
        message: 'This webhook inbox does not exist.',
      },
    },
    { status: 404 },
  );
}

function activeInbox(sessionId: string): Inbox | null {
  return materializeInbox(getStore().getActiveInboxForSession(sessionId));
}

function requestCount(inboxId: string): number {
  return getStore().listRequests(inboxId).length;
}

function inferAbsentReason(sessionId: string): SessionBootstrapDto['inboxAbsentReason'] {
  const history = getStore().listInboxesForSession(sessionId);
  const latest = history[0];
  if (!latest) {
    return 'none';
  }
  if (latest.status === 'deleted') {
    return 'deleted';
  }
  if (latest.status === 'expired' || latest.expiresAt.getTime() <= Date.now()) {
    return 'expired';
  }
  return 'none';
}

function parseApiPath(pathname: string): {
  kind: 'session' | 'inbox-create' | 'requests' | 'request' | 'inbox-delete' | 'events' | 'unknown';
  token?: string;
  requestId?: string;
} {
  const parts = pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean);
  if (parts.length === 1 && parts[0] === 'session') {
    return { kind: 'session' };
  }
  if (parts.length === 1 && parts[0] === 'inbox') {
    return { kind: 'inbox-create' };
  }
  if (parts.length === 3 && parts[0] === 'inbox' && parts[2] === 'requests') {
    return { kind: 'requests', token: decodeURIComponent(parts[1] ?? '') };
  }
  if (parts.length === 3 && parts[0] === 'inbox' && parts[2] === 'events') {
    return { kind: 'events', token: decodeURIComponent(parts[1] ?? '') };
  }
  if (parts.length === 4 && parts[0] === 'inbox' && parts[2] === 'requests') {
    return {
      kind: 'request',
      token: decodeURIComponent(parts[1] ?? ''),
      requestId: decodeURIComponent(parts[3] ?? ''),
    };
  }
  if (parts.length === 2 && parts[0] === 'inbox') {
    return { kind: 'inbox-delete', token: decodeURIComponent(parts[1] ?? '') };
  }
  return { kind: 'unknown' };
}

export async function handleApi(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const route = parseApiPath(url.pathname);
  let session = purgeSessionIfExpired(resolveSession(req));
  let setCookie: string | null = null;

  if (!session && route.kind === 'session' && req.method === 'GET') {
    const created = createSession(req);
    session = created.session;
    setCookie = created.setCookie;
  }

  if (route.kind === 'session' && req.method === 'GET') {
    const inbox = session ? activeInbox(session.id) : null;
    const payload: SessionBootstrapDto = {
      inbox: inbox ? inboxToDto(inbox, requestCount(inbox.id)) : null,
      inboxAbsentReason: inbox ? null : session ? inferAbsentReason(session.id) : 'none',
    };
    return withSessionCookie(managementJson(payload), setCookie);
  }

  if (route.kind === 'inbox-create' && req.method === 'POST') {
    if (!session) {
      const created = createSession(req);
      session = created.session;
      setCookie = created.setCookie;
    }
    const rate = checkRateLimit(
      `inbox:${session.id}`,
      config.rateLimit.inboxCreatePerMinute,
      60_000,
    );
    if (!rate.allowed) {
      return withSessionCookie(
        managementJson(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many inbox creations.',
              retryAfterSeconds: rate.retryAfterSeconds,
            },
          },
          { status: 429 },
        ),
        setCookie,
      );
    }
    const inbox = getStore().createInbox(session.id);
    return withSessionCookie(managementJson(inboxToDto(inbox, 0)), setCookie);
  }

  if (!session) {
    return authError('NO_SESSION');
  }

  if (route.kind === 'events' && req.method === 'GET' && route.token) {
    const inbox = lookupInboxByToken(route.token);
    const auth = authorizeInbox(session, inbox);
    if (!auth.ok) {
      return authError(auth.reason);
    }
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const write = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        write('ready', { ok: true });
        const unsubscribe = subscribe(auth.inbox.id, write);
        const keepalive = setInterval(() => write('keepalive', {}), 15_000);
        req.signal.addEventListener('abort', () => {
          clearInterval(keepalive);
          unsubscribe();
          controller.close();
        });
      },
    });
    return new Response(stream, {
      headers: {
        ...Object.fromEntries(noStore().entries()),
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  if (route.kind === 'requests' && req.method === 'GET' && route.token) {
    const inbox = lookupInboxByToken(route.token);
    const auth = authorizeInbox(session, inbox);
    if (!auth.ok) {
      return authError(auth.reason);
    }
    const rows = getStore().listRequests(auth.inbox.id).map(requestToSummary);
    return managementJson(rows);
  }

  if (route.kind === 'request' && req.method === 'GET' && route.token && route.requestId) {
    const inbox = lookupInboxByToken(route.token);
    const auth = authorizeInbox(session, inbox);
    if (!auth.ok) {
      return authError(auth.reason);
    }
    const row = getStore().getRequest(auth.inbox.id, route.requestId);
    if (!row) {
      return managementJson(
        {
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Request not found.',
          },
        },
        { status: 404 },
      );
    }
    return managementJson(requestToDetail(row));
  }

  if (route.kind === 'requests' && req.method === 'DELETE' && route.token) {
    const inbox = lookupInboxByToken(route.token);
    const auth = authorizeInbox(session, inbox);
    if (!auth.ok) {
      return authError(auth.reason);
    }
    getStore().clearRequests(auth.inbox.id);
    return managementJson({ ok: true });
  }

  if (route.kind === 'inbox-delete' && req.method === 'DELETE' && route.token) {
    const inbox = lookupInboxByToken(route.token);
    const auth = authorizeInbox(session, inbox);
    if (!auth.ok) {
      return authError(auth.reason);
    }
    getStore().markInboxDeleted(auth.inbox.id);
    return managementJson({ ok: true });
  }

  return managementJson(
    { error: { code: 'BAD_REQUEST', message: 'Unknown endpoint.' } },
    { status: 400 },
  );
}

export function sessionSecretFromRequest(req: Request): string | null {
  return readSessionSecret(req);
}
