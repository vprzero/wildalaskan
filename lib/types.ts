// Shared domain types for the AI Compass app.

export interface Transcript {
  id: string;
  /** Person's name (or best guess / label). */
  name: string;
  /** Their role or department, if known. */
  role: string;
  /** Raw transcript text. */
  text: string;
  /** Cached digest of this transcript (stage 1 output). */
  digest?: PersonInsight;
  /** Hash of name+role+text at digest time — invalidates the cache on edits. */
  digestHash?: string;
}

export interface PainPoint {
  text: string;
  /** 1 (minor annoyance) → 5 (blocking / painful daily). */
  severity: number;
  /** Short theme tag used to cross-reference across people. */
  theme: string;
}

export interface Opportunity {
  text: string;
  /** 1 → 5, expected impact if solved with AI. */
  impact: number;
  /** 1 (trivial) → 5 (major project), effort to implement. */
  effort: number;
  /** Short theme tag. */
  theme: string;
}

export interface PersonInsight {
  name: string;
  role: string;
  department: string;
  /** 1 (skeptical / no exposure) → 5 (power user). */
  aiReadiness: number;
  /** One-line summary of how they work today. */
  currentWorkflow: string;
  painPoints: PainPoint[];
  opportunities: Opportunity[];
  wants: string[];
  needs: string[];
  /** AI tools / key software this person mentions actually using. */
  toolsUsed?: string[];
  /** A representative verbatim quote from their transcript. */
  quote: string;
}

export interface ToolInsight {
  name: string;
  /** People who mentioned using it. */
  users: string[];
  /** How it's being used today. */
  currentUse: string;
  /** How to get more from it. */
  opportunity: string;
}

export interface Theme {
  name: string;
  description: string;
  /** Names of people who surfaced this theme. */
  people: string[];
  /** 1 → 5, how strongly / often it came up. */
  weight: number;
}

export interface MatrixItem {
  title: string;
  rationale: string;
  impact: number;
  effort: number;
  /** People / roles this helps. */
  beneficiaries: string[];
  /** quick-win | strategic | incremental | reconsider */
  quadrant: "quick-win" | "strategic" | "incremental" | "reconsider";
}

export interface RoadmapPhase {
  name: string;
  timeframe: string;
  objective: string;
  initiatives: string[];
  targetTeams: string[];
  tools: string[];
  successMetrics: string[];
}

export interface LearningTrack {
  audience: string;
  level: "Foundations" | "Applied" | "Advanced";
  summary: string;
  skills: string[];
  samplePrompts: string[];
}

export interface Analysis {
  companySummary: string;
  /** 4-6 crisp takeaways readable in 60 seconds. */
  tldr: string[];
  /** The AI tools people already use, cross-referenced. */
  toolLandscape: ToolInsight[];
  people: PersonInsight[];
  themes: Theme[];
  matrix: MatrixItem[];
  roadmap: RoadmapPhase[];
  learningTracks: LearningTrack[];
  /** Top cross-referenced recommendations for where to begin. */
  whereToStart: string[];
  risks: string[];
  generatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Memory {
  /** Durable facts / decisions the consultant should remember. */
  notes: string[];
}
