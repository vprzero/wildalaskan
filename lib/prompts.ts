// Prompts + JSON schema used to turn raw transcripts into a structured analysis.

export const ANALYSIS_SYSTEM_PROMPT = `You are an expert AI-adoption consultant embedded at The Wild Alaskan Company (wildalaskancompany.com) — a member-based seafood subscription company that ships wild-caught, sustainably sourced Alaskan seafood direct to consumers. Teams typically span member experience/support, marketing & creative, operations & fulfillment, sourcing/fisheries, data/engineering, finance, and people ops.

You are given interview/conversation transcripts from employees. Your job is to produce a rigorous, cross-referenced AI-adoption analysis that maps:
- each person's pain points (with severity 1-5), opportunities (impact 1-5 vs effort 1-5), wants, and needs
- shared themes across people (cross-references — who shares which pain), weight 1-5
- a prioritization matrix (impact vs effort quadrants: quick-win, strategic, incremental, reconsider)
- a phased onboarding roadmap (start small → pilot → scale) grounded in the actual transcripts
- role-based learning tracks with concrete sample prompts employees could try on day one

Rules:
- Ground EVERYTHING in the transcripts. Do not invent people or pains that are not evidenced.
- If a transcript lacks a name, infer a label like "Transcript 3 (Ops)".
- Quotes must be verbatim or near-verbatim from the transcript.
- Themes must reference the actual people who raised them.
- All 1-5 scores are integers between 1 and 5 inclusive.
- aiReadiness: 1 = skeptical / no exposure, 5 = power user.
- Quadrants: impact>=4 & effort<=2 → quick-win; impact>=4 & effort>=3 → strategic; impact<=3 & effort<=2 → incremental; else reconsider.
- Roadmap: 3-4 phases with concrete timeframes (e.g. "Weeks 1-4"), each grounded in who needs what first.
- Be specific and practical — name real workflows, not generic advice.`;

// JSON Schema for structured outputs (output_config.format).
// Constraints: additionalProperties:false + required on every object; no numeric min/max
// (unsupported by structured outputs) — ranges are enforced via prompt instructions.
export const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    companySummary: {
      type: "string",
      description: "3-5 sentence synthesis of where the org stands on AI readiness and the biggest levers.",
    },
    people: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          department: { type: "string" },
          aiReadiness: { type: "integer", description: "1-5" },
          currentWorkflow: { type: "string" },
          painPoints: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                severity: { type: "integer", description: "1-5" },
                theme: { type: "string" },
              },
              required: ["text", "severity", "theme"],
              additionalProperties: false,
            },
          },
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                impact: { type: "integer", description: "1-5" },
                effort: { type: "integer", description: "1-5" },
                theme: { type: "string" },
              },
              required: ["text", "impact", "effort", "theme"],
              additionalProperties: false,
            },
          },
          wants: { type: "array", items: { type: "string" } },
          needs: { type: "array", items: { type: "string" } },
          quote: { type: "string", description: "Representative verbatim quote from the transcript." },
        },
        required: [
          "name",
          "role",
          "department",
          "aiReadiness",
          "currentWorkflow",
          "painPoints",
          "opportunities",
          "wants",
          "needs",
          "quote",
        ],
        additionalProperties: false,
      },
    },
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          people: { type: "array", items: { type: "string" } },
          weight: { type: "integer", description: "1-5" },
        },
        required: ["name", "description", "people", "weight"],
        additionalProperties: false,
      },
    },
    matrix: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          impact: { type: "integer", description: "1-5" },
          effort: { type: "integer", description: "1-5" },
          beneficiaries: { type: "array", items: { type: "string" } },
          quadrant: {
            type: "string",
            enum: ["quick-win", "strategic", "incremental", "reconsider"],
          },
        },
        required: ["title", "rationale", "impact", "effort", "beneficiaries", "quadrant"],
        additionalProperties: false,
      },
    },
    roadmap: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          timeframe: { type: "string" },
          objective: { type: "string" },
          initiatives: { type: "array", items: { type: "string" } },
          targetTeams: { type: "array", items: { type: "string" } },
          tools: { type: "array", items: { type: "string" } },
          successMetrics: { type: "array", items: { type: "string" } },
        },
        required: ["name", "timeframe", "objective", "initiatives", "targetTeams", "tools", "successMetrics"],
        additionalProperties: false,
      },
    },
    learningTracks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          audience: { type: "string" },
          level: { type: "string", enum: ["Foundations", "Applied", "Advanced"] },
          summary: { type: "string" },
          skills: { type: "array", items: { type: "string" } },
          samplePrompts: { type: "array", items: { type: "string" } },
        },
        required: ["audience", "level", "summary", "skills", "samplePrompts"],
        additionalProperties: false,
      },
    },
    whereToStart: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
  },
  required: [
    "companySummary",
    "people",
    "themes",
    "matrix",
    "roadmap",
    "learningTracks",
    "whereToStart",
    "risks",
  ],
  additionalProperties: false,
} as const;

export function buildAnalysisUserPrompt(
  transcripts: { name: string; role: string; text: string }[],
): string {
  const blocks = transcripts
    .map(
      (t, i) =>
        `<transcript index="${i + 1}" name="${t.name || `Transcript ${i + 1}`}" role="${t.role || "unknown"}">\n${t.text}\n</transcript>`,
    )
    .join("\n\n");
  return `Here are ${transcripts.length} employee conversation transcripts from The Wild Alaskan Company:\n\n${blocks}\n\nProduce the full cross-referenced AI-adoption analysis as JSON per the schema.`;
}

export function buildConsultantSystemPrompt(
  analysisJson: string | null,
  memoryNotes: string[],
): string {
  let prompt = `You are "Compass" — The Wild Alaskan Company's in-house AI-adoption consultant. Wild Alaskan (wildalaskancompany.com) is a member-based subscription company delivering wild-caught, sustainably sourced Alaskan seafood to people's doorsteps; its culture values sustainability, craft, and genuinely caring for members.

Your job:
- Teach employees how to use AI safely and effectively in their actual day-to-day work.
- Answer questions about the adoption roadmap, the prioritization matrix, and specific people's pain points.
- Give concrete, copy-pasteable prompts and workflows, not generic advice.
- Be warm, plainspoken, and practical — you're a colleague, not a vendor.
- When relevant, remind people of guardrails: never paste member PII, payment data, or confidential sourcing contracts into external AI tools; verify AI output before it ships to members.

Formatting: use markdown, keep answers tight, prefer bullet points and numbered steps.`;

  if (analysisJson) {
    prompt += `\n\nHere is the current company analysis built from real employee transcripts (ground your advice in it — reference actual people, themes, and roadmap phases by name):\n<analysis>\n${analysisJson}\n</analysis>`;
  } else {
    prompt += `\n\nNo transcripts have been analyzed yet. You can still teach AI fundamentals, but encourage the user to upload the 7 employee transcripts on the Transcripts tab so you can tailor the roadmap.`;
  }

  if (memoryNotes.length > 0) {
    prompt += `\n\nDurable memory — facts and decisions from previous sessions that you MUST remember and stay consistent with:\n${memoryNotes.map((n) => `- ${n}`).join("\n")}`;
  }

  prompt += `\n\nAfter answering, if the conversation surfaced a NEW durable fact, preference, or decision worth remembering for future sessions (e.g., "Ops team picked Tuesdays for AI office hours", "CEO wants member-PII policy finalized first"), append it on a final line in the exact format:\nMEMORY: <one concise sentence>\nOnly add a MEMORY line for genuinely durable information — never for small talk. At most one per reply.`;

  return prompt;
}
