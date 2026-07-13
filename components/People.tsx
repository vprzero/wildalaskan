"use client";

import type { Analysis } from "@/lib/types";
import { Meter } from "./Meter";

export function People({ analysis }: { analysis: Analysis }) {
  return (
    <div className="grid-2">
      {analysis.people.map((p) => (
        <div key={p.name} className="card">
          <h3 className="card-band">{p.name}</h3>
          <p className="muted" style={{ marginBottom: 8 }}>
            {p.role} · {p.department}
          </p>
          <p style={{ fontSize: 13.5, marginBottom: 10 }}>
            <strong>AI readiness</strong>{" "}
            <Meter value={p.aiReadiness} label={`${p.name}'s AI readiness`} />
          </p>
          <p style={{ fontSize: 14, marginBottom: 12 }}>{p.currentWorkflow}</p>

          <blockquote
            style={{
              borderLeft: "3px solid var(--salmon)",
              paddingLeft: 12,
              fontStyle: "italic",
              fontSize: 14,
              color: "var(--ink-soft)",
              margin: "0 0 14px",
            }}
          >
            &ldquo;{p.quote}&rdquo;
          </blockquote>

          <details open>
            <summary style={{ fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              Pain points ({p.painPoints.length})
            </summary>
            <ul style={{ listStyle: "none", marginTop: 8 }}>
              {p.painPoints.map((pain, i) => (
                <li key={i} style={{ fontSize: 14, marginBottom: 8 }}>
                  <Meter value={pain.severity} hot label="severity" /> {pain.text}{" "}
                  <span className="pill salmon">{pain.theme}</span>
                </li>
              ))}
            </ul>
          </details>

          <details>
            <summary style={{ fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              AI opportunities ({p.opportunities.length})
            </summary>
            <ul style={{ listStyle: "none", marginTop: 8 }}>
              {p.opportunities.map((op, i) => (
                <li key={i} style={{ fontSize: 14, marginBottom: 8 }}>
                  {op.text}
                  <br />
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    impact <Meter value={op.impact} label="impact" /> · effort{" "}
                    <Meter value={op.effort} label="effort" />
                  </span>{" "}
                  <span className="pill kelp">{op.theme}</span>
                </li>
              ))}
            </ul>
          </details>

          {(p.toolsUsed?.length ?? 0) > 0 && (
            <p style={{ fontSize: 13.5, margin: "10px 0 4px" }}>
              <strong>Tools they use:</strong>{" "}
              {p.toolsUsed!.map((tl) => (
                <span key={tl} className="pill kelp">
                  {tl}
                </span>
              ))}
            </p>
          )}

          {(p.wants.length > 0 || p.needs.length > 0) && (
            <details>
              <summary style={{ fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                Wants &amp; needs
              </summary>
              <div style={{ marginTop: 8, fontSize: 14 }}>
                {p.wants.length > 0 && (
                  <p style={{ marginBottom: 6 }}>
                    <strong>Wants:</strong> {p.wants.join(" · ")}
                  </p>
                )}
                {p.needs.length > 0 && (
                  <p>
                    <strong>Needs:</strong> {p.needs.join(" · ")}
                  </p>
                )}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
