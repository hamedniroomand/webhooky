export type BodyKind = 'json' | 'form' | 'text';

export type DetectedBody =
  | { kind: 'json'; value: unknown }
  | { kind: 'form'; pairs: [string, string][] }
  | { kind: 'text'; text: string; parseError?: string };

export function parseContentType(header: string | null): {
  mime: string;
  params: Record<string, string>;
} {
  if (!header) {
    return { mime: '', params: {} };
  }
  const parts = header.split(';').map((p) => p.trim());
  const mime = (parts[0] ?? '').toLowerCase();
  const params: Record<string, string> = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = part.slice(0, eq).trim().toLowerCase();
    const value = part
      .slice(eq + 1)
      .trim()
      .replace(/^"|"$/g, '');
    params[key] = value;
  }
  return { mime, params };
}

function isJsonMime(mime: string): boolean {
  if (mime === 'application/json' || mime.endsWith('+json')) {
    return true;
  }
  return false;
}

function isXmlMime(mime: string): boolean {
  return mime === 'application/xml' || mime === 'text/xml' || mime.endsWith('+xml');
}

function sniffXml(body: string): boolean {
  const trimmed = body.trimStart();
  return trimmed.startsWith('<?xml') || trimmed.startsWith('<');
}

function parseUrlEncoded(body: string): [string, string][] {
  const params = new URLSearchParams(body);
  const pairs: [string, string][] = [];
  for (const [key, value] of params.entries()) {
    pairs.push([key, value]);
  }
  return pairs;
}

function parseMultipart(body: string, boundary: string): [string, string][] {
  const pairs: [string, string][] = [];
  const marker = `--${boundary}`;
  const chunks = body.split(marker);
  for (const chunk of chunks) {
    const trimmed = chunk.replace(/^\r\n/, '').replace(/\r\n--\s*$/, '');
    if (!trimmed || trimmed === '--') {
      continue;
    }
    const sections = trimmed.split('\r\n\r\n');
    const head = sections[0] ?? '';
    const value = sections.slice(1).join('\r\n\r\n').replace(/\r\n$/, '');
    const nameMatch = /name="([^"]+)"/.exec(head);
    if (nameMatch?.[1]) {
      pairs.push([nameMatch[1], value]);
    }
  }
  return pairs;
}

export function detectBody(body: string, contentType: string | null): DetectedBody {
  const { mime, params } = parseContentType(contentType);

  if (mime === 'multipart/form-data') {
    const boundary = params.boundary ?? '';
    return { kind: 'form', pairs: parseMultipart(body, boundary) };
  }

  if (mime === 'application/x-www-form-urlencoded') {
    return { kind: 'form', pairs: parseUrlEncoded(body) };
  }

  if (isJsonMime(mime)) {
    try {
      return { kind: 'json', value: JSON.parse(body) as unknown };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON payload.';
      return {
        kind: 'text',
        text: body,
        parseError: `JSON parse error: ${message}`,
      };
    }
  }

  if (
    mime === 'text/html' ||
    mime === 'text/plain' ||
    mime === 'application/octet-stream' ||
    isXmlMime(mime) ||
    mime === ''
  ) {
    if (mime === '' && sniffXml(body)) {
      return { kind: 'text', text: body };
    }
    if (mime === '' && body.trimStart().startsWith('{')) {
      try {
        return { kind: 'json', value: JSON.parse(body) as unknown };
      } catch {
        return { kind: 'text', text: body };
      }
    }
    return { kind: 'text', text: body };
  }

  return { kind: 'text', text: body };
}
