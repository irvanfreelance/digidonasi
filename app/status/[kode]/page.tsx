import { notFound } from "next/navigation";
import { PublicScaffold } from "@/components/public/scaffold";
import { dbQuery } from "@/lib/db";
import { getInvoice } from "@/lib/donasi/catalog";

export const dynamic = "force-dynamic";

export default async function StatusPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  let invoice: Record<string, unknown> | null = null;
  try {
    invoice = await getInvoice(dbQuery, kode);
  } catch {
    invoice = null;
  }
  if (!invoice) notFound();
  return <PublicScaffold title="Status pembayaran" body={`${kode}: ${String(invoice.status)}. Pembayaran mock belum lunas.`} />;
}
