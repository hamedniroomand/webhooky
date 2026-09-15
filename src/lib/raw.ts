import type { RequestDetailDto } from '@/types/api';

export function formatRawRequest(detail: RequestDetailDto, webhookUrl: string): string {
  const suffix = detail.path === '/' ? '' : detail.path;
  const url = new URL(`${webhookUrl.replace(/\/$/, '')}${suffix}`);
  for (const [key, value] of detail.query) {
    url.searchParams.append(key, value);
  }
  const requestLine = `${detail.method} ${url.pathname}${url.search} HTTP/1.1`;
  const headerLines = detail.headers.map(([k, v]) => `${k}: ${v}`);
  const body = detail.body ?? '';
  return [requestLine, ...headerLines, '', body].join('\n');
}
