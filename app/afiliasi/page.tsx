"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, Wallet, TrendingUp, Users, MousePointerClick, Share2 } from "lucide-react";

type Campaign = {
  id: number;
  slug: string;
  title: string;
  collected_amount: string;
  target_amount: string;
};

type AffiliateData = {
  affiliate: { id: number; affiliate_code: string; name: string; balance: string } | null;
  summary: { total_clicks: string; total_donors: string; total_raised: string; total_commission: string } | null;
  withdrawals?: { id: number; amount: string; bank_account_info: string; status: string; created_at: string }[];
  campaigns: Campaign[];
};

const formatIDR = (n: number | string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function AfiliasiPage() {
  const [code, setCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [data, setData] = useState<AffiliateData | null>(null);
  const [error, setError] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [wdAmount, setWdAmount] = useState("");
  const [wdBank, setWdBank] = useState("");
  const [wdMessage, setWdMessage] = useState("");

  async function load(targetCode: string) {
    setError("");
    const q = targetCode ? `?code=${encodeURIComponent(targetCode)}` : "";
    const res = await fetch(`/api/afiliasi${q}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Gagal memuat data afiliasi");
      return;
    }
    setData(json);
    if (targetCode) {
      setCode(targetCode);
      localStorage.setItem("digidonasi_aff_code", targetCode);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("digidonasi_aff_code") || "";
    if (saved) {
      setInputCode(saved);
      void load(saved);
    } else {
      void load("");
    }
  }, []);

  function copyLink(slug: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const refParam = code ? `?ref=${encodeURIComponent(code)}` : "";
    navigator.clipboard.writeText(`${origin}/donasi/${slug}${refParam}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1800);
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWdMessage("");
    const res = await fetch("/api/afiliasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, amount: Number(wdAmount), bank_account_info: wdBank }),
    });
    const json = await res.json();
    if (!res.ok) {
      setWdMessage(json.error || "Gagal mengajukan penarikan");
      return;
    }
    setWdMessage("Pengajuan penarikan berhasil dikirim.");
    setWdAmount("");
    setWdBank("");
    void load(code);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-5 rounded-b-3xl shadow-md">
        <p className="text-xs uppercase tracking-wider opacity-80">Portal Afiliasi</p>
        <h1 className="text-xl font-bold mt-1">
          {data?.affiliate ? `Selamat datang, ${data.affiliate.name}` : "Masuk dengan Kode Afiliasi"}
        </h1>

        {!data?.affiliate ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(inputCode.trim());
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Masukkan kode afiliasi Anda..."
              className="flex-1 rounded-xl px-3 py-2 text-sm bg-white text-slate-900"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">
              Masuk
            </button>
          </form>
        ) : (
          <div className="mt-4 bg-white text-slate-900 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">SALDO KOMISI AKTIF</p>
            <p className="text-2xl font-bold mt-0.5">{formatIDR(data.affiliate.balance)}</p>
            <p className="text-xs text-slate-500 mt-1">Kode: <span className="font-mono font-semibold">{data.affiliate.affiliate_code}</span></p>
          </div>
        )}
        {error && <p className="text-xs bg-rose-500/20 text-white rounded-lg px-3 py-2 mt-2">{error}</p>}
      </div>

      <div className="p-4 space-y-5">
        {data?.summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <MousePointerClick className="w-4 h-4 text-indigo-500" /> Total Klik
              </div>
              <p className="text-lg font-bold mt-1">{data.summary.total_clicks}</p>
            </div>
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Users className="w-4 h-4 text-emerald-500" /> Donatur Berhasil
              </div>
              <p className="text-lg font-bold mt-1">{data.summary.total_donors}</p>
            </div>
            <div className="col-span-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs opacity-85">TOTAL DANA TERGALANG</p>
                <p className="text-xl font-bold mt-0.5">{formatIDR(data.summary.total_raised)}</p>
              </div>
              <TrendingUp className="w-7 h-7 opacity-80" />
            </div>
          </div>
        )}

        {data?.affiliate && (
          <form onSubmit={handleWithdraw} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-800">
              <Wallet className="w-4 h-4 text-indigo-600" /> Tarik Saldo Komisi
            </div>
            <input
              type="number"
              min={10000}
              value={wdAmount}
              onChange={(e) => setWdAmount(e.target.value)}
              placeholder="Nominal penarikan (min Rp 10.000)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              value={wdBank}
              onChange={(e) => setWdBank(e.target.value)}
              placeholder="Bank & No. Rekening (contoh: BSI 7123456789 a.n. Budi)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <button type="submit" className="w-full rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-semibold">
              Ajukan Penarikan
            </button>
            {wdMessage && <p className="text-xs text-slate-600">{wdMessage}</p>}
          </form>
        )}

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-indigo-600" /> Kampanye Siap Promosi
            </h2>
          </div>
          {(data?.campaigns ?? []).map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{c.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">Terkumpul {formatIDR(c.collected_amount)}</p>
              </div>
              <button
                type="button"
                onClick={() => copyLink(c.slug)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700"
              >
                {copiedSlug === c.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSlug === c.slug ? "Disalin" : "Salin Link"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

