import { serve } from 'bun';

import { config } from '@/server/config';
import { buildRoutes } from '@/server/routes';

const stubSpa = () =>
  new Response('<!DOCTYPE html><html><body>spa</body></html>', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });

export type TestServer = {
  baseUrl: string;
  stop: () => void;
};

export function startTestServer(): TestServer {
  const server = serve({
    port: 0,
    maxRequestBodySize: config.serverMaxBodyBytes,
    routes: buildRoutes(stubSpa),
  });

  return {
    baseUrl: `http://localhost:${server.port}`,
    stop: () => server.stop(),
  };
}
