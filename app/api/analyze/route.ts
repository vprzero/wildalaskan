import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { anthropicErrorResponse } from "@/lib/api-errors";
import { SYNTHESIS_SYSTEM_PROMPT, buildSynthesisUserPrompt } from "@/lib/prompts";
import type { Analysis, MatrixItem, PersonInsight } from "@/lib/types";

export const maxDuration = 300;

type Synthesis = Omit<Analysis, "people" | "generatedAt">;

// The synthesis stage deliberately avoids structured outputs — the combined schema
// exceeds the grammar-compilation limit — so parse the model's JSON defensively.
function extractJson(raw: string): unknown {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("The model did not return valid JSON.");
  }
}

const clamp = (n: unknown, fallback = 3): number =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.max(1, Math.min(5, Math.round(n)))
    : fallback;

const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];

function quadrantFor(impact: number, effort: number): MatrixItem["quadrant"] {
  if (impact >= 4) return effort <= 2 ? "quick-win" : "strategic";
  return effort <= 2 ? "incremental" : "reconsider";
}

// Normalize whatever came back into the exact shape the UI expects.
function normalize(data: Record<string, unknown>): Synthesis {
  const themes = (Array.isArray(data.themes) ? data.themes : []).map((t) => {
    const o = (t ?? {}) as Record<string, unknown>;
    return {
      name: String(o.name ?? "Theme"),
      description: String(o.description ?? ""),
      people: strArr(o.people),
      weight: clamp(o.weight),
    };
  });

  const matrix = (Array.isArray(data.matrix) ? data.matrix : []).map((m) => {
    const o = (m ?? {}) as Record<string, unknown>;
    const impact = clamp(o.impact);
    const effort = clamp(o.effort);
    const q = o.quadrant;
    const quadrant: MatrixItem["quadrant"] =
      q === "quick-win" || q === "strategic" || q === "incremental" || q === "reconsider"
        ? q
        : quadrantFor(impact, effort);
    return {
      title: String(o.title ?? "Initiative"),
      rationale: String(o.rationale ?? ""),
      impact,
      effort,
      beneficiaries: strArr(o.beneficiaries),
      quadrant,
    };
  });

  const roadmap = (Array.isArray(data.roadmap) ? data.roadmap : []).map((p) => {
    const o = (p ?? {}) as Record<string, unknown>;
    return {
      name: String(o.name ?? "Phase"),
      timeframe: String(o.timeframe ?? ""),
      objective: String(o.objective ?? ""),
      initiatives: strArr(o.initiatives),
      targetTeams: strArr(o.targetTeams),
      tools: strArr(o.tools),
      successMetrics: strArr(o.successMetrics),
    };
  });

  const learningTracks = (Array.isArray(data.learningTracks) ? data.learningTracks : []).map(
    (t) => {
      const o = (t ?? {}) as Record<string, unknown>;
      const level = o.level;
      return {
        audience: String(o.audience ?? "Everyone"),
        level: (level === "Foundations" || level === "Applied" || level === "Advanced"
          ? level
          : "Foundations") as "Foundations" | "Applied" | "Advanced",
        summary: String(o.summary ?? ""),
        skills: strArr(o.skills),
        samplePrompts: strArr(o.samplePrompts),
      };
    },
  );

  return {
    companySummary: String(data.companySummary ?? ""),
    themes,
    matrix,
    roadmap,
    learningTracks,
    whereToStart: strArr(data.whereToStart),
    risks: strArr(data.risks),
  };
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: { people?: PersonInsight[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const people = Array.isArray(body.people) ? body.people : [];
  if (people.length === 0) {
    return NextResponse.json(
      { error: "No transcript digests provided — digest the transcripts first." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ maxRetries: 5 });

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: buildSynthesisUserPrompt(JSON.stringify(people, null, 1)) },
      ],
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The model declined to synthesize this content." },
        { status: 422 },
      );
    }
    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "The synthesis was too large to complete — try fewer transcripts." },
        { status: 422 },
      );
    }

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "No synthesis was returned by the model." },
        { status: 502 },
      );
    }

    const synthesis = normalize(extractJson(textBlock.text) as Record<string, unknown>);
    const analysis: Analysis = {
      ...synthesis,
      people,
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ analysis });
  } catch (error) {
    return anthropicErrorResponse(
      error,
      "Your transcript digests are already saved — retrying only re-runs the final synthesis step.",
    );
  }
}
