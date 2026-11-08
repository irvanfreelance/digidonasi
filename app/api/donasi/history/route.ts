import { blocked, decide } from "@/lib/auth/http";

export function GET(request: Request) {
  const decision = decide(request);
  const denied = blocked(decision);
  if (denied) return denied;
  return Response.json({ rows: [] });
}
