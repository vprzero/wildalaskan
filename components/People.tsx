"use client";

import type { Analysis, Opportunity, PainPoint } from "@/lib/types";
import { Meter } from "./Meter";

const PREVIEW_COUNT = 3;

function PainItem({ pain }: { pain: PainPoint }) {
  return (
    <li className="person-item">
      <span>{pain.text}</span>
      <span className="person-item-meta">
        <Meter value={pain.severity} hot label="severity" />
        <span className="pill salmon">{pain.theme}</span>
      </span>
    </li>
  );
}

function OpportunityItem({ op }: { op: Opportunity }) {
  return (
    <li className="person-item">
      <span>{op.text}</span>
      <span className="person-item-meta">
        <span className="muted" style={{ fontSize: 12.5 }}>
          impact <Meter value={op.impact} label="impact" /> · effort{" "}
          <Meter value={op.effort} label="effort" />
        </span>
        <span className="pill kelp">{op.theme}</span>
      </span>
    </li>
  );
}

export function People({ analysis }: { analysis: Analysis }) {
  return (
    <div className="grid-2">
      {analysis.people.map((p) => {
        const pains = [...p.painPoints].sort((a, b) => b.severity - a.severity);
        const opps = [...p.opportunities].sort((a, b) => b.impact - a.impact);
        return (
          <div key={p.name} className="card">
            <h3 className="card-band">{p.name}</h3>
            <p className="muted" style={{ textAlign: "center", marginTop: -6 }}>
              {p.role} · {p.department}
            </p>

            <div className="person-facts">
              <div>
                <span className="person-label">AI readiness</span>
                <Meter value={p.aiReadiness} label={`${p.name}'s AI readiness`} />
              </div>
              {(p.toolsUsed?.length ?? 0) > 0 && (
                <div>
                  <span className="person-label">Tools they use</span>
                  <span>
                    {p.toolsUsed!.map((tl) => (
                      <span key={tl} className="pill">
                        {tl}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>

            <p className="person-label">How they work today</p>
            <p style={{ fontSize: 14.5, marginBottom: 14 }}>{p.currentWorkflow}</p>

            <blockquote className="person-quote">&ldquo;{p.quote}&rdquo;</blockquote>

            <p className="person-label">
              Top pain points{" "}
              <span className="muted" style={{ fontWeight: 400 }}>
                ({p.painPoints.length} total)
              </span>
            </p>
            <ul className="person-list">
              {pains.slice(0, PREVIEW_COUNT).map((pain, i) => (
                <PainItem key={i} pain={pain} />
              ))}
            </ul>
            {pains.length > PREVIEW_COUNT && (
              <details className="person-more">
                <summary>Show all {pains.length} pain points</summary>
                <ul className="person-list">
                  {pains.slice(PREVIEW_COUNT).map((pain, i) => (
                    <PainItem key={i} pain={pain} />
                  ))}
                </ul>
              </details>
            )}

            <p className="person-label">
              Top AI opportunities{" "}
              <span className="muted" style={{ fontWeight: 400 }}>
                ({p.opportunities.length} total)
              </span>
            </p>
            <ul className="person-list">
              {opps.slice(0, PREVIEW_COUNT).map((op, i) => (
                <OpportunityItem key={i} op={op} />
              ))}
            </ul>
            {opps.length > PREVIEW_COUNT && (
              <details className="person-more">
                <summary>Show all {opps.length} opportunities</summary>
                <ul className="person-list">
                  {opps.slice(PREVIEW_COUNT).map((op, i) => (
                    <OpportunityItem key={i} op={op} />
                  ))}
                </ul>
              </details>
            )}

            {(p.wants.length > 0 || p.needs.length > 0) && (
              <div className="person-facts" style={{ marginTop: 16 }}>
                {p.wants.length > 0 && (
                  <div>
                    <span className="person-label">Wants</span>
                    <ul className="person-plain-list">
                      {p.wants.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.needs.length > 0 && (
                  <div>
                    <span className="person-label">Needs</span>
                    <ul className="person-plain-list">
                      {p.needs.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
