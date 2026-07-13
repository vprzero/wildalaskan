import type { Metadata } from "next";
// Typography (Google fonts, self-hosted): Fraunces — a refined editorial serif —
// for headlines, Source Sans 3 for body/UI.
import "@fontsource-variable/fraunces";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halfdays AI × Wild Alaskan — AI Opportunity Roadmap",
  description:
    "Helping the Wild Alaskan marketing team get more from the AI tools they already use: upload conversation transcripts, map pain points and opportunities, and get a phased adoption roadmap.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
