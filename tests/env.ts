import { existsSync, rmSync } from 'node:fs';

process.env.WEBHOOKY_DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';

if (existsSync('data/webhooky.sqlite')) {
  rmSync('data/webhooky.sqlite', { force: true });
}
