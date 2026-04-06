const attempts = new Map<string, number[]>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const timestamps = (attempts.get(key) || []).filter(t => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_ATTEMPTS) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  timestamps.push(now);
  attempts.set(key, timestamps);

  // Cleanup old keys periodically
  if (attempts.size > 10000) {
    for (const [k, v] of attempts) {
      if (v.every(t => now - t >= WINDOW_MS)) attempts.delete(k);
    }
  }

  return { allowed: true, retryAfterMs: 0 };
}
