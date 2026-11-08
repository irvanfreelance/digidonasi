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
      className="max-w-xl rounded-2xl bg-white p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
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
        <input className={input} value={form.logoUrl} onChange={(event) => set("logoUrl", event.target.value)} />
      </label>
      <label className={field}>
        URL favicon
        <input className={input} value={form.faviconUrl} onChange={(event) => set("faviconUrl", event.target.value)} />
      </label>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(["primaryColor", "sidebarColor", "accentColor"] as const).map((key) => (
          <label key={key} className="text-[12px] text-[#555]">
            {key === "primaryColor" ? "Utama" : key === "sidebarColor" ? "Sidebar" : "Aksen"}
            <input className={`${input} h-11`} type="color" value={form[key]} onChange={(event) => set(key, event.target.value)} />
          </label>
        ))}
      </div>
      <button type="submit" className={btnPrimary} disabled={saving}>
        {saving ? "Menyimpan…" : "Simpan"}
      </button>
    </form>
  );
}
