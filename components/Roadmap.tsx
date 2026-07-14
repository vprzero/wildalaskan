"use client";

import type { Analysis } from "@/lib/types";

export function Roadmap({ analysis }: { analysis: Analysis }) {
  return (
    <div style={{ maxWidth: 1080 }}>
      {analysis.roadmap.map((phase, i) => (
        <div key={i} className="phase">
          <span className="timeframe">{phase.timeframe}</span>
          <h3 style={{ margin: "2px 0 6px" }}>
            Phase {i + 1}: {phase.name}
          </h3>
          <p style={{ fontSize: 15 }}>{phase.objective}</p>

          <div className="card" style={{ marginTop: 12 }}>
            <strong style={{ fontSize: 14 }}>Initiatives</strong>
            <ul>
              {phase.initiatives.map((init, j) => (
                <li key={j} style={{ fontSize: 14, marginBottom: 4 }}>
                  {init}
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
              <div>
                <strong style={{ fontSize: 13 }}>Who</strong>
                <div style={{ marginTop: 4 }}>
                  {phase.targetTeams.map((t) => (
                    <span key={t} className="pill">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <strong style={{ fontSize: 13 }}>Tools</strong>
                <div style={{ marginTop: 4 }}>
                  {phase.tools.map((t) => (
                    <span key={t} className="pill kelp">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <strong style={{ fontSize: 13 }}>How we&apos;ll know it&apos;s working</strong>
              <ul>
                {phase.successMetrics.map((m, j) => (
                  <li key={j} style={{ fontSize: 13.5, marginBottom: 3 }}>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
