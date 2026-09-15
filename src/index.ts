import { serve } from 'bun';

import index from './index.html';
import { config } from './server/config';
import { buildRoutes } from './server/routes';
import { startSweeper } from './server/sweeper';

const sweeper = startSweeper();

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? '0.0.0.0';

const server = serve({
  hostname,
  port,
  maxRequestBodySize: config.serverMaxBodyBytes,
  routes: buildRoutes(index),
  development:
    process.env.NODE_ENV !== 'production'
      ? {
          hmr: true,
          console: true,
        }
      : undefined,
});

console.log(`Server running at ${server.url}`);

function shutdown() {
  sweeper.stop();
  server.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
