export type InboxStatusDto = 'active' | 'expired' | 'deleted';

export type InboxDto = {
  token: string;
  webhookUrl: string;
  expiresAt: string;
  status: InboxStatusDto;
  requestCount: number;
};

export type RequestSummaryDto = {
  id: string;
  method: string;
  path: string;
  receivedAt: string;
  contentType: string | null;
  bodySize: number;
  oversized: boolean;
};

export type PairDto = [string, string];

export type RequestDetailDto = RequestSummaryDto & {
  query: PairDto[];
  headers: PairDto[];
  body: string | null;
  bodyTruncated: boolean;
};

export type SessionBootstrapDto = {
  inbox: InboxDto | null;
  inboxAbsentReason: 'none' | 'expired' | 'deleted' | null;
};

export type ApiErrorCode =
  | 'NO_SESSION'
  | 'NOT_OWNER'
  | 'INBOX_NOT_FOUND'
  | 'INBOX_EXPIRED'
  | 'INBOX_DELETED'
  | 'REQUEST_NOT_FOUND'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'NOT_IMPLEMENTED';

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    retryAfterSeconds?: number;
  };
};
