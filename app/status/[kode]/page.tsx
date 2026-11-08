import { PublicScaffold } from "@/components/public/scaffold";

export default async function Page({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  return (
    <PublicScaffold
      title='Status pembayaran'
      body={`Kerangka status. Belum terhubung ke penyedia. Parameter: ${kode}.`}
    />
  );
}
