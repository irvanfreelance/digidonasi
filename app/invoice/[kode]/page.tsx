import { notFound } from "next/navigation";
import { PublicScaffold } from "@/components/public/scaffold";
import { dbQuery } from "@/lib/db";
import { getInvoice } from "@/lib/donasi/catalog";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  let invoice: Record<string, unknown> | null = null;
  try {
    invoice = await getInvoice(dbQuery, kode);
  } catch {
    invoice = null;
  }
  if (!invoice) notFound();
  return (
    <PublicScaffold title={`Invoice ${kode}`}>
      <dl className="mt-4 grid gap-2 rounded-2xl bg-white p-4 text-[14px] shadow-sm">
        <div>Nama: {String(invoice.donor_name_snapshot)}</div>
        <div>Total: {String(invoice.total_amount)}</div>
        <div>Status: {String(invoice.status)}</div>
        <div>Adapter: {String(invoice.provider_ref)} — Xendit dan Midtrans belum dihubungkan.</div>
      </dl>
    </PublicScaffold>
  );
}
