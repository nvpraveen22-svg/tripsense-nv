import type { GenerateContentResult, GenerativeModel } from "@google/generative-ai";

const RETRY_DELAYS_MS = [3000, 6000, 12000];

export const GEMINI_OVERLOAD_MESSAGE =
  "Gemini AI is experiencing high demand right now. Please wait a few minutes and try again.";

export class GeminiOverloadedError extends Error {
  constructor() {
    super(GEMINI_OVERLOAD_MESSAGE);
    this.name = "GeminiOverloadedError";
  }
}

function isOverloadedError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /503|high demand|Service Unavailable/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls model.generateContent(prompt), retrying on 503/overload errors with
 * exponential backoff (3s, 6s, 12s). Non-overload errors are rethrown as-is.
 * If all retries are exhausted, throws GeminiOverloadedError.
 */
export async function generateContentWithRetry(
  model: GenerativeModel,
  prompt: string,
  logPrefix = "[gemini-with-retry]"
): Promise<GenerateContentResult> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      if (!isOverloadedError(err)) throw err;

      if (attempt === RETRY_DELAYS_MS.length) {
        console.error(`${logPrefix} exhausted all retries (overloaded):`, err);
        throw new GeminiOverloadedError();
      }

      const delay = RETRY_DELAYS_MS[attempt];
      console.error(
        `${logPrefix} attempt ${attempt + 1} failed (overloaded), retrying in ${delay}ms:`,
        err
      );
      await sleep(delay);
    }
  }

  throw new GeminiOverloadedError();
}
