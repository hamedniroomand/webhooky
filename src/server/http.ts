import type { ApiErrorBody, ApiErrorCode } from '@/server/types';

const statusByCode: Record<ApiErrorCode, number> = {
  NO_SESSION: 401,
  NOT_OWNER: 404,
  INBOX_NOT_FOUND: 404,
  INBOX_EXPIRED: 410,
  INBOX_DELETED: 410,
  REQUEST_NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  BAD_REQUEST: 400,
  NOT_IMPLEMENTED: 501,
};

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  extra?: Pick<ApiErrorBody['error'], 'retryAfterSeconds'>,
): Response {
  const body: ApiErrorBody = { error: { code, message, ...extra } };
  return jsonResponse(body, { status: statusByCode[code] });
}

export function noStore(init: ResponseInit = {}): Headers {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-store');
  return headers;
}
