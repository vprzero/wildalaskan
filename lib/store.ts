// Client-side persistence. Everything the app knows — transcripts, the generated
// analysis, chat history, and the consultant's durable memory notes — is kept in
// localStorage so it survives reloads and future sessions on the same browser.

import type { Analysis, ChatMessage, Transcript } from "./types";

const KEYS = {
  transcripts: "wac-ai-compass:transcripts",
  analysis: "wac-ai-compass:analysis",
  chat: "wac-ai-compass:chat",
  memory: "wac-ai-compass:memory",
  clientMode: "wac-ai-compass:client-mode",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked — nothing sensible to do client-side.
  }
}

export const store = {
  loadTranscripts: (): Transcript[] => read(KEYS.transcripts, []),
  saveTranscripts: (t: Transcript[]) => write(KEYS.transcripts, t),

  loadAnalysis: (): Analysis | null => read<Analysis | null>(KEYS.analysis, null),
  saveAnalysis: (a: Analysis | null) => write(KEYS.analysis, a),

  loadChat: (): ChatMessage[] => read(KEYS.chat, []),
  saveChat: (m: ChatMessage[]) => write(KEYS.chat, m),

  loadMemory: (): string[] => read(KEYS.memory, []),
  saveMemory: (notes: string[]) => write(KEYS.memory, notes),

  loadClientMode: (): boolean => read(KEYS.clientMode, false),
  saveClientMode: (on: boolean) => write(KEYS.clientMode, on),

  clearAll: () => {
    Object.values(KEYS).forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
  },
};
