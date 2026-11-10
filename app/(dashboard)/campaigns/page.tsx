import { JsonPost } from "@/components/forms/json-post";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CampaignAdminPage() {
  let campaigns: Record<string, unknown>[] = [];
  let categories: Record<string, unknown>[] = [];
  let error = "";
  try {
    campaigns = await dbQuery(`SELECT slug, title, publication_status, minimum_amount FROM campaigns ORDER BY sort_order, id`);
    categories = await dbQuery(`SELECT slug, name FROM categories ORDER BY sort_order, id`);
  } catch {
    error = "Basis belum terbaca.";
  }
  const slugs = campaigns.map((row) => String(row.slug));
  const categorySlugs = categories.map((row) => String(row.slug));
  return (
    <section className="grid gap-4">
      <h1 className="mt-0 text-[20px] font-bold text-[var(--primary)]">Kampanye</h1>
      <p className="m-0 max-w-xl text-[13px] text-[#555]">Superadmin menayangkan kampanye, varian, bundel, dan kabar. Kabar adalah konten, bukan penyaluran operasional.</p>
      {error ? <p>{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl bg-white">
        <table className="w-full min-w-[520px] text-left text-[13px]">
          <thead>
            <tr>
              <th className="p-2">Slug</th>
              <th className="p-2">Judul</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((row) => (
              <tr key={String(row.slug)} className="border-t border-[#eee]">
                <td className="p-2">{String(row.slug)}</td>
                <td className="p-2">{String(row.title)}</td>
                <td className="p-2">{String(row.publication_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <JsonPost action="status" label="Tayangkan">
          <Select name="slug" values={slugs} />
          <Select name="status" values={["DRAFT", "ACTIVE", "ARCHIVED"]} />
        </JsonPost>
        <JsonPost action="campaign" label="Judul dan minimal">
          <Select name="slug" values={slugs} />
          <input name="title" placeholder="Judul" className="min-h-11 px-3" required />
          <input name="summary" placeholder="Ringkasan" className="min-h-11 px-3" required />
          <input name="minimumAmount" type="number" placeholder="Minimal" className="min-h-11 px-3" required />
        </JsonPost>
        <JsonPost action="category" label="Kategori">
          <Select name="slug" values={categorySlugs} />
          <input name="name" placeholder="Nama kategori" className="min-h-11 px-3" required />
        </JsonPost>
        <JsonPost action="variant" label="Varian qurban">
          <Select name="campaignSlug" values={slugs} />
          <input name="name" placeholder="Nama varian" className="min-h-11 px-3" required />
          <input name="price" type="number" placeholder="Harga" className="min-h-11 px-3" required />
          <input name="namesPerQty" type="number" defaultValue={1} className="min-h-11 px-3" required />
        </JsonPost>
        <JsonPost action="bundle" label="Anak bundel">
          <Select name="bundleSlug" values={slugs} />
          <Select name="itemSlug" values={slugs} />
          <input name="qty" type="number" defaultValue={1} className="min-h-11 px-3" required />
        </JsonPost>
        <JsonPost action="update" label="Kabar konten">
          <Select name="campaignSlug" values={slugs} />
          <input name="title" placeholder="Judul kabar" className="min-h-11 px-3" required />
          <textarea name="body" placeholder="Isi kabar, bukan penyaluran" className="min-h-24 px-3 py-2" required />
        </JsonPost>
      </div>
    </section>
  );
}

function Select({ name, values }: { name: string; values: string[] }) {
  return (
    <select name={name} className="min-h-11 px-3" defaultValue={values[0]}>
      {values.map((value) => (
        <option key={value}>{value}</option>
      ))}
    </select>
  );
}
