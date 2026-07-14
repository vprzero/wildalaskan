"use client";

import { useState } from "react";

export default function Unlock() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "That password isn't right — try again.");
      setBusy(false);
    } catch {
      setError("Something went wrong — try again.");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ maxWidth: 440, width: "100%", padding: "40px 42px", textAlign: "center" }}>
        <p className="eyebrow">Wild Alaskan Company</p>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>AI Opportunity Roadmap</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          This report contains team insights and is password protected.
        </p>
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input
            type="password"
            autoFocus
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 15,
              textAlign: "center",
              background: "#f7fafc",
            }}
          />
          <button className="btn primary" type="submit" disabled={busy || !password.trim()}>
            {busy ? "Unlocking…" : "View the roadmap"}
          </button>
        </form>
        {error && (
          <p className="error-banner" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}
        <p className="muted" style={{ marginTop: 20, fontSize: 12.5 }}>
          Prepared by Halfdays AI · need access? Ask your Halfdays contact.
        </p>
      </div>
    </div>
  );
}
