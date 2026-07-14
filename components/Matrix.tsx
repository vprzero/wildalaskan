"use client";

import { useState } from "react";
import type { Analysis, MatrixItem } from "@/lib/types";

const QUADRANT_META: Record<
  MatrixItem["quadrant"],
  { label: string; color: string; blurb: string }
> = {
  "quick-win": {
    label: "Quick wins",
    color: "var(--q-quickwin)",
    blurb: "High impact, low effort — start here.",
  },
  strategic: {
    label: "Strategic bets",
    color: "var(--q-strategic)",
    blurb: "High impact, higher effort — plan and resource these.",
  },
  incremental: {
    label: "Incremental",
    color: "var(--q-incremental)",
    blurb: "Easy but modest — fold into everyday habits.",
  },
  reconsider: {
    label: "Reconsider",
    color: "var(--q-reconsider)",
    blurb: "Costly for the return — revisit later.",
  },
};

export function Matrix({ analysis }: { analysis: Analysis }) {
  const [selected, setSelected] = useState<number | null>(null);

  // The plot shows only high-impact initiatives (the two top quadrants) — the
  // low-impact half was mostly empty air. Everything still appears in the
  // lists below.
  const plotted = analysis.matrix
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => item.impact >= 4);

  // Initiatives often share the exact same scores; fan ties out horizontally
  // so every dot stays visible instead of stacking.
  const tieIndex = new Map<string, number>();
  const tieCount = new Map<string, number>();
  for (const { item } of plotted) {
    const key = `${item.impact}-${item.effort}`;
    tieCount.set(key, (tieCount.get(key) ?? 0) + 1);
  }

  // effort (1-5) → x (right = high effort); impact (4-5) → two vertical bands
  const toPos = (item: MatrixItem) => {
    const key = `${item.impact}-${item.effort}`;
    const n = tieCount.get(key) ?? 1;
    const k = tieIndex.get(key) ?? 0;
    tieIndex.set(key, k + 1);
    const spread = (k - (n - 1) / 2) * 4.2; // percent offset per tied sibling
    return {
      left: `${8 + ((item.effort - 1) / 4) * 84 + spread}%`,
      top: `${22 + (5 - item.impact) * 42 + (k % 2 === 0 ? 0 : 7)}%`,
    };
  };

  const sel = selected !== null ? analysis.matrix[selected] : null;

  return (
    <div>
      <div className="legend">
        {Object.entries(QUADRANT_META).map(([key, meta]) => (
          <span key={key}>
            <span className="swatch" style={{ background: meta.color }} />
            <strong>{meta.label}</strong> — {meta.blurb}
          </span>
        ))}
      </div>

      <div className="matrix-wrap">
        <div className="matrix-plot" role="img" aria-label="High-impact initiatives by effort">
          <span className="matrix-label" style={{ top: 0, left: 0 }}>
            Quick wins
          </span>
          <span className="matrix-label" style={{ top: 0, right: 0 }}>
            Strategic bets
          </span>
          {plotted.map(({ item, i }) => (
            <button
              key={i}
              className={`matrix-dot${selected === i ? " selected" : ""}`}
              style={{ ...toPos(item), background: QUADRANT_META[item.quadrant].color }}
              title={item.title}
              aria-label={`${item.title} — impact ${item.impact} of 5, effort ${item.effort} of 5`}
              onClick={() => setSelected(selected === i ? null : i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="axis-caption">
          <span>← Low effort</span>
          <span>Effort →</span>
        </div>
      </div>

      {sel && (
        <div className="card" style={{ margin: "16px 0", borderColor: QUADRANT_META[sel.quadrant].color }}>
          <h3>
            {analysis.matrix.indexOf(sel) + 1}. {sel.title}
          </h3>
          <p style={{ fontSize: 14 }}>{sel.rationale}</p>
          <p className="muted" style={{ margin: "8px 0" }}>
            Impact {sel.impact}/5 · Effort {sel.effort}/5 ·{" "}
            <strong style={{ color: QUADRANT_META[sel.quadrant].color }}>
              {QUADRANT_META[sel.quadrant].label}
            </strong>
          </p>
          <div>
            {sel.beneficiaries.map((b) => (
              <span key={b} className="pill">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 className="section-title">All initiatives</h2>
      {(["quick-win", "strategic", "incremental", "reconsider"] as const).map((q) => {
        const items = analysis.matrix
          .map((item, i) => ({ item, i }))
          .filter(({ item }) => item.quadrant === q);
        if (items.length === 0) return null;
        return (
          <div key={q} style={{ marginBottom: 20 }}>
            <h3 style={{ color: QUADRANT_META[q].color, marginBottom: 10 }}>
              {QUADRANT_META[q].label}
            </h3>
            <div className="grid-2">
              {items.map(({ item, i }) => (
                <div key={i} className="card">
                  <h3 style={{ fontSize: 16 }}>
                    <span style={{ color: QUADRANT_META[q].color }}>{i + 1}.</span>{" "}
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14 }}>{item.rationale}</p>
                  <p className="muted" style={{ margin: "8px 0 6px" }}>
                    Impact {item.impact}/5 · Effort {item.effort}/5
                  </p>
                  <div>
                    {item.beneficiaries.map((b) => (
                      <span key={b} className="pill">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
