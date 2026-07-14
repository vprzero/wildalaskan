"use client";

import type { ConsultantNotes } from "@/content/consultant-notes";

export function Notes({ notes }: { notes: ConsultantNotes }) {
  return (
    <div style={{ maxWidth: 860 }}>
      <div className="card" style={{ padding: "34px 40px" }}>
        <p className="eyebrow">From your consultant</p>
        <h2 style={{ fontSize: 26, marginBottom: 4 }}>Our recommendations</h2>
        <p className="muted" style={{ marginBottom: 22 }}>
          {[notes.author, notes.role, notes.date].filter(Boolean).join(" · ")}
        </p>

        {notes.intro.map((p, i) => (
          <p key={i} style={{ fontSize: 15.5, marginBottom: 14, maxWidth: "none" }}>
            {p}
          </p>
        ))}

        {notes.sections.map((s, i) => (
          <section key={i} style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: 20 }}>{s.title}</h3>
            {s.paragraphs.map((p, j) => (
              <p key={j} style={{ fontSize: 15, marginBottom: 12, maxWidth: "none" }}>
                {p}
              </p>
            ))}
            {s.bullets && s.bullets.length > 0 && (
              <ul style={{ margin: "10px 0 0 20px", display: "grid", gap: 8 }}>
                {s.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: 14.5, maxWidth: "none" }}>
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {notes.closing && (
          <p
            style={{
              fontSize: 15.5,
              marginTop: 30,
              paddingTop: 22,
              borderTop: "1px solid var(--line)",
              fontStyle: "italic",
              maxWidth: "none",
            }}
          >
            {notes.closing}
          </p>
        )}
      </div>
    </div>
  );
}
