# Progres

Tanggal: 8 November 2026 WIB. Paket 1 saja. Hari 2–7 tidak dimulai.

## Sumber

- Target: `https://github.com/irvanfreelance/digidonasi`
- Boilerplate yang diminta: `irvanfreelance/erpboilerplate` `9ad94292402bb5a444ce01346f75d85133b7468d`. Token agen ini menerima 404. Tidak disalin.
- Konvensi yang benar-benar dibaca: `irvanfreelance/erpabps` `281a8646b781d21035e7a95feaa9939f294eb1d9` (Next 16.4.5, shell panel, `org_profile`, `users`, `audit_logs`). Domain HRD/payroll tidak dibawa.
- Publik dan admin Darul Hikam tidak diubah dan tidak diimpor. Tidak ada `DATABASE_URL` sumber.
- Next.js: dist-tag npm `latest` = `16.4.5` (bukan canary `16.5.0-canary.44`), dicek 8 November 2026. React `latest` = `19.3.1`. Node yang dipakai `v22.23.4`.

## Paket ini

- Cabang: `cursor/day1-foundation-1669`
- Commit fondasi: `8349893f8fffe98062f1ed6dbacbcbbc5d8060af`
- PR: diisi setelah benar-benar dibuat
- Basis uji: PostgreSQL 17.11 lokal, port 5433, hanya `127.0.0.1`. Bukan Neon dan bukan produksi.

## Perintah

Dijalankan 8 November 2026 pada VM ini, Node v22.23.4, npm 10.9.9, PostgreSQL 17.11.

- `npm install` lalu `npm test`: 8 lulus, 0 gagal. Mencakup pasang ulang, seed yang mempertahankan suntingan, constraint uang, peran, idempotensi, basis asing, dan gerbang env/panel.
- `npm run lint`: lulus.
- `npm run typecheck`: lulus.
- `npm run build`: lulus, Next.js 16.4.5.
- `npm run db:migrate` dan `npm run db:seed` dua kali pada `digidonasi_script` kosong: 1 users, 15 donation_blocks, 18 website_blocks, 0 invoices.
- `npm run start`: `/` kerangka donasi saat website mati; `/tentang-kami` 404 `Cache-Control: no-store`; `/panel` 307 ke `/panel/login`; `/api/checkout` 501; `/api/panel/kampanye` 401. Cookie lawas tidak membuka panel. Saat `WEBSITE_ENABLED=true`, `/` kerangka lembaga dan `/tentang-kami` 200, panel tetap tertutup.

## Menunggu

- Hari 2: Google tiga audiens. Panel saat ini gagal tertutup, tanpa cookie sesi.
- Penggabungan paket ini menunggu persetujuan. Tidak ada auto-merge.
- Routine 9–14 November 2026 pukul 03.00 WIB tidak diaktifkan di repo ini.

## Pemblokir

Repo `erpboilerplate` tidak terbaca. Shell dan nama tabel mengikuti saudara publik di atas, lalu domain donasi dari draf SQL yang direkonsiliasi. Tidak ada pemblokir pemasangan basis lokal.
