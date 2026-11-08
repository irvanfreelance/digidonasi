# Progres

Tanggal: 8 November 2026 WIB. Paket 1 saja, masih PR yang sama. Hari 2–7 tidak dimulai.

## Sumber

- Target: `https://github.com/irvanfreelance/digidonasi`
- Boilerplate yang dibaca: `https://github.com/irvanfreelance/erpboilerplate` commit `9ad94292402bb5a444ce01346f75d85133b7468d` (`first commit`).
- `main` jarak jauh tetap `c5a27fd` dan hanya berisi `README.md`. Skema ada di cabang PR.
- Next.js `16.4.5`, React `19.3.1`, Node v22.23.4. Tidak ada impor atau `DATABASE_URL` sumber.

## Skema

Draf SQL dan migrasi sama-sama 50 `CREATE TABLE`. `admin_users` dipetakan ke `users`. Tidak ada tabel domain yang hilang. Katalog PostgreSQL 17.11 lokal setelah migrasi juga 50 tabel, termasuk varian, bundel, nama qurban, QRIS, peristiwa bayar, klik, buku komisi, penarikan, dan blok beranda.

Yang terlihat sedikit: halaman `main` belum punya SQL, dan `drizzle/schema.ts` semula hanya 9 `pgTable`. Cermin itu sekarang 50 tabel beserta kolomnya. `drizzle-kit push/generate` tidak masuk skrip npm dan tidak menulis ke berkas migrasi.

Indeks migrasi 23 (draf 13) dan pemicu 43 (draf 18) karena indeks daftar dan pemicu `seed_untouched` ditambah. Satu `CHECK` status `admin_users` tidak ikut karena kolom itu menjadi `is_active`. CRM, FINS, HCM, `password_hash`, `user_tokens`, dan `donor_id` audit tidak dibuat.

## Perintah koreksi

- `npm test`: 10 lulus, 0 gagal. Termasuk pasang ulang, seed yang mempertahankan suntingan, constraint, katalog 50 tabel, dan paritas kolom SQL–Drizzle.
- `npm run lint`, `npm run typecheck`, `npm run build`: lulus.
- `/panel` dan `/dashboard` membalas 307 ke `/login`. Pintu Google tetap mati. Pratinjau shell hanya lewat `PANEL_SHELL_FIXTURE=1` di `/dev/shell-fixture`, bukan sesi.

## Menunggu

- Hari 2: Google. Tidak ada auto-merge.
- Commit fondasi awal: `8349893f8fffe98062f1ed6dbacbcbbc5d8060af`
- Commit koreksi: `c29b56881c4a18eb90d043a5ef091ffc6029d9c9`
- PR: https://github.com/irvanfreelance/digidonasi/pull/1
