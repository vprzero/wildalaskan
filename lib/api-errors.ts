import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

/**
 * Map an Anthropic SDK error to a JSON error response with a friendly,
 * actionable message. `retryHint` is appended to transient-failure messages.
 */
export function anthropicErrorResponse(error: unknown, retryHint = ""): NextResponse {
  if (error instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { error: `Rate limited by the Claude API — wait a minute and retry. ${retryHint}`.trim() },
      { status: 429 },
    );
  }
  if (error instanceof Anthropic.APIError) {
    const type = (error as { type?: string }).type;
    if (type === "overloaded_error" || error.status === 529) {
      return NextResponse.json(
        {
          error:
            `Claude is briefly overloaded (this happens at peak times and passes quickly) — wait ~30 seconds and retry. ${retryHint}`.trim(),
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: `Claude API error (${error.status ?? "network"}): ${error.message}` },
      { status: 502 },
    );
  }
  const msg = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: msg }, { status: 500 });
}
