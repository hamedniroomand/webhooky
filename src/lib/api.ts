import type {
  InboxDto,
  RequestDetailDto,
  RequestSummaryDto,
  SessionBootstrapDto,
} from '@/types/api';
import type { ApiErrorBody } from '@/types/api';

export class ApiClientError extends Error {
  code: ApiErrorBody['error']['code'];
  status: number;
  retryAfterSeconds?: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.error.code;
    this.retryAfterSeconds = body.error.retryAfterSeconds;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json()) as ApiErrorBody;
    throw new ApiClientError(res.status, body);
  }
  return parseJson<T>(res);
}

export function getSession(): Promise<SessionBootstrapDto> {
  return request<SessionBootstrapDto>('/api/session');
}

export function createInbox(): Promise<InboxDto> {
  return request<InboxDto>('/api/inbox', { method: 'POST' });
}

export function listRequests(inboxToken: string): Promise<RequestSummaryDto[]> {
  return request<RequestSummaryDto[]>(`/api/inbox/${encodeURIComponent(inboxToken)}/requests`);
}

export function getRequest(inboxToken: string, requestId: string): Promise<RequestDetailDto> {
  return request<RequestDetailDto>(
    `/api/inbox/${encodeURIComponent(inboxToken)}/requests/${encodeURIComponent(requestId)}`,
  );
}

export function clearRequests(inboxToken: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/inbox/${encodeURIComponent(inboxToken)}/requests`, {
    method: 'DELETE',
  });
}

export function deleteInbox(inboxToken: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/api/inbox/${encodeURIComponent(inboxToken)}`, {
    method: 'DELETE',
  });
}

export function inboxEventsUrl(inboxToken: string): string {
  return `/api/inbox/${encodeURIComponent(inboxToken)}/events`;
}
