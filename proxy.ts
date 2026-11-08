import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gate } from "@/lib/auth/access";
import { cookieJar } from "@/lib/auth/flow";
import { websiteEnabled } from "@/lib/env";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/login") {
    const next = new URL("/panel/login", request.url);
    if (search) next.search = search;
    return NextResponse.redirect(next);
  }
  const decision = gate(pathname, cookieJar(request.headers.get("cookie")), websiteEnabled(), request.method);
  if (decision.kind === "redirect") {
    return NextResponse.redirect(new URL(decision.url, request.url));
  }
  if (decision.kind === "deny") {
    const headers = { "Cache-Control": "no-store" };
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: decision.message }, { status: decision.status, headers });
    }
    return new NextResponse(decision.message, {
      status: decision.status,
      headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (pathname === "/panel" && decision.session?.role === "SUPERADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:png|svg|jpg|jpeg|webp|ico)$).*)"],
};
