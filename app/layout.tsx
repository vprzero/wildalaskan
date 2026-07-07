import type { Metadata } from "next";
// Brand typography (self-hosted): Fraunces for display/headings, Nunito Sans for body.
import "@fontsource-variable/fraunces";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Compass — Wild Alaskan Company",
  description:
    "Interactive AI-adoption consultant for The Wild Alaskan Company: upload employee transcripts, map pain points and opportunities, and get a phased onboarding roadmap.",
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
