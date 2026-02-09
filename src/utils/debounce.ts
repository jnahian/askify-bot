/**
 * Debounce map: groups rapid calls by key and only executes the last one
 * after a quiet period. Used for batching poll message updates during
 * rapid voting.
 */
const timers = new Map<string, NodeJS.Timeout>();

export function debouncedUpdate(
  key: string,
  fn: () => Promise<void>,
  delayMs: number = 500,
): void {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    timers.delete(key);
    try {
      await fn();
    } catch (error) {
      console.error(`Debounced update error for ${key}:`, error);
    }
  }, delayMs);

  timers.set(key, timer);
}
