export type Pair = [name: string, value: string];

export type InboxStatus = 'active' | 'expired' | 'deleted';

export type ManagementSession = {
  id: string;
  secret: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
};

export type Inbox = {
  id: string;
  publicToken: string;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  status: InboxStatus;
};

export type CapturedRequest = {
  id: string;
  inboxId: string;
  method: string;
  path: string;
  query: Pair[];
  headers: Pair[];
  contentType: string | null;
  body: string | null;
  bodySize: number;
  oversized: boolean;
  receivedAt: Date;
};

export type { ApiErrorBody, ApiErrorCode } from '@/types/api';
