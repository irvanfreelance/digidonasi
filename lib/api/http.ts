import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function notImplemented(moduleName: string) {
  return NextResponse.json(
    { error: `Kerangka hari 1. Modul ${moduleName} belum diimplementasikan.` },
    { status: 501 },
  );
}

export function zodError(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
