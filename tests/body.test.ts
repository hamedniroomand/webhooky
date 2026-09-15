import { describe, expect, test } from 'bun:test';

import { detectBody } from '@/lib/body';

describe('detectBody', () => {
  test('valid JSON', () => {
    const result = detectBody('{"a":1}', 'application/json');
    expect(result.kind).toBe('json');
    if (result.kind === 'json') {
      expect(result.value).toEqual({ a: 1 });
    }
  });

  test('vendor +json with charset', () => {
    const result = detectBody('{"ok":true}', 'application/vnd.api+json; charset=utf-8');
    expect(result.kind).toBe('json');
  });

  test('invalid JSON returns raw text and parse error', () => {
    const result = detectBody('not json', 'application/json');
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.text).toBe('not json');
      expect(result.parseError).toContain('JSON');
    }
  });

  test('urlencoded with repeated key', () => {
    const result = detectBody('a=1&a=2', 'application/x-www-form-urlencoded');
    expect(result.kind).toBe('form');
    if (result.kind === 'form') {
      expect(result.pairs).toEqual([
        ['a', '1'],
        ['a', '2'],
      ]);
    }
  });

  test('multipart', () => {
    const body = ['--bound', 'Content-Disposition: form-data; name="x"', '', '1', '--bound--'].join(
      '\r\n',
    );
    const result = detectBody(body, 'multipart/form-data; boundary=bound');
    expect(result.kind).toBe('form');
  });

  test('XML', () => {
    const result = detectBody('<root/>', 'application/xml');
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.text).toBe('<root/>');
    }
  });

  test('XML sniffed with no content type', () => {
    const result = detectBody("<?xml version='1.0'?><r/>", null);
    expect(result.kind).toBe('text');
  });

  test('plain text', () => {
    const result = detectBody('hello', 'text/plain');
    expect(result.kind).toBe('text');
  });

  test('octet-stream with control bytes', () => {
    const result = detectBody('\x00\x01\x02', 'application/octet-stream');
    expect(result.kind).toBe('text');
  });

  test('HTML stays inert text', () => {
    const result = detectBody('<img src=x>', 'text/html');
    expect(result.kind).toBe('text');
    if (result.kind === 'text') {
      expect(result.text).toBe('<img src=x>');
    }
  });

  test('invalid JSON never throws', () => {
    expect(() => detectBody('{', 'application/json')).not.toThrow();
  });
});
