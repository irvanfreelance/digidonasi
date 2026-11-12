import { dbQuery, withDbTransaction } from "@/lib/db";
import { balanceOf, releaseDue, type Balance } from "@/lib/afiliasi/ledger";

export async function readAffiliate(id: string) {
  try {
    await withDbTransaction((sql) => releaseDue(sql));
    const profile = await dbQuery<{ nama: string; email: string; status: string }>(
      `SELECT nama, email, status FROM affiliates WHERE id = $1`,
      [id],
    );
    const balance = await withDbTransaction((sql) => balanceOf(sql, id));
    return { profile: profile[0] ?? null, balance };
  } catch {
    return { profile: null, balance: null as Balance | null };
  }
}

export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}
