import { useCallback, useEffect, useRef, useState } from 'react';

import { getRequest, inboxEventsUrl, listRequests } from '@/lib/api';
import type { RequestDetailDto, RequestSummaryDto } from '@/types/api';

export type ConnectionState = 'connected' | 'reconnecting' | 'offline';

const MAX_ROWS = 100;

function mergeRequests(
  current: RequestSummaryDto[],
  incoming: RequestSummaryDto,
): RequestSummaryDto[] {
  const without = current.filter((r) => r.id !== incoming.id);
  return [incoming, ...without].slice(0, MAX_ROWS);
}

export function useRequests(inboxToken: string | null) {
  const [requests, setRequests] = useState<RequestSummaryDto[]>([]);
  const [connection, setConnection] = useState<ConnectionState>('offline');
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequestDetailDto | null>(null);
  const detailSeq = useRef(0);

  useEffect(() => {
    if (!inboxToken) {
      setRequests([]);
      setConnection('offline');
      return;
    }
    let closed = false;
    void listRequests(inboxToken).then((rows) => {
      if (!closed) {
        setRequests(rows.slice(0, MAX_ROWS));
      }
    });

    const source = new EventSource(inboxEventsUrl(inboxToken));
    source.addEventListener('ready', () => {
      if (!closed) {
        setConnection('connected');
      }
    });
    source.addEventListener('keepalive', () => {
      if (!closed) {
        setConnection('connected');
      }
    });
    source.addEventListener('request', (event) => {
      if (closed) {
        return;
      }
      const summary = JSON.parse(event.data) as RequestSummaryDto;
      setRequests((prev) => mergeRequests(prev, summary));
      setNewIds((prev) => new Set(prev).add(summary.id));
      window.setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          next.delete(summary.id);
          return next;
        });
      }, 2000);
      setConnection('connected');
    });
    source.onerror = () => {
      if (!closed) {
        setConnection(source.readyState === EventSource.CONNECTING ? 'reconnecting' : 'offline');
      }
    };

    return () => {
      closed = true;
      source.close();
      setConnection('offline');
    };
  }, [inboxToken]);

  useEffect(() => {
    if (!inboxToken || !selectedId) {
      setDetail(null);
      return;
    }
    const seq = ++detailSeq.current;
    void getRequest(inboxToken, selectedId).then((row) => {
      if (detailSeq.current === seq) {
        setDetail(row);
      }
    });
  }, [inboxToken, selectedId]);

  const clearList = useCallback(() => {
    setRequests([]);
    setSelectedId(null);
    setDetail(null);
  }, []);

  return {
    requests,
    connection,
    newIds,
    selectedId,
    setSelectedId,
    detail,
    clearList,
  };
}
