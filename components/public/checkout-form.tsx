"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CheckoutForm({
  slug,
  minimum,
  fixed,
  qurban,
  variants,
  bundles,
}: {
  slug: string;
  minimum: number;
  fixed: boolean;
  qurban: boolean;
  variants: { id: string; name: string; price_rupiah: string; names_per_qty: number }[];
  bundles: { slug: string; title: string; qty: number }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    const qty = Number(form.get("qty") || 1);
    const names = String(form.get("names") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const lines = bundles.map((item) => ({ slug: item.slug, qty: Number(item.qty), amount: Number(form.get(`line-${item.slug}`) || 0) }));
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        qty,
        amount: form.get("amount") ? Number(form.get("amount")) : undefined,
        variantId: form.get("variantId") ? Number(form.get("variantId")) : null,
        names,
        lines: bundles.length ? lines : undefined,
        donorName: String(form.get("donorName") || ""),
        donorEmail: String(form.get("donorEmail") || ""),
        anonymous: form.get("anonymous") === "on",
      }),
    });
    setPending(false);
    const json = (await response.json()) as { invoiceCode?: string; error?: string; instruction?: string };
    if (!response.ok || !json.invoiceCode) {
      setMessage(json.error || "Checkout ditolak");
      return;
    }
    router.push(`/invoice/${json.invoiceCode}`);
  }

  return (
    <form
      className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
    >
      <p className="m-0 text-[13px] text-[#555]">Pembayaran mock. Belum masuk ke Xendit atau Midtrans. {fixed ? `Nominal tetap ${minimum}.` : `Minimal ${minimum}.`}</p>
      {qurban ? (
        <label className="text-[13px]">
          Varian
          <select name="variantId" className="mt-1 min-h-11 w-full px-3" required>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name} · {variant.price_rupiah} · {variant.names_per_qty} nama
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {bundles.length ? (
        bundles.map((item) => (
          <label key={item.slug} className="text-[13px]">
            {item.title} × {item.qty}
            <input name={`line-${item.slug}`} type="number" min={0} required className="mt-1 min-h-11 w-full px-3" />
          </label>
        ))
      ) : (
        <label className="text-[13px]">
          Nominal
          <input name="amount" type="number" min={0} required className="mt-1 min-h-11 w-full px-3" />
        </label>
      )}
      <label className="text-[13px]">
        Jumlah
        <input name="qty" type="number" min={1} defaultValue={1} className="mt-1 min-h-11 w-full px-3" />
      </label>
      {qurban ? (
        <label className="text-[13px]">
          Nama mudhohi, satu baris satu nama
          <textarea name="names" required className="mt-1 min-h-24 w-full px-3 py-2" />
        </label>
      ) : null}
      <label className="text-[13px]">
        Nama
        <input name="donorName" required minLength={2} className="mt-1 min-h-11 w-full px-3" />
      </label>
      <label className="text-[13px]">
        Email, opsional untuk tamu
        <input name="donorEmail" type="email" className="mt-1 min-h-11 w-full px-3" />
      </label>
      <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-[var(--primary)] px-3 text-[13px] font-semibold text-white disabled:opacity-50">
        {pending ? "Memproses…" : "Buat invoice mock"}
      </button>
      {message ? <p className="m-0 text-[13px] text-[#9b2c2c]">{message}</p> : null}
    </form>
  );
}
