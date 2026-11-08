import { NextResponse } from "next/server";
import { gate, type Decision } from "@/lib/auth/access";
import { cookieJar } from "@/lib/auth/flow";
import { websiteEnabled } from "@/lib/env";

export function decide(request: Request): Decision {
  const url = new URL(request.url);
  return gate(url.pathname, cookieJar(request.headers.get("cookie")), websiteEnabled(), request.method);
}

export function blocked(decision: Decision) {
  if (decision.kind === "allow") return null;
  if (decision.kind === "redirect") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    { error: decision.message },
    { status: decision.status, headers: { "Cache-Control": "no-store" } },
  );
}
