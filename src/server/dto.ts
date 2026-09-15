import { config } from '@/server/config';
import type { CapturedRequest, Inbox } from '@/server/types';
import type {
  InboxDto,
  RequestDetailDto,
  RequestSummaryDto,
  SessionBootstrapDto,
} from '@/types/api';

export function inboxToDto(inbox: Inbox, requestCount: number): InboxDto {
  const base = config.publicBaseUrl.replace(/\/$/, '');
  return {
    token: inbox.publicToken,
    webhookUrl: `${base}/h/${inbox.publicToken}`,
    expiresAt: inbox.expiresAt.toISOString(),
    status: inbox.status,
    requestCount,
  };
}

export function requestToSummary(row: CapturedRequest): RequestSummaryDto {
  return {
    id: row.id,
    method: row.method,
    path: row.path,
    receivedAt: row.receivedAt.toISOString(),
    contentType: row.contentType,
    bodySize: row.bodySize,
    oversized: row.oversized,
  };
}

export function requestToDetail(row: CapturedRequest): RequestDetailDto {
  return {
    ...requestToSummary(row),
    query: row.query,
    headers: row.headers,
    body: row.body,
    bodyTruncated: false,
  };
}

export function sessionBootstrap(
  inbox: Inbox | null,
  absentReason: SessionBootstrapDto['inboxAbsentReason'],
): SessionBootstrapDto {
  return {
    inbox: inbox ? inboxToDto(inbox, 0) : null,
    inboxAbsentReason: absentReason,
  };
}
