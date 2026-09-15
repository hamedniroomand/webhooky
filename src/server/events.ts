import type { RequestSummaryDto } from '@/types/api';

type Subscriber = {
  send: (event: string, data: unknown) => void;
};

const subscribersByInbox = new Map<string, Set<Subscriber>>();

export function subscribe(inboxId: string, send: Subscriber['send']): () => void {
  const sub: Subscriber = { send };
  let set = subscribersByInbox.get(inboxId);
  if (!set) {
    set = new Set();
    subscribersByInbox.set(inboxId, set);
  }
  set.add(sub);
  return () => {
    set?.delete(sub);
    if (set?.size === 0) {
      subscribersByInbox.delete(inboxId);
    }
  };
}

export function publishNewRequest(inboxId: string, summary: RequestSummaryDto): void {
  const set = subscribersByInbox.get(inboxId);
  if (!set) {
    return;
  }
  for (const sub of set) {
    try {
      sub.send('request', summary);
    } catch {
      set.delete(sub);
    }
  }
}

export function resetEventHub(): void {
  subscribersByInbox.clear();
}
