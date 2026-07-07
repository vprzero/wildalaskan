import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  ANALYSIS_SCHEMA,
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
} from "@/lib/prompts";
import type { Analysis } from "@/lib/types";

export const maxDuration = 300; // analysis over 7 transcripts can take a while

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: { transcripts?: { name: string; role: string; text: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const transcripts = (body.transcripts ?? []).filter(
    (t) => t && typeof t.text === "string" && t.text.trim().length > 0,
  );
  if (transcripts.length === 0) {
    return NextResponse.json(
      { error: "Upload at least one transcript before analyzing." },
      { status: 400 },
    );
  }

  const client = new Anthropic();

  try {
    // Stream to avoid HTTP timeouts on a long structured-output generation.
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      system: ANALYSIS_SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
        },
      },
      messages: [{ role: "user", content: buildAnalysisUserPrompt(transcripts) }],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The model declined to analyze this content." },
        { status: 422 },
      );
    }
    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "The analysis was too large to complete. Try shorter transcripts." },
        { status: 422 },
      );
    }

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "No analysis was returned by the model." },
        { status: 502 },
      );
    }

    const analysis = JSON.parse(textBlock.text) as Omit<Analysis, "generatedAt">;
    return NextResponse.json({
      analysis: { ...analysis, generatedAt: new Date().toISOString() },
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid Anthropic API key. Check ANTHROPIC_API_KEY." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by the Claude API — wait a minute and retry." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error (${error.status}): ${error.message}` },
        { status: 502 },
      );
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
