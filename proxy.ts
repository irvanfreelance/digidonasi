import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isWebsitePath, websiteEnabled } from "@/lib/env";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/panel") && pathname !== "/panel/login") {
    const login = new URL("/panel/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (!websiteEnabled() && isWebsitePath(pathname)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (!websiteEnabled() && pathname.startsWith("/api/website")) {
    return NextResponse.json(
      { error: "Not Found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (pathname.startsWith("/api/panel")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:png|svg|jpg|jpeg|webp|ico)$).*)"],
};
