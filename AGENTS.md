# AGENTS.md

Berlaku untuk repo ini. Paket terpasang sampai hari 3 bila PR ini digabung. Hari 4 belum dimulai.

## Yang sudah ditutup

- Satu klien, satu repo, satu basis, satu env. Tidak ada pengalih tenant.
- `WEBSITE_ENABLED` hanya env server. Persis `true` menyalakan website. Nilai lain mematikan rute, API, dan menu website tanpa menghapus baris.
- Peran panel hanya `SUPERADMIN` dan `WEBSITE_EDITOR`. Donatur dan afiliasi adalah tabel serta sesi terpisah. Email yang sama boleh punya baris admin dan donatur.
- Xendit dan Midtrans menyusul hari 4. Faspay hanya baris placeholder tidak aktif.
- Tidak ada CRM, payroll, FINS, atau modul penyaluran. Kabar dan alokasi adalah konten.
- Tidak ada deploy, preview Vercel, atau provisioning dari repo ini.

## Keamanan

- Jangan memulihkan cookie sesi UI CRM, fallback admin-pertama, `password_hash`, atau peran `FINANCE`.
- `getPanelSession` hanya membaca cookie `digidonasi.panel`. Cookie donor, afiliasi, dan penanda UI lawas tidak berlaku. Tidak ada fallback admin pertama.
- Tiga pintu: `/masuk`, `/panel/login`, `/afiliasi/masuk`. `/login` mengalihkan ke `/panel/login`. `AUTH_PROVIDER=mock` hanya untuk uji. Login Google sungguhan belum tervalidasi.
- Shell admin tetap pada `app/(dashboard)`. `PANEL_SHELL_FIXTURE` bukan sesi.
- Jangan menyalin rahasia, `DATABASE_URL` produksi, atau data Darul Hikam ke repo, seed, atau log.
- Bootstrap superadmin hanya jika `BOOTSTRAP_ADMIN_OPT_IN=true` bersama nama dan email dari env. Jangan menulis email orang ke dokumen.

## Sumber kebenaran

1. Perilaku yang sudah dipasang: kode dan `docs/PROGRESS.md`.
2. Skema: `lib/db/migrations/0000_foundation.sql`. Peta: `docs/SCHEMA-MAP.md`.
3. Seed: `drizzle/seed.sql`. Ulangi tidak menimpa baris yang `seed_untouched = false`. `campaign_stats` tidak direset.
4. SQL aplikasi berparameter lewat `dbQuery`. Drizzle tidak dipakai untuk query.

## Alur hari berikutnya

Satu PR kohesif per hari, 9–14 November 2026, hanya setelah paket sebelumnya hijau dan penggabungannya disetujui. Tidak ada auto-merge dan tidak ada loncatan hari. Hari 2 autentikasi. Hari 3 donasi. Hari 4 pembayaran. Hari 5 afiliasi. Hari 6 website. Hari 7 kandidat rilis. Berhenti jika pemblokir berulang.

Perintah lokal: `npm run db:migrate`, `npm run db:seed`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
