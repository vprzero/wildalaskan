"use client";

import { useEffect, useState } from "react";
import { Chat } from "@/components/Chat";
import { Dashboard } from "@/components/Dashboard";
import { Learning } from "@/components/Learning";
import { Matrix } from "@/components/Matrix";
import { People } from "@/components/People";
import { Roadmap } from "@/components/Roadmap";
import { Transcripts } from "@/components/Transcripts";
import { contentHash } from "@/lib/hash";
import { store } from "@/lib/store";
import type { Analysis, ChatMessage, PersonInsight, Transcript } from "@/lib/types";

type Tab =
  | "transcripts"
  | "dashboard"
  | "people"
  | "matrix"
  | "roadmap"
  | "learning"
  | "consultant";

const TABS: { id: Tab; label: string; needsAnalysis: boolean }[] = [
  { id: "transcripts", label: "1 · Transcripts", needsAnalysis: false },
  { id: "dashboard", label: "2 · Overview", needsAnalysis: true },
  { id: "people", label: "3 · People", needsAnalysis: true },
  { id: "matrix", label: "4 · Priority matrix", needsAnalysis: true },
  { id: "roadmap", label: "5 · Roadmap", needsAnalysis: true },
  { id: "learning", label: "6 · Learning paths", needsAnalysis: true },
  { id: "consultant", label: "🧭 Consultant", needsAnalysis: false },
];

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("transcripts");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [memory, setMemory] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Client (read-only) view: no upload tab, no data utilities. Turned on
  // automatically when this browser was populated from the bundled seed;
  // ?admin=1 turns it off for editing.
  const [clientMode, setClientMode] = useState(false);

  // Hydrate from localStorage once on the client.
  useEffect(() => {
    const savedTranscripts = store.loadTranscripts();
    const saved = store.loadAnalysis();
    setTranscripts(savedTranscripts);
    setAnalysis(saved);
    setChat(store.loadChat());
    setMemory(store.loadMemory());
    if (saved) setTab("dashboard");

    // ?admin=1 unlocks the full workbench on any browser; otherwise honor
    // whatever mode this browser was in last time.
    const isAdmin = new URLSearchParams(window.location.search).get("admin") === "1";
    if (isAdmin) {
      store.saveClientMode(false);
      setClientMode(false);
    } else {
      setClientMode(store.loadClientMode());
    }
    setHydrated(true);

    // First visit on this browser (nothing stored): preload the bundled seed,
    // if the deployment ships one at public/seed.json. This is how a client
    // sees the full populated roadmap without importing anything — and seed
    // viewers get the read-only client view.
    if (savedTranscripts.length === 0 && !saved) {
      fetch("/seed.json")
        .then(async (res) => {
          if (!res.ok) return;
          const seed = await res.json().catch(() => null);
          if (seed?.app !== "wac-ai-compass") return;
          if (Array.isArray(seed.transcripts)) setTranscripts(seed.transcripts);
          if (Array.isArray(seed.memory)) setMemory(seed.memory);
          if (seed.analysis) {
            setAnalysis(seed.analysis);
            setTab("dashboard");
          }
          if (!isAdmin) {
            store.saveClientMode(true);
            setClientMode(true);
          }
        })
        .catch(() => {
          /* no seed bundled — nothing to do */
        });
    }
  }, []);

  // Persist on change (after hydration, so we don't clobber saved state).
  useEffect(() => {
    if (hydrated) store.saveTranscripts(transcripts);
  }, [transcripts, hydrated]);
  useEffect(() => {
    if (hydrated) store.saveAnalysis(analysis);
  }, [analysis, hydrated]);
  useEffect(() => {
    if (hydrated) store.saveChat(chat);
  }, [chat, hydrated]);
  useEffect(() => {
    if (hydrated) store.saveMemory(memory);
  }, [memory, hydrated]);

  // Digest one transcript, retrying transient failures (overloaded/rate-limit/gateway)
  // with backoff before surfacing an error to the user.
  async function digestOne(t: Transcript, index: number): Promise<PersonInsight> {
    const RETRYABLE = [429, 502, 503, 529];
    const DELAYS_MS = [4000, 12000, 30000];
    let lastError = "digest failed";
    for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name,
          role: t.role,
          text: t.text,
          label: `Transcript ${index + 1}`,
        }),
      }).catch(() => null);

      if (res?.ok) {
        const data = await res.json();
        return data.person as PersonInsight;
      }

      if (res) {
        const data = await res.json().catch(() => null);
        lastError = data?.error ?? `digest failed (${res.status})`;
        if (!RETRYABLE.includes(res.status)) break;
      } else {
        lastError = "network error while digesting";
      }

      if (attempt < DELAYS_MS.length) {
        setProgress(
          `Claude is busy — retrying ${t.name || `Transcript ${index + 1}`} in ${DELAYS_MS[attempt] / 1000}s…`,
        );
        await new Promise((r) => setTimeout(r, DELAYS_MS[attempt]));
      }
    }
    throw new Error(`${t.name || `Transcript ${index + 1}`}: ${lastError}`);
  }

  // Two-stage pipeline: digest each transcript individually (cached by content hash),
  // then synthesize the compact digests into the company-wide plan.
  async function analyze() {
    setError(null);
    setAnalyzing(true);
    try {
      const working = [...transcripts];
      const jobs = working
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.text.trim().length > 0);

      // Stage 1 — digest, skipping transcripts whose cached digest is still fresh.
      // DIGEST_VERSION is part of the hash: bumping it re-digests everything once
      // (e.g. when the digest schema learns new fields like toolsUsed).
      const DIGEST_VERSION = "v2:";
      const stale = jobs.filter(
        ({ t }) =>
          !t.digest || t.digestHash !== contentHash(DIGEST_VERSION + t.name + t.role + t.text),
      );
      let done = 0;
      const CONCURRENCY = 3;
      for (let batch = 0; batch < stale.length; batch += CONCURRENCY) {
        const slice = stale.slice(batch, batch + CONCURRENCY);
        setProgress(
          `Digesting transcripts ${done + 1}–${Math.min(done + slice.length, stale.length)} of ${stale.length}…`,
        );
        // Settle the whole batch so one failure doesn't discard sibling digests.
        const results = await Promise.allSettled(slice.map(({ t, i }) => digestOne(t, i)));
        const failures: string[] = [];
        slice.forEach(({ t, i }, j) => {
          const r = results[j];
          if (r.status === "fulfilled") {
            working[i] = {
              ...t,
              digest: r.value,
              digestHash: contentHash(DIGEST_VERSION + t.name + t.role + t.text),
            };
          } else {
            failures.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
          }
        });
        done += slice.length;
        setTranscripts([...working]);
        if (failures.length > 0) {
          throw new Error(
            `${failures.join(" · ")} — everything else was digested and saved; click the button again to retry just the failed one${failures.length === 1 ? "" : "s"}.`,
          );
        }
      }

      // Stage 2 — synthesize across all digests (with the same transient-error retry).
      const people = working
        .filter((t) => t.text.trim().length > 0 && t.digest)
        .map((t) => t.digest as PersonInsight);
      const RETRYABLE = [429, 502, 503, 529];
      const DELAYS_MS = [4000, 12000, 30000];
      let data: { analysis?: Analysis; error?: string } | null = null;
      for (let attempt = 0; attempt <= DELAYS_MS.length; attempt++) {
        setProgress("Cross-referencing digests into the roadmap…");
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ people }),
        }).catch(() => null);
        data = res ? await res.json().catch(() => null) : null;
        if (res?.ok && data?.analysis) break;
        const retryable = !res || RETRYABLE.includes(res.status);
        if (!retryable || attempt === DELAYS_MS.length) {
          throw new Error(data?.error ?? `Synthesis failed${res ? ` (${res.status})` : ""}`);
        }
        setProgress(`Claude is busy — retrying the synthesis in ${DELAYS_MS[attempt] / 1000}s…`);
        await new Promise((r) => setTimeout(r, DELAYS_MS[attempt]));
      }
      setAnalysis(data!.analysis as Analysis);
      setTab("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
      setProgress(null);
    }
  }

  // Download everything (transcripts, digests, analysis, chat, memory) as one
  // JSON file — insurance against per-URL localStorage (Vercel preview URLs
  // change per deployment) and a way to move data between browsers.
  function exportBackup() {
    const payload = {
      app: "wac-ai-compass",
      version: 1,
      exportedAt: new Date().toISOString(),
      transcripts,
      analysis,
      chat,
      memory,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wild-alaskan-ai-roadmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File) {
    setError(null);
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.app !== "wac-ai-compass") {
        throw new Error("That file doesn't look like a backup from this app.");
      }
      if (Array.isArray(payload.transcripts)) setTranscripts(payload.transcripts);
      if (payload.analysis) setAnalysis(payload.analysis);
      if (Array.isArray(payload.chat)) setChat(payload.chat);
      if (Array.isArray(payload.memory)) setMemory(payload.memory);
      setTab(payload.analysis ? "dashboard" : "transcripts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that backup file.");
    }
  }

  function resetAll() {
    if (
      !window.confirm(
        "This clears all transcripts, the analysis, chat history, and the consultant's memory. Continue?",
      )
    )
      return;
    store.clearAll();
    setTranscripts([]);
    setAnalysis(null);
    setChat([]);
    setMemory([]);
    setTab("transcripts");
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <header className="masthead">
            <div>
              <p className="eyebrow">Wild Alaskan Company</p>
              <h1>AI Opportunity Roadmap</h1>
              <p className="sub">
                Helping the marketing team get more from the AI tools they already use.
              </p>
            </div>
          </header>

          <nav className="tabbar" aria-label="Sections">
            {TABS.filter((t) => !(clientMode && t.id === "transcripts")).map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? "active" : ""}
                disabled={t.needsAnalysis && !analysis}
                title={t.needsAnalysis && !analysis ? "Run the analysis first" : undefined}
                onClick={() => setTab(t.id)}
              >
                {clientMode ? t.label.replace(/^\d+ · /, "") : t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="gold-band">
        From real team conversations to a practical AI adoption plan
      </div>

      <div className="app-shell">
        {error && <p className="error-banner">{error}</p>}

        <main className="tab-body">
        {tab === "transcripts" && (
          <Transcripts
            transcripts={transcripts}
            onChange={setTranscripts}
            onAnalyze={() => void analyze()}
            analyzing={analyzing}
            progress={progress}
            hasAnalysis={!!analysis}
          />
        )}
        {tab === "dashboard" && analysis && <Dashboard analysis={analysis} />}
        {tab === "people" && analysis && <People analysis={analysis} />}
        {tab === "matrix" && analysis && <Matrix analysis={analysis} />}
        {tab === "roadmap" && analysis && <Roadmap analysis={analysis} />}
        {tab === "learning" && analysis && <Learning analysis={analysis} />}
        {tab === "consultant" && (
          <Chat
            messages={chat}
            onMessages={setChat}
            memory={memory}
            onMemory={setMemory}
            analysis={analysis}
            transcripts={transcripts}
          />
        )}
        </main>
      </div>

      <footer className="footer">
        <div className="footer-scallop" aria-hidden />
        <div className="footer-inner">
          <span className="wordmark">Wild Alaskan Company</span>
          <span>AI Opportunity Roadmap · prepared by Halfdays AI</span>
        </div>
        {!clientMode && (
          <div className="footer-utils">
            <button onClick={exportBackup}>Export data</button>
            <label>
              Import data
              <input
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importBackup(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button onClick={resetAll}>Reset</button>
          </div>
        )}
      </footer>
    </>
  );
}
