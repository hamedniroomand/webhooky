import { config } from '@/server/config';
import { requestToSummary } from '@/server/dto';
import { publishNewRequest } from '@/server/events';
import { apiError, jsonResponse } from '@/server/http';
import { materializeInbox } from '@/server/lifecycle';
import { checkRateLimit } from '@/server/ratelimit';
import { getStore } from '@/server/store-instance';
import type { Pair } from '@/server/types';

function capturePath(req: Request, token: string): string {
  const url = new URL(req.url);
  const prefix = `/h/${token}`;
  if (url.pathname === prefix || url.pathname === `${prefix}/`) {
    return '/';
  }
  return url.pathname.slice(prefix.length) || '/';
}

function queryPairs(req: Request): Pair[] {
  const url = new URL(req.url);
  return [...url.searchParams.entries()];
}

const STRIPPED_HEADERS = new Set([
  'x-forwarded-for',
  'x-real-ip',
  'cf-connecting-ip',
  'true-client-ip',
  'forwarded',
]);

function headerPairs(req: Request): Pair[] {
  const pairs: Pair[] = [];
  req.headers.forEach((value, name) => {
    if (STRIPPED_HEADERS.has(name.toLowerCase())) {
      return;
    }
    pairs.push([name, value]);
  });
  return pairs;
}

async function readBody(req: Request): Promise<{
  body: string | null;
  bodySize: number;
  oversized: boolean;
}> {
  const declared = req.headers.get('content-length');
  if (declared) {
    const length = Number(declared);
    if (Number.isFinite(length) && length > config.maxBodyBytes) {
      return { body: null, bodySize: length, oversized: true };
    }
  }

  const reader = req.body?.getReader();
  if (!reader) {
    return { body: null, bodySize: 0, oversized: false };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }
    total += value.byteLength;
    if (total > config.maxBodyBytes) {
      await reader.cancel();
      return { body: null, bodySize: total, oversized: true };
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = new TextDecoder('utf-8', { fatal: false }).decode(merged);
  return { body: text, bodySize: total, oversized: false };
}

export async function handleCapture(req: Request, token: string): Promise<Response> {
  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return new Response(null, { status: req.method === 'HEAD' ? 200 : 204 });
  }

  const allowed = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  if (!allowed.has(req.method)) {
    return apiError('BAD_REQUEST', 'Method not allowed.');
  }

  const stored = getStore().getInboxByToken(token);
  if (!stored) {
    return apiError('INBOX_NOT_FOUND', 'This webhook inbox does not exist.');
  }
  if (stored.status === 'deleted') {
    return apiError('INBOX_DELETED', 'This webhook inbox is no longer available.');
  }
  const inbox = materializeInbox(stored);
  if (!inbox) {
    return apiError('INBOX_EXPIRED', 'This webhook inbox has expired.');
  }

  const rate = checkRateLimit(`capture:${token}`, config.rateLimit.ingestionPerMinute, 60_000);
  if (!rate.allowed) {
    return apiError('RATE_LIMITED', 'Too many requests.', {
      retryAfterSeconds: rate.retryAfterSeconds,
    });
  }

  const { body, bodySize, oversized } = await readBody(req);

  const row = getStore().insertRequest(inbox.id, {
    method: req.method,
    path: capturePath(req, token),
    query: queryPairs(req),
    headers: headerPairs(req),
    contentType: req.headers.get('content-type'),
    body: oversized ? null : body,
    bodySize,
    oversized,
  });

  publishNewRequest(inbox.id, requestToSummary(row));

  if (oversized) {
    return apiError('PAYLOAD_TOO_LARGE', 'Payload exceeded 1 MB limit.');
  }

  return jsonResponse({ ok: true });
}
