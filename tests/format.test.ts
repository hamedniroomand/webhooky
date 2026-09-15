import { describe, expect, test } from 'bun:test';

import {
  formatAbsoluteTime,
  formatBytes,
  formatExpiryCountdown,
  formatRelativeTime,
} from '@/lib/format';

describe('formatBytes', () => {
  test('pins size strings', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(14)).toBe('14 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
  });
});

describe('formatAbsoluteTime', () => {
  test('pins wall-clock time', () => {
    const d = new Date(2026, 0, 15, 14, 32, 8);
    expect(formatAbsoluteTime(d)).toBe('14:32:08');
  });
});

describe('formatRelativeTime', () => {
  test('pins relative labels', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    expect(formatRelativeTime(new Date('2026-01-15T11:59:50Z'), now)).toBe('just now');
    expect(formatRelativeTime(new Date('2026-01-15T09:00:00Z'), now)).toBe('3h ago');
  });
});

describe('formatExpiryCountdown', () => {
  test('pins expiry countdown', () => {
    const now = new Date('2026-01-15T12:00:00Z');
    const expires = new Date('2026-01-16T06:42:00Z');
    expect(formatExpiryCountdown(expires, now)).toBe('Expires in 18h 42m');
  });
});
