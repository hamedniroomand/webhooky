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
  const listSeq = useRef(0);

  useEffect(() => {
    setRequests([]);
    setSelectedId(null);
    setDetail(null);
    setNewIds(new Set());
    if (!inboxToken) {
      setConnection('offline');
      return;
    }
    let closed = false;
    const refresh = () => {
      const seq = ++listSeq.current;
      void listRequests(inboxToken)
        .then((rows) => {
          if (!closed && listSeq.current === seq)
            setRequests((current) => {
              const merged = new Map([...rows, ...current].map((row) => [row.id, row]));
              return [...merged.values()]
                .toSorted((a, b) => b.receivedAt.localeCompare(a.receivedAt))
                .slice(0, MAX_ROWS);
            });
        })
        .catch(() => {
          if (!closed) setConnection('offline');
        });
    };

    refresh();
    const source = new EventSource(inboxEventsUrl(inboxToken));
    source.addEventListener('ready', () => {
      if (!closed) {
        setConnection('connected');
        refresh();
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
    source.addEventListener('error', () => {
      if (!closed) {
        setConnection(source.readyState === EventSource.CONNECTING ? 'reconnecting' : 'offline');
      }
    });

    return () => {
      closed = true;
      source.close();
      setConnection('offline');
    };
  }, [inboxToken]);

  useEffect(() => {
    const seq = ++detailSeq.current;
    setDetail(null);
    if (!inboxToken || !selectedId) return;
    void getRequest(inboxToken, selectedId)
      .then((row) => {
        if (detailSeq.current === seq) setDetail(row);
      })
      .catch(() => {
        if (detailSeq.current === seq) setSelectedId(null);
      });
    return () => {
      detailSeq.current++;
    };
  }, [inboxToken, selectedId]);

  const clearList = useCallback(() => {
    listSeq.current++;
    detailSeq.current++;
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
