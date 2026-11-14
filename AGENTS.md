# AGENTS.md

Berlaku untuk repo `digidonasi`.

## Arsitektur & Cakupan

- **Satu repo, satu aplikasi, white-label:** Menggabungkan crowdfunding publik, login donatur, portal afiliasi, panel admin (`/panel`), dan website lembaga opsional (`WEBSITE_ENABLED=true`).
- **Tanpa modul internal:** Tidak ada CRM, payroll, FINS, atau modul penyaluran.
- **Tanpa tabel partisi:** Semua tabel (`invoices`, `transactions`, `transaction_qurban_names`, dll.) menggunakan tabel tunggal tanpa partisi.
- **`WEBSITE_ENABLED`:** Env server. Nilai persis `'true'` mengaktifkan website lembaga (homepage `/` ke website, rute `/tentang-kami`, `/layanan-ziswaf`, `/transparansi`, `/kontak`, `/program`, `/kabar-kebaikan`, `/news`, serta menu Website di `/panel`). Nilai selain `'true'` menjadikan `/` langsung ke beranda crowdfunding dan menonaktifkan rute website (`404`).
- **Peran panel:** Hanya `SUPERADMIN` dan `WEBSITE_EDITOR` di tabel `admins`. Donatur (`donors`) dan afiliasi (`affiliates`) adalah tabel serta sesi terpisah.

## Database & Query

- **Drizzle hanya untuk migrasi & seed:** `npm run db:migrate` dan `npm run db:seed`. Jangan gunakan Drizzle ORM untuk query di aplikasi atau API.
- **SQL berparameter:** Semua query aplikasi menggunakan `query()` di `lib/db.ts` (publik) atau `lib/panel/db.ts` (panel).

## Keamanan & White-Label

- Jangan menuliskan nama lembaga tertentu (seperti Darul Hikam atau Lentera Barokah) secara hardcode di kode. Identitas lembaga dibaca dari `ngo_configs`.
- Jangan menyimpan rahasia, `DATABASE_URL` produksi, atau data klien di repo.

Perintah lokal: `npm run db:migrate`, `npm run db:seed`, `npm run typecheck`, `npm run lint`, `npm run build`.
