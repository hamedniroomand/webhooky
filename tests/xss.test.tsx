import { describe, expect, test } from 'bun:test';

import { renderToStaticMarkup } from 'react-dom/server';

import { BodyView } from '@/components/body-view';

describe('untrusted body rendering', () => {
  test('html payload renders as escaped text', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const html = renderToStaticMarkup(
      <BodyView
        body={payload}
        contentType="text/html"
      />,
    );
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
  });

  test('script in json string value renders as text', () => {
    const payload = '{"x":"<script>alert(1)</script>"}';
    const html = renderToStaticMarkup(
      <BodyView
        body={payload}
        contentType="application/json"
      />,
    );
    expect(html).toContain('&lt;script');
    expect(html).not.toContain('<script');
  });
});
