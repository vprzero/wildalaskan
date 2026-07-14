import { NextRequest, NextResponse } from "next/server";

// Site-wide password gate. Set SITE_PASSWORD in the environment to enable;
// when unset (e.g. local dev) the site is open. Protects pages, /seed.json
// (which contains the raw transcripts), and the API routes.

async function accessToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:wac-gate-v1`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const expected = await accessToken(password);
  const cookie = req.cookies.get("wac_access")?.value;
  if (cookie === expected) return NextResponse.next();

  // API calls get a JSON 401 rather than a redirect.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Locked — enter the site password first." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the unlock screen itself, its API, and build assets.
  matcher: ["/((?!unlock|api/unlock|_next/|favicon.ico).*)"],
};
