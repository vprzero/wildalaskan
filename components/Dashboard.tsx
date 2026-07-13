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
  const tldr = analysis.tldr ?? [];
  const tools = analysis.toolLandscape ?? [];

  return (
    <div>
      {tldr.length > 0 && (
        <section className="card brief">
          <p className="eyebrow">The 60-second brief</p>
          <h2 style={{ fontSize: 24 }}>What you should know</h2>
          <ol>
            {tldr.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </section>
      )}

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
          <div className="num">
            {avgReadiness.toFixed(1)}
            <span style={{ fontSize: 18, opacity: 0.7 }}>/5</span>
          </div>
          <div className="label">Avg AI readiness</div>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">Context</p>
        <h3>Where the team stands</h3>
        <p>{analysis.companySummary}</p>
      </div>

      <h2 className="section-title">Where to start</h2>
      <p className="section-lede">The first moves, in order — chosen for high impact and low lift.</p>
      <div className="grid-2">
        {analysis.whereToStart.map((item, i) => (
          <div key={i} className="card" style={{ display: "flex", gap: 18 }}>
            <span
              className="display"
              style={{ fontSize: 32, color: "var(--salmon)", lineHeight: 1 }}
              aria-hidden
            >
              {i + 1}
            </span>
            <p style={{ fontSize: 15.5 }}>{item}</p>
          </div>
        ))}
      </div>

      {tools.length > 0 && (
        <>
          <h2 className="section-title">Tools already in play</h2>
          <p className="section-lede">
            What the team uses today, and how to get more out of each one.
          </p>
          <div className="grid-2">
            {tools.map((tool) => (
              <div key={tool.name} className="card">
                <h3>{tool.name}</h3>
                <div style={{ marginBottom: 10 }}>
                  {tool.users.map((u) => (
                    <span key={u} className="pill">
                      {u}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: 14.5, marginBottom: 10 }}>{tool.currentUse}</p>
                <p style={{ fontSize: 14.5 }}>
                  <strong style={{ color: "var(--gold-deep)" }}>Get more from it:</strong>{" "}
                  {tool.opportunity}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Shared themes across the team</h2>
      <p className="section-lede">Pain points that came up again and again — and who raised them.</p>
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
              <p style={{ fontSize: 14.5 }}>{theme.description}</p>
              <div style={{ marginTop: 12 }}>
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
          <h2 className="section-title">Guardrails</h2>
          <p className="section-lede">Simple rules that keep members and the brand safe.</p>
          <div className="card">
            <ul style={{ marginLeft: 20, display: "grid", gap: 8 }}>
              {analysis.risks.map((r, i) => (
                <li key={i} style={{ fontSize: 14.5 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <p className="muted" style={{ marginTop: 40, fontSize: 12.5 }}>
        Generated {new Date(analysis.generatedAt).toLocaleString()} from {analysis.people.length}{" "}
        team conversations.
      </p>
    </div>
  );
}
