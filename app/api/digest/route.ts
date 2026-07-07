import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DIGEST_SYSTEM_PROMPT, PERSON_SCHEMA, buildDigestUserPrompt } from "@/lib/prompts";
import type { PersonInsight } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: { name?: string; role?: string; text?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Transcript text is empty." }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: DIGEST_SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: PERSON_SCHEMA as unknown as Record<string, unknown>,
        },
      },
      messages: [
        {
          role: "user",
          content: buildDigestUserPrompt({
            name: body.name ?? "",
            role: body.role ?? "",
            text,
            label: body.label ?? "Unnamed transcript",
          }),
        },
      ],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The model declined to process this transcript." },
        { status: 422 },
      );
    }
    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "This transcript produced too much output — try splitting it." },
        { status: 422 },
      );
    }

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "No digest was returned by the model." },
        { status: 502 },
      );
    }

    const person = JSON.parse(textBlock.text) as PersonInsight;
    return NextResponse.json({ person });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited — wait a minute and retry." },
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
