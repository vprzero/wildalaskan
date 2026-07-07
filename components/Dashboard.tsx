"use client";

import type { Analysis } from "@/lib/types";
import { Meter } from "./Meter";

export function Dashboard({ analysis }: { analysis: Analysis }) {
  const quickWins = analysis.matrix.filter((m) => m.quadrant === "quick-win");
  const avgReadiness =
    analysis.people.length > 0
      ? analysis.people.reduce((s, p) => s + p.aiReadiness, 0) / analysis.people.length
      : 0;
  const painCount = analysis.people.reduce((s, p) => s + p.painPoints.length, 0);

  return (
    <div>
      <div className="stat-row">
        <div className="stat">
          <div className="num">{analysis.people.length}</div>
          <div className="label">Voices heard</div>
        </div>
        <div className="stat">
          <div className="num">{painCount}</div>
          <div className="label">Pain points mapped</div>
        </div>
        <div className="stat">
          <div className="num">{quickWins.length}</div>
          <div className="label">Quick wins found</div>
        </div>
        <div className="stat">
          <div className="num">{avgReadiness.toFixed(1)}<span style={{ fontSize: 18, opacity: 0.7 }}>/5</span></div>
          <div className="label">Avg AI readiness</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Where the company stands</h3>
        <p>{analysis.companySummary}</p>
        <p className="muted" style={{ marginTop: 10 }}>
          Generated {new Date(analysis.generatedAt).toLocaleString()}
        </p>
      </div>

      <h2 className="section-title">Where to start</h2>
      <div className="grid-2">
        {analysis.whereToStart.map((item, i) => (
          <div key={i} className="card" style={{ display: "flex", gap: 14 }}>
            <span
              className="display"
              style={{ fontSize: 30, color: "var(--salmon)", lineHeight: 1 }}
              aria-hidden
            >
              {i + 1}
            </span>
            <p style={{ fontSize: 15 }}>{item}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Shared themes across the team</h2>
      <div className="grid-2">
        {analysis.themes
          .slice()
          .sort((a, b) => b.weight - a.weight)
          .map((theme) => (
            <div key={theme.name} className="card">
              <h3>
                {theme.name}{" "}
                <Meter value={theme.weight} hot label={`theme weight for ${theme.name}`} />
              </h3>
              <p style={{ fontSize: 14 }}>{theme.description}</p>
              <div style={{ marginTop: 10 }}>
                {theme.people.map((p) => (
                  <span key={p} className="pill">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>

      {analysis.risks.length > 0 && (
        <>
          <h2 className="section-title">Risks &amp; guardrails</h2>
          <div className="card">
            <ul style={{ marginLeft: 20 }}>
              {analysis.risks.map((r, i) => (
                <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
