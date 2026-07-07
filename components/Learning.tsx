"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types";

export function Learning({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  const levels: Record<string, string> = {
    Foundations: "var(--q-quickwin)",
    Applied: "var(--q-strategic)",
    Advanced: "var(--q-reconsider)",
  };

  return (
    <div className="grid-2">
      {analysis.learningTracks.map((track, i) => (
        <div key={i} className="card">
          <h3>{track.audience}</h3>
          <span
            className="pill"
            style={{
              background: "transparent",
              border: `1.5px solid ${levels[track.level] ?? "var(--line)"}`,
              color: levels[track.level] ?? "var(--ink)",
            }}
          >
            {track.level}
          </span>
          <p style={{ fontSize: 14, margin: "10px 0" }}>{track.summary}</p>

          <strong style={{ fontSize: 14 }}>Skills to build</strong>
          <ul style={{ margin: "6px 0 12px 20px" }}>
            {track.skills.map((s, j) => (
              <li key={j} style={{ fontSize: 14, marginBottom: 3 }}>
                {s}
              </li>
            ))}
          </ul>

          <strong style={{ fontSize: 14 }}>Try these prompts today</strong>
          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {track.samplePrompts.map((prompt, j) => {
              const key = `${i}-${j}`;
              return (
                <div
                  key={j}
                  style={{
                    background: "var(--sand-deep)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 13.5,
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ flex: 1, fontFamily: "ui-monospace, monospace" }}>
                    {prompt}
                  </span>
                  <button
                    className="btn ghost"
                    style={{ padding: "4px 10px", fontSize: 12, flexShrink: 0 }}
                    onClick={() => void copy(prompt, key)}
                  >
                    {copied === key ? "Copied!" : "Copy"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
