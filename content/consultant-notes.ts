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
  author: "Halfdays AI",
  role: "AI Consultant",
  date: "July 2026",
  intro: [
    "After talking with Emily's team, here's what stood out: everyone already has access to the tools, and everyone has genuine support from all sides to use AI in the ways that suit them best. People know they need to communicate, be proactive, and find more time in the day — and the platforms to do it are already in place.",
    "The gap isn't tools or willingness. It's that no one is training the team on what they already have. The assumption has been that professionals will tinker, learn, and adopt on their own. What we heard instead was: “We have these things — I just don't know how to use them, how easy they are, what they connect to, or how they could fit my daily work.”",
    "That is extremely solvable. Everything this team wants to do is solvable. It takes someone pointing them in the right direction and walking through one or two real use cases — how to use Claude for this, Gemini for that, how to connect Claude to Slack or Asana. Department-specific micro-workshops and lunch-and-learns get you most of the way. And between Megan and Kelsey, the champions to drive adoption already exist in-house — which is rare. We see a clear path for these platforms to help the team win the next two months.",
  ],
  sections: [
    {
      title: "1. Build a skills library",
      paragraphs: [
        "Everyone talks about automation and pulling manual steps out of their work, yet almost no one is taking advantage of Claude skills — the single most useful capability in the Claude ecosystem for this team today. Creating presentations, synthesizing reports, standardizing recurring deliverables: these are all skills waiting to be built once.",
      ],
      bullets: [
        "Stand up a shared skills database the whole department can browse and reuse",
        "Teach the basics in one session: how to create a skill, edit it, and put it to work",
        "Start with the obvious wins — the WBR deck, report synthesis, presentation formatting",
      ],
    },
    {
      title: "2. Turn on connectors",
      paragraphs: [
        "Claude connects directly to the platforms the team already lives in — Asana, Slack, and more. The unlock is knowledge sharing: figuring out which connections matter, who has them working, and how they're using them, so the tide rises for everyone.",
      ],
      bullets: [
        "Inventory which of the team's platforms can be connected today",
        "Have the first person who connects each one demo it for the group",
        "Prioritize the Slack and Asana connections — they touch everyone's daily work",
      ],
    },
    {
      title: "3. Put artifacts to work",
      paragraphs: [
        "Claude artifacts — interactive web apps, dashboards, and new ways to visualize data — are a huge unlock, and they compound with everything above: artifacts can present the data the connectors pull and the skills format. (The roadmap you're reading right now is one.)",
      ],
    },
    {
      title: "4. Bonus: let Claude triage your inbox",
      paragraphs: [
        "With Claude Cowork, email becomes a morning briefing instead of a chore. Not answering email for you — educating you on what you've missed. Wake up and ask: “Go through my email, figure out what I missed, and surface what I need to respond to first.” It is genuinely good at this, and getting everyone set up with Cowork is the move.",
      ],
    },
    {
      title: "Consolidate, and make it official",
      paragraphs: [
        "The team is in a great place — what's left is streamlining. Get the Claude team account stood up and everyone onboarded, while leaning into what people already use day-to-day (many are still on ChatGPT and Gemini, and every seat costs money — consolidate deliberately, not punitively).",
        "Just as important: the marketing department should iron out its own internal stance on AI. That moves people from “what should we be doing?” to “this is how we do it here” — and when someone trips, they can tap the person next to them, get up to speed, and keep the department moving forward.",
      ],
    },
    {
      title: "Our readiness score: 87%",
      paragraphs: [
        "We'd put the marketing department at 87% AI readiness. The leaders — Emily, Kelsey, and Clifford — are strong proponents of making Claude (and AI broadly) succeed here. From this point, it comes down to four things:",
      ],
      bullets: [
        "Knowledge share — make what one person learns available to all",
        "Communicating how the department will use AI, clearly and early",
        "Setting the goals the marketing department wants for itself",
        "Letting AI facilitate those goals — not the other way around",
      ],
    },
  ],
  closing:
    "Once the team learns these basics, they'll discover how easy it is to communicate with Claude, connect it to their tools, and bend it to their specific needs — and the great habits follow from there. The foundation is already in place; now it's about clarity, champions, and momentum.",
};
