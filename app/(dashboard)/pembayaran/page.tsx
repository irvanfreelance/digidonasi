import { dbQuery } from "@/lib/db";
import { ReconcileForm } from "@/components/forms/reconcile-form";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  let rows: Record<string, unknown>[] = [];
  try {
    rows = await dbQuery(
      `SELECT invoice_code, status, total_amount, provider_code FROM invoices ORDER BY created_at DESC, id DESC LIMIT 20`,
    );
  } catch {
    rows = [];
  }
  return (
    <section className="grid gap-4">
      <h1 className="mt-0 text-[20px] font-bold text-[var(--primary)]">Pembayaran</h1>
      <p className="m-0 max-w-xl text-[13px] text-[#555]">Xendit dan Midtrans diverifikasi lewat webhook. Faspay tidak bisa dipilih. Rekonsiliasi manual mencatat alasan dan tidak menambah terkumpul.</p>
      <ul className="grid gap-2 text-[13px]">
        {rows.map((row) => (
          <li key={String(row.invoice_code)} className="rounded-xl bg-white px-3 py-2">
            {String(row.invoice_code)} · {String(row.status)} · {String(row.total_amount)} · {String(row.provider_code || "mock")}
          </li>
        ))}
      </ul>
      <ReconcileForm />
    </section>
  );
}
