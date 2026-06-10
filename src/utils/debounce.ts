/**
 * Debounce map: groups rapid calls by key and only executes the last one
 * after a quiet period. Used for batching poll message updates during
 * rapid voting.
 */
const timers = new Map<string, NodeJS.Timeout>();
const callbacks = new Map<string, () => Promise<void>>();

export function debouncedUpdate(
  key: string,
  fn: () => Promise<void>,
  delayMs: number = 500,
): void {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    timers.delete(key);
    callbacks.delete(key);
    try {
      await fn();
    } catch (error) {
      console.error(`Debounced update error for ${key}:`, error);
    }
  }, delayMs);

  timers.set(key, timer);
  callbacks.set(key, fn);
}

/**
 * Immediately fire and clear all pending debounced callbacks.
 * Used during graceful shutdown so in-flight updates aren't lost.
 */
export async function flushAll(): Promise<void> {
  const pending = [...callbacks.entries()];

  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  callbacks.clear();

  await Promise.all(
    pending.map(async ([key, fn]) => {
      try {
        await fn();
      } catch (error) {
        console.error(`Flush error for ${key}:`, error);
      }
    }),
  );
}
