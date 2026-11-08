import { PublicScaffold } from "@/components/public/scaffold";

export default async function Page({ params }: { params: Promise<{ nama: string }> }) {
  const { nama } = await params;
  return (
    <PublicScaffold
      title='Kategori'
      body={`Kerangka kategori. Parameter: ${nama}.`}
    />
  );
}
