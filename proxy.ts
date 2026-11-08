import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isWebsitePath, websiteEnabled } from "@/lib/env";

const ADMIN_PREFIXES = [
  "/dashboard",
  "/campaigns",
  "/transactions",
  "/donatur",
  "/pembayaran",
  "/affiliates",
  "/website",
  "/users",
  "/app-config",
];

function isAdminPath(pathname: string) {
  return ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/panel" || pathname.startsWith("/panel/")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (isAdminPath(pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
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
