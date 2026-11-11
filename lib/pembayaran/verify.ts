import { createHash, timingSafeEqual } from "node:crypto";

export type ProviderCode = "xendit" | "midtrans";
export type MappedStatus = "pending" | "paid" | "failed";

export function paymentMode(): "mock" | "live" {
  return process.env.PAYMENT_MODE === "live" ? "live" : "mock";
}

export function expiryMinutes() {
  const parsed = Number(process.env.PAYMENT_EXPIRY_MINUTES || "1440");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1440;
}

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyXenditToken(header: string | null, expected = process.env.XENDIT_CALLBACK_TOKEN || "") {
  if (!header || !expected) return false;
  return same(header, expected);
}

export function midtransSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string) {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

export function verifyMidtransSignature(input: { orderId: string; statusCode: string; grossAmount: string; signature: string | null; serverKey?: string }) {
  const key = input.serverKey ?? process.env.MIDTRANS_SERVER_KEY ?? "";
  if (!input.signature || !key) return false;
  return same(input.signature, midtransSignature(input.orderId, input.statusCode, input.grossAmount, key));
}

export function mapXenditStatus(status: string): MappedStatus | null {
  const value = status.toUpperCase();
  if (value === "PAID" || value === "SETTLED") return "paid";
  if (value === "EXPIRED" || value === "FAILED") return "failed";
  if (value === "PENDING") return "pending";
  return null;
}

export function mapMidtransStatus(status: string): MappedStatus | null {
  if (status === "settlement" || status === "capture") return "paid";
  if (status === "expire" || status === "deny" || status === "cancel" || status === "failure") return "failed";
  if (status === "pending") return "pending";
  return null;
}

export function faspayRejected(code: string) {
  return code === "faspay_snap" || code === "faspay_legacy" || code.includes("faspay");
}

export type ChargeResult = { providerRef: string; instruction: string; live: false };

export async function createCharge(input: { provider: ProviderCode; invoiceCode: string; amount: number }, fetchImpl: typeof fetch = fetch): Promise<ChargeResult> {
  const liveReady = paymentMode() === "live" && (input.provider === "xendit" ? process.env.XENDIT_SECRET_KEY : process.env.MIDTRANS_SERVER_KEY);
  if (!liveReady) {
    return { providerRef: `mock-${input.provider}-${input.invoiceCode}`, instruction: "Charge uji lokal. Sandbox penyedia belum tervalidasi.", live: false };
  }
  const response = await fetchImpl(input.provider === "xendit" ? "https://api.xendit.co/v2/invoices" : "https://api.midtrans.com/v2/charge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ external_id: input.invoiceCode, amount: input.amount }),
  });
  if (!response.ok) throw new Error("charge_ditolak");
  const json = (await response.json()) as { id?: string };
  return { providerRef: json.id || `live-${input.invoiceCode}`, instruction: "Charge sandbox. Belum diverifikasi di paket ini.", live: false };
}
