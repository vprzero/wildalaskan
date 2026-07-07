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

  // Hydrate from localStorage once on the client.
  useEffect(() => {
    setTranscripts(store.loadTranscripts());
    const saved = store.loadAnalysis();
    setAnalysis(saved);
    setChat(store.loadChat());
    setMemory(store.loadMemory());
    if (saved) setTab("dashboard");
    setHydrated(true);
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

  async function digestOne(t: Transcript, index: number): Promise<PersonInsight> {
    const res = await fetch("/api/digest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t.name,
        role: t.role,
        text: t.text,
        label: `Transcript ${index + 1}`,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `${t.name || `Transcript ${index + 1}`}: ${data?.error ?? `digest failed (${res.status})`}`,
      );
    }
    return data.person as PersonInsight;
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
      const stale = jobs.filter(
        ({ t }) => !t.digest || t.digestHash !== contentHash(t.name + t.role + t.text),
      );
      let done = 0;
      const CONCURRENCY = 3;
      for (let batch = 0; batch < stale.length; batch += CONCURRENCY) {
        const slice = stale.slice(batch, batch + CONCURRENCY);
        setProgress(
          `Digesting transcripts ${done + 1}–${Math.min(done + slice.length, stale.length)} of ${stale.length}…`,
        );
        const results = await Promise.all(slice.map(({ t, i }) => digestOne(t, i)));
        slice.forEach(({ t, i }, j) => {
          working[i] = {
            ...t,
            digest: results[j],
            digestHash: contentHash(t.name + t.role + t.text),
          };
        });
        done += slice.length;
        setTranscripts([...working]);
      }

      // Stage 2 — synthesize across all digests.
      setProgress("Cross-referencing digests into the roadmap…");
      const people = working
        .filter((t) => t.text.trim().length > 0 && t.digest)
        .map((t) => t.digest as PersonInsight);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Synthesis failed (${res.status})`);
      setAnalysis(data.analysis as Analysis);
      setTab("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
      setProgress(null);
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
    <div className="app-shell">
      <header className="masthead">
        <div>
          <h1>
            AI <span className="accent">Compass</span>
          </h1>
          <p className="sub">
            The Wild Alaskan Company · from 7 conversations to a company-wide AI
            onboarding roadmap
          </p>
        </div>
        <button className="btn ghost" onClick={resetAll}>
          Reset everything
        </button>
      </header>

      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "active" : ""}
            disabled={t.needsAnalysis && !analysis}
            title={t.needsAnalysis && !analysis ? "Run the analysis first" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

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
          />
        )}
      </main>
    </div>
  );
}
