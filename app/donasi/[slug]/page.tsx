import { PublicScaffold } from "@/components/public/scaffold";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PublicScaffold
      title='Detail kampanye'
      body={`Kerangka detail. Belum checkout. Parameter: ${slug}.`}
    />
  );
}
