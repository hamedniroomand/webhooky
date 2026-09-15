import { expect, test } from 'bun:test';

import { formatRawRequest } from '@/lib/raw';
import type { RequestDetailDto } from '@/types/api';

const detail: RequestDetailDto = {
  id: 'r1',
  method: 'POST',
  path: '/orders',
  receivedAt: new Date().toISOString(),
  contentType: 'application/json',
  bodySize: 2,
  oversized: false,
  query: [
    ['source', 'a'],
    ['source', 'b'],
  ],
  headers: [['X-Test', '1']],
  body: '{}',
  bodyTruncated: false,
};

test('formatRawRequest builds request line, headers, and body', () => {
  const raw = formatRawRequest(detail, 'http://localhost:3000/h/demo-token');
  expect(raw).toContain('POST /h/demo-token/orders?source=a&source=b HTTP/1.1');
  expect(raw).toContain('X-Test: 1');
  expect(raw.endsWith('{}')).toBe(true);
});
