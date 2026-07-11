import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intl = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  // www is attached to the same Worker as the apex (both are Cloudflare custom
  // domains), so it would serve duplicate content; 301 it to the canonical
  // apex instead, preserving path + query.
  if (req.headers.get("host") === "www.frizerescu.ro") {
    const url = req.nextUrl.clone();
    url.protocol = "https";
    url.host = "frizerescu.ro";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }
  return intl(req);
}

export const config = {
  matcher: ["/", "/(ro|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
