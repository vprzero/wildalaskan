import type { Metadata } from "next";
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
