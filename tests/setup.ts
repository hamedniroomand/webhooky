import { afterEach } from 'bun:test';

import { resetEventHub } from '@/server/events';
import { resetRateLimits } from '@/server/ratelimit';
import { resetStore } from '@/server/store-instance';

afterEach(() => {
  resetStore();
  resetRateLimits();
  resetEventHub();
});
