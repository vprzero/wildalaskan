import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { anthropicErrorResponse } from "@/lib/api-errors";
import { buildConsultantSystemPrompt, type ChatSource } from "@/lib/prompts";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 120;

interface ChatBody {
  messages?: ChatMessage[];
  analysis?: unknown | null;
  memoryNotes?: string[];
  /** Raw transcripts the user selected as grounding sources. */
  sources?: ChatSource[];
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const history = (body.messages ?? []).filter(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0,
  );
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "The last message must be from the user." },
      { status: 400 },
    );
  }

  const sources = (Array.isArray(body.sources) ? body.sources : [])
    .filter((s) => s && typeof s.text === "string" && s.text.trim().length > 0)
    .slice(0, 20)
    .map((s) => ({
      name: typeof s.name === "string" ? s.name : "",
      role: typeof s.role === "string" ? s.role : "",
      text: s.text,
    }));

  const system = buildConsultantSystemPrompt(
    body.analysis ? JSON.stringify(body.analysis) : null,
    Array.isArray(body.memoryNotes) ? body.memoryNotes.slice(0, 100) : [],
    sources,
  );

  const client = new Anthropic({ maxRetries: 5 });

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: system,
          // The analysis blob is large and stable between turns — cache it.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });

    // Pipe text deltas to the client as a plain text stream.
    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        stream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });
        stream.on("error", (err) => {
          controller.error(err);
        });
        stream.on("end", () => {
          controller.close();
        });
      },
      cancel() {
        stream.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return anthropicErrorResponse(error, "Your conversation is saved — just send the message again.");
  }
}
