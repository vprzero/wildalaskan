# AI Compass — Wild Alaskan Company

An interactive web app that teaches [Wild Alaskan Company](https://wildalaskancompany.com/) employees how to use AI — and turns real employee conversations into a concrete adoption plan.

Upload **7 conversation transcripts** and the app (powered by Claude) will:

1. **Map each person** — pain points (scored 1–5 severity), AI opportunities (impact × effort), wants, needs, current workflow, AI readiness, and a representative quote.
2. **Cross-reference themes** — which pains are shared, by whom, and how strongly.
3. **Build a prioritization matrix** — impact vs. effort quadrants: *quick wins*, *strategic bets*, *incremental*, *reconsider*.
4. **Generate a phased rollout roadmap** — where to start, who goes first, which tools, and success metrics per phase.
5. **Create role-based learning tracks** — with copy-pasteable prompts each team can try on day one.
6. **Act as "Compass"** — an interactive AI consultant that knows the whole analysis, answers questions, plans training sessions, and **retains memory** of decisions across sessions.

## Memory & persistence

- Transcripts, the analysis, chat history, and the consultant's memory notes are stored in the browser (`localStorage`) — everything survives reloads and future visits on the same browser.
- The consultant extracts durable facts from conversations (`MEMORY:` lines) and carries them into every future session. You can review and delete individual memories in the Consultant tab.

## Setup

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

## Deploy

Works out of the box on Vercel — set `ANTHROPIC_API_KEY` as an environment variable. The analysis endpoint sets `maxDuration = 300`, so use a plan that allows long function execution (or Fluid Compute).

## Stack

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Claude** (`claude-opus-4-8`) via `@anthropic-ai/sdk`
  - Structured outputs (`output_config.format`) guarantee the analysis matches a strict JSON schema
  - Adaptive thinking for deeper cross-referencing
  - Streaming chat responses; prompt caching on the (large, stable) analysis context
- No database — client-side persistence keeps the app zero-config

## Privacy guardrail

Transcripts are sent to the Anthropic API for analysis. Scrub member PII and payment data from transcripts before uploading — the consultant will also remind users of this guardrail.
