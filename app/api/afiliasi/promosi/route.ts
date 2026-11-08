import { blocked, decide } from "@/lib/auth/http";

export function POST(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  return Response.json({ error: "Tautan menyusul pada hari 5." }, { status: 501 });
}
