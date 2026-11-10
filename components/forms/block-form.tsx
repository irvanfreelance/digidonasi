"use client";

import { useState } from "react";

export function BlockForm({ blocks }: { blocks: { seed_key: string; heading: string | null; body: string | null; publication_status: string }[] }) {
  const [key, setKey] = useState(blocks[0]?.seed_key ?? "");
  const current = blocks.find((block) => block.seed_key === key) ?? blocks[0];
  if (!current) return null;
  return (
    <form
      className="grid max-w-xl gap-2 rounded-2xl bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void fetch("/api/panel/blok", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seedKey: current.seed_key,
            heading: String(data.get("heading") || ""),
            body: String(data.get("body") || ""),
            status: String(data.get("status") || "DRAFT"),
          }),
        }).then(() => window.location.reload());
      }}
    >
      <h2 className="m-0 text-[16px]">Blok beranda donasi</h2>
      <select className="min-h-11 px-3" value={key} onChange={(event) => setKey(event.target.value)}>
        {blocks.map((block) => (
          <option key={block.seed_key} value={block.seed_key}>
            {block.seed_key}
          </option>
        ))}
      </select>
      <input name="heading" key={`${current.seed_key}-h`} defaultValue={current.heading ?? ""} className="min-h-11 px-3" />
      <textarea name="body" key={`${current.seed_key}-b`} defaultValue={current.body ?? ""} className="min-h-24 px-3 py-2" />
      <select name="status" key={`${current.seed_key}-s`} defaultValue={current.publication_status} className="min-h-11 px-3">
        <option>DRAFT</option>
        <option>ACTIVE</option>
      </select>
      <button type="submit" className="min-h-11 rounded-xl bg-[var(--primary)] px-3 text-[13px] font-semibold text-white">
        Simpan blok
      </button>
    </form>
  );
}
