"use client";

import { useEffect, useRef, useState } from "react";
import type { Analysis, ChatMessage, Transcript } from "@/lib/types";

const MEMORY_RE = /^MEMORY:\s*(.+)$/m;

const SUGGESTIONS = [
  "Where should we start first, and why?",
  "Write a 30-minute AI kickoff session plan for our next all-hands.",
  "Which pain points are shared by the most people?",
  "Give the Member Experience team 5 prompts they can use today.",
  "What should our AI usage guardrails say about member data?",
];

export function Chat({
  messages,
  onMessages,
  memory,
  onMemory,
  analysis,
  transcripts,
}: {
  messages: ChatMessage[];
  onMessages: (m: ChatMessage[]) => void;
  memory: string[];
  onMemory: (notes: string[]) => void;
  analysis: Analysis | null;
  transcripts: Transcript[];
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // IDs of raw transcripts Compass should ground on (NotebookLM-style sources).
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const availableSources = transcripts.filter((t) => t.text.trim().length > 0);
  const allSelected =
    availableSources.length > 0 &&
    availableSources.every((t) => selectedIds.includes(t.id));

  function toggleSource(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setError(null);
    setInput("");
    setBusy(true);

    const history: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    onMessages([...history, { role: "assistant", content: "" }]);

    try {
      const sources = availableSources
        .filter((t) => selectedIds.includes(t.id))
        .map((t) => ({ name: t.name, role: t.role, text: t.text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          analysis,
          memoryNotes: memory,
          sources,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        // Hide any trailing MEMORY: line while streaming.
        const display = full.replace(MEMORY_RE, "").trimEnd();
        onMessages([...history, { role: "assistant", content: display }]);
      }

      const match = full.match(MEMORY_RE);
      const display = full.replace(MEMORY_RE, "").trimEnd();
      onMessages([...history, { role: "assistant", content: display }]);
      if (match) {
        const note = match[1].trim();
        if (note && !memory.includes(note)) onMemory([...memory, note]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      onMessages(history); // drop the empty assistant bubble
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!analysis && (
        <p className="error-banner">
          The consultant hasn&apos;t seen any transcripts yet — it can still teach AI
          basics, but upload and analyze the 7 conversations on the Transcripts tab
          for company-specific advice.
        </p>
      )}

      <div className="source-picker card">
        <strong style={{ fontSize: 14 }}>📚 Sources</strong>
        <p className="muted" style={{ margin: "2px 0 8px" }}>
          Compass always knows the insights &amp; roadmap. Add raw transcripts to ask
          about what people actually said, get verbatim quotes, or fact-check a finding.
        </p>
        <div className="source-chips">
          <span
            className="pill kelp"
            title={analysis ? "The full analysis is always in context" : "Run the analysis to add this"}
            style={{ opacity: analysis ? 1 : 0.5 }}
          >
            ✓ Insights &amp; roadmap
          </span>
          {availableSources.map((t, i) => (
            <button
              key={t.id}
              className={`source-chip${selectedIds.includes(t.id) ? " on" : ""}`}
              onClick={() => toggleSource(t.id)}
              aria-pressed={selectedIds.includes(t.id)}
            >
              {selectedIds.includes(t.id) ? "✓ " : ""}
              {t.name || `Transcript ${i + 1}`}
            </button>
          ))}
          {availableSources.length > 1 && (
            <button
              className="source-chip"
              onClick={() =>
                setSelectedIds(allSelected ? [] : availableSources.map((t) => t.id))
              }
            >
              {allSelected ? "Clear all transcripts" : "All transcripts"}
            </button>
          )}
          {availableSources.length === 0 && (
            <span className="muted" style={{ fontSize: 13 }}>
              No transcripts uploaded yet.
            </span>
          )}
        </div>
      </div>

      <div className="chat-panel">
        <div className="chat-scroll" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="empty-state" style={{ padding: 30 }}>
              <h2 style={{ fontSize: 20 }}>Meet Compass 🧭</h2>
              <p style={{ marginBottom: 16 }}>
                Your in-house AI adoption consultant. It knows the roadmap, the
                matrix, and everyone&apos;s pain points — and it remembers decisions
                between sessions.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="btn ghost" style={{ fontSize: 13 }} onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content || (busy && i === messages.length - 1 ? "…" : m.content)}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <textarea
            placeholder="Ask about the roadmap, a team's pain points, or how to teach a workflow…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            disabled={busy}
          />
          <button className="btn primary" onClick={() => void send(input)} disabled={busy || !input.trim()}>
            {busy ? "Thinking…" : "Send"}
          </button>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button
          className="btn ghost"
          onClick={() => onMessages([])}
          disabled={busy || messages.length === 0}
        >
          Clear conversation (memory is kept)
        </button>
      </div>

      <div className="card memory-list" style={{ marginTop: 20 }}>
        <h3>🧠 What Compass remembers</h3>
        <p className="muted">
          Durable facts and decisions the consultant carries into every future
          conversation. Stored in this browser.
        </p>
        {memory.length === 0 ? (
          <p className="muted" style={{ marginTop: 10 }}>
            Nothing yet — decisions you make in chat will be remembered here.
          </p>
        ) : (
          <ul style={{ marginTop: 8 }}>
            {memory.map((note, i) => (
              <li key={i}>
                <span>{note}</span>
                <button onClick={() => onMemory(memory.filter((_, j) => j !== i))}>
                  forget
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
