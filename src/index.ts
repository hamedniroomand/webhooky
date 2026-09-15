import { serve } from 'bun';

import index from './index.html';
import { config } from './server/config';
import { buildRoutes } from './server/routes';
import { startSweeper } from './server/sweeper';

const sweeper = startSweeper();

const server = serve({
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

process.on('SIGINT', () => {
  sweeper.stop();
  server.stop();
  process.exit(0);
});
