/**
 * Retry a Slack API call with exponential backoff on rate limit errors.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.data?.error === 'ratelimited' || error?.code === 'slack_webapi_rate_limited';
      const retryAfter = error?.data?.response_metadata?.retry_after || error?.retryAfter;

      if (isRateLimit && attempt < maxRetries) {
        const delay = (retryAfter || Math.pow(2, attempt)) * 1000;
        console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Max retries exceeded');
}
