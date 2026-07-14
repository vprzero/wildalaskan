// The human consultant's take — observations, opinions, and direction that go
// beyond the AI-generated analysis. Hard-coded so it ships with every deploy
// and shows for all visitors (including the read-only client view).
//
// The Recommendations tab stays hidden until `intro` or `sections` has content.
// Grover (the chat consultant) also receives these notes so his advice aligns.

export interface NoteSection {
  /** Section heading, e.g. "Start with the data connection, not the tools". */
  title: string;
  /** One or more paragraphs. */
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: string[];
}

export interface ConsultantNotes {
  author: string;
  role: string;
  /** Display date, e.g. "July 2026". */
  date: string;
  /** Opening paragraphs — the overall read. */
  intro: string[];
  sections: NoteSection[];
  /** Optional closing paragraph / sign-off. */
  closing?: string;
}

export const consultantNotes: ConsultantNotes = {
  author: "",
  role: "Halfdays AI",
  date: "",
  intro: [],
  sections: [],
  closing: "",
};
