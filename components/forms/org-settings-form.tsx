"use client";

import { useState } from "react";
import { toast } from "sonner";
import { btnPrimary } from "@/components/ui/button";
import type { OrgProfile } from "@/types/org";

export function OrgSettingsForm({ org }: { org: OrgProfile }) {
  const [form, setForm] = useState({
    nama: org.nama,
    namaSingkat: org.nama_singkat,
    tagline: org.tagline,
    logoUrl: org.logo_url ?? "",
    faviconUrl: org.favicon_url ?? "",
    primaryColor: org.primary_color,
    sidebarColor: org.sidebar_color,
    accentColor: org.accent_color,
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/org-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        logoUrl: form.logoUrl || null,
        faviconUrl: form.faviconUrl || null,
      }),
    });
    setSaving(false);
    if (res.status === 401) {
      toast.error("Panel belum punya sesi. Penyimpanan ditutup sampai hari 2.");
      return;
    }
    if (!res.ok) {
      toast.error("Pengaturan belum tersimpan.");
      return;
    }
    toast.success("Pengaturan lembaga tersimpan.");
  }

  const field = "mb-3 block text-[13px] text-[#333]";
  const input = "mt-1 w-full bg-white px-3 py-2 text-[14px]";

  return (
    <form
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className={field}>
          Nama
          <input className={input} value={form.nama} onChange={(event) => set("nama", event.target.value)} />
        </label>
        <label className={field}>
          Nama singkat
          <input className={input} value={form.namaSingkat} onChange={(event) => set("namaSingkat", event.target.value)} />
        </label>
        <label className={field}>
          Tagline
          <input className={input} value={form.tagline} onChange={(event) => set("tagline", event.target.value)} />
        </label>
        <label className={field}>
          URL logo
          <input className={input} value={form.logoUrl} onChange={(event) => set("logoUrl", event.target.value)} placeholder="Atau tempel URL publik" />
        </label>
        <label className={field}>
          URL favicon
          <input className={input} value={form.faviconUrl} onChange={(event) => set("faviconUrl", event.target.value)} placeholder="Kosong = pakai logo" />
        </label>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["primaryColor", "sidebarColor", "accentColor"] as const).map((key) => (
            <label key={key} className="block text-[12px] text-[#666]">
              {key === "primaryColor" ? "Utama" : key === "sidebarColor" ? "Sidebar" : "Aksen"}
              <input className={`${input} h-11`} type="color" value={form[key]} onChange={(event) => set(key, event.target.value)} />
            </label>
          ))}
        </div>
        <button type="submit" className={btnPrimary} disabled={saving} style={{ background: form.primaryColor }}>
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </div>
      <div className="overflow-hidden rounded-[10px] shadow-sm">
        <div className="p-4 text-white" style={{ background: form.sidebarColor }}>
          <div className="text-[13px] font-bold">{form.namaSingkat}</div>
          <div className="text-[10px] opacity-70">{form.tagline}</div>
          <div className="mt-3 rounded bg-white/15 px-2 py-1.5 text-[12px] font-bold">Dasbor</div>
          <div className="mt-1 px-2 py-1.5 text-[12px] opacity-80">Kampanye</div>
        </div>
        <div className="bg-white p-3 text-[12px]">
          <div className="font-bold" style={{ color: form.primaryColor }}>{form.nama}</div>
          <div className="mt-2 inline-block rounded-xl px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${form.accentColor}20`, color: form.accentColor }}>
            Preview aksen
          </div>
        </div>
      </div>
    </form>
  );
}
