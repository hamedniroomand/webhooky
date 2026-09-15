import { config } from '@/server/config';
import { sweepExpired } from '@/server/lifecycle';

export function startSweeper(): { stop: () => void } {
  const run = () => {
    try {
      sweepExpired();
    } catch {
      // ponytail: log and continue on next tick
    }
  };
  run();
  const timer = setInterval(run, config.sweeperIntervalMs);
  timer.unref?.();
  return {
    stop() {
      clearInterval(timer);
    },
  };
}
