import { unauthorized } from "@/lib/api/http";

export function GET() {
  return unauthorized();
}
