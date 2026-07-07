"use client";

import { useRef, useState } from "react";
import type { Transcript } from "@/lib/types";

const SLOT_COUNT = 7;

function newTranscript(): Transcript {
  return {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    role: "",
    text: "",
  };
}

export function Transcripts({
  transcripts,
  onChange,
  onAnalyze,
  analyzing,
  progress,
  hasAnalysis,
}: {
  transcripts: Transcript[];
  onChange: (t: Transcript[]) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  progress: string | null;
  hasAnalysis: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const filled = transcripts.filter((t) => t.text.trim().length > 0);

  function update(id: string, patch: Partial<Transcript>) {
    // Editing content invalidates the cached digest for that transcript.
    onChange(
      transcripts.map((t) =>
        t.id === id ? { ...t, ...patch, digest: undefined, digestHash: undefined } : t,
      ),
    );
  }

  function remove(id: string) {
    onChange(transcripts.filter((t) => t.id !== id));
  }

  function addBlank() {
    onChange([...transcripts, newTranscript()]);
  }

  async function ingestFiles(files: FileList | File[]) {
    const additions: Transcript[] = [];
    for (const file of Array.from(files)) {
      const text = await file.text();
      const base = file.name.replace(/\.[^.]+$/, "");
      additions.push({ ...newTranscript(), name: base, text });
    }
    if (additions.length > 0) onChange([...transcripts, ...additions]);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Upload the 7 conversation transcripts</h3>
        <p className="muted">
          Drop plain-text files (.txt, .md) or paste each conversation below. Add
          the person&apos;s name and role so the analysis can cross-reference who
          shares which pain points.
        </p>

        <div className="slot-row" aria-label={`${filled.length} of ${SLOT_COUNT} transcripts loaded`}>
          {Array.from({ length: Math.max(SLOT_COUNT, filled.length) }, (_, i) => (
            <span key={i} className={`slot${i < filled.length ? " filled" : ""}`}>
              {i + 1}
            </span>
          ))}
          <span className="muted" style={{ marginLeft: 8 }}>
            {filled.length}/{SLOT_COUNT} loaded
          </span>
        </div>

        <div
          className={`dropzone${dragging ? " dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void ingestFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInput.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInput.current?.click();
          }}
        >
          Drag &amp; drop transcript files here, or click to browse
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.md,.text,text/plain"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void ingestFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={addBlank}>
            + Paste a transcript manually
          </button>
          <button
            className="btn primary"
            onClick={onAnalyze}
            disabled={analyzing || filled.length === 0}
          >
            {analyzing
              ? "Analyzing conversations…"
              : hasAnalysis
                ? `Re-run analysis on ${filled.length} transcript${filled.length === 1 ? "" : "s"}`
                : `Build the roadmap from ${filled.length} transcript${filled.length === 1 ? "" : "s"}`}
          </button>
        </div>
        {analyzing && (
          <p className="muted" style={{ marginTop: 10 }} aria-live="polite">
            {progress ??
              "Claude is reading every conversation, scoring pain points, and cross-referencing themes."}{" "}
            Each transcript is digested individually, then cross-referenced — already-digested
            transcripts are skipped, so re-runs are fast.
          </p>
        )}
      </div>

      {transcripts.map((t, i) => (
        <div key={t.id} className="card transcript-editor" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
            <strong className="display" style={{ fontSize: 16 }}>
              Transcript {i + 1}
            </strong>
            {t.digest ? (
              <span className="pill kelp" title="Digested — will be skipped on re-runs unless edited">
                ✓ digested
              </span>
            ) : t.text.trim() ? (
              <span className="pill">not digested yet</span>
            ) : null}
            <input
              placeholder="Name (e.g. Maya)"
              value={t.name}
              onChange={(e) => update(t.id, { name: e.target.value })}
            />
            <input
              placeholder="Role / team (e.g. Member Experience)"
              value={t.role}
              onChange={(e) => update(t.id, { role: e.target.value })}
            />
            <button
              className="btn ghost"
              style={{ marginLeft: "auto" }}
              onClick={() => remove(t.id)}
            >
              Remove
            </button>
          </div>
          <textarea
            placeholder="Paste the full conversation here…"
            value={t.text}
            onChange={(e) => update(t.id, { text: e.target.value })}
          />
          <p className="muted" style={{ marginTop: 6 }}>
            {t.text.trim().length.toLocaleString()} characters
          </p>
        </div>
      ))}

      {transcripts.length === 0 && (
        <div className="empty-state">
          <h2>No transcripts yet</h2>
          <p>Upload or paste the 7 employee conversations to get started.</p>
        </div>
      )}
    </div>
  );
}
