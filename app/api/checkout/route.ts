import { NextResponse } from "next/server";
import { withDbTransaction } from "@/lib/db";
import { COOKIE } from "@/lib/auth/doors";
import { cookieJar } from "@/lib/auth/flow";
import { authSecret, openSession } from "@/lib/auth/token";
import { DonasiError, createCheckout, isUniqueViolation, newInvoiceCode, type CheckoutInput } from "@/lib/donasi/checkout";

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutInput;
  const donor = openSession(cookieJar(request.headers.get("cookie"))[COOKIE.donor], "donor", authSecret());
  const input: CheckoutInput = {
    ...body,
    donorId: donor?.id ?? null,
    sessionEmail: donor?.email ?? null,
    sessionName: donor?.name ?? null,
  };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await withDbTransaction((sql) => createCheckout(sql, { ...input, invoiceCode: newInvoiceCode() }));
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof DonasiError) return NextResponse.json({ error: error.code }, { status: 400 });
      if (isUniqueViolation(error) && attempt < 4) continue;
      throw error;
    }
  }
  return NextResponse.json({ error: "invoice_kode_bentrok" }, { status: 409 });
}
