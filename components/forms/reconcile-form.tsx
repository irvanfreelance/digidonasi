"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReconcileForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <form
      className="grid max-w-lg gap-2 rounded-2xl bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void fetch("/api/panel/pembayaran", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceCode: data.get("invoiceCode"), action: data.get("action"), reason: data.get("reason") }),
        }).then(async (response) => {
          const json = (await response.json()) as { error?: string; status?: string };
          setMessage(response.ok ? `Status ${json.status}` : json.error || "Ditolak");
          if (response.ok) router.refresh();
        });
      }}
    >
      <h2 className="m-0 text-[16px]">Rekonsiliasi manual</h2>
      <input name="invoiceCode" required placeholder="Kode invoice" className="min-h-11 px-3" />
      <select name="action" className="min-h-11 px-3">
        <option value="cek">Cek ulang, tanpa ubah status</option>
        <option value="gagal">Tandai gagal</option>
        <option value="kedaluwarsa">Tandai kedaluwarsa</option>
      </select>
      <textarea name="reason" required minLength={3} placeholder="Alasan tercatat di audit" className="min-h-20 px-3 py-2" />
      <button className="min-h-11 rounded-xl bg-[var(--primary)] px-3 text-[13px] font-semibold text-white" type="submit">Catat</button>
      {message ? <p className="m-0 text-[13px]">{message}</p> : null}
    </form>
  );
}
