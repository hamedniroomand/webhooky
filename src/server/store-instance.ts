import { config } from '@/server/config';
import { createStore, type Store } from '@/server/store';

let store: Store | undefined;

export function getStore(): Store {
  if (!store) {
    store = createStore(config.dbPath);
  }
  return store;
}

export function resetStore(): void {
  store = undefined;
}
