import { PublicScaffold } from "@/components/public/scaffold";

export default async function Page({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  return (
    <PublicScaffold
      title='Invoice'
      body={`Kerangka invoice. Tidak ada pembayaran. Parameter: ${kode}.`}
    />
  );
}
