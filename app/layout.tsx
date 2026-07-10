import type { Metadata } from "next";
// Display font: Baloo 2 — closest webfont match to the chunky hand-cut headline
// lettering on wildalaskancompany.com. Body stays on the Helvetica Neue system stack.
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
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
