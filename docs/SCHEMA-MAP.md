# Peta kompatibilitas skema

Sumber yang dijalankan: `lib/db/migrations/0000_foundation.sql`. `drizzle/schema.ts` hanya cermin sebagian. Drizzle Query tidak dipakai aplikasi.

Acuan boilerplate yang bisa dibaca agen ini adalah repo publik `irvanfreelance/erpabps` pada `281a8646b781d21035e7a95feaa9939f294eb1d9` (paket `zains_crm`, Next `16.4.5`, `org_profile`, `app_config`, `users`, `audit_logs`, cookie `crm_ui_session`). Repo privat `irvanfreelance/erpboilerplate` pada SHA `9ad94292402bb5a444ce01346f75d85133b7468d` tidak dapat dibaca token agen ini. Konvensi di bawah mengikuti saudara publik itu dan dokumen tinjauan, bukan tebakan hijau.

## Dipakai ulang

| Boilerplate | Digidonasi | Catatan |
|---|---|---|
| `org_profile` satu baris | `org_profile` | Nama, warna, logo, favicon, `is_seed_default` tetap. Ditambah kolom kontak donasi dan `seed_untouched`. |
| `app_config` | `app_config` | Kunci/nilai/deskripsi/`updated_at` tetap. Ditambah `is_proposal` dan `seed_untouched`. Kunci `website_enabled` ditolak. |
| `users` | `users` | Satu tabel operator panel. Peran hanya `SUPERADMIN` dan `WEBSITE_EDITOR`. |
| `audit_logs` | `audit_logs` | `user_id` menunjuk `users`. Ditambah `field_changed`, `ip_address`, `user_agent`. `entity_id` teks agar kunci non-numerik muat. |

## Disesuaikan

| Draf SQL | Keputusan |
|---|---|
| `admin_users` | Tidak dibuat. Dipetakan ke `users` supaya tidak ada dua tabel operator. |
| `status` ACTIVE/INACTIVE | Menjadi `is_active`. `false` sama dengan INACTIVE. |
| `actor_admin_id` | Menjadi `audit_logs.user_id`. |
| `password_hash` | Tidak ada. Masuk Google menyusul hari 2. |
| `user_tokens` | Tidak dibuat. Bukan sesi sementara. |
| PK `BIGSERIAL` saudara HRD | Identitas `bigint GENERATED ALWAYS AS IDENTITY` mengikuti draf yang sudah diuji, setara urutan bigint. |

## Baru

Donatur (`donors`), afiliasi (`affiliates`), kampanye dan anaknya, kanal, invoice, transaksi, peristiwa bayar, blok donasi, blok dan tabel CMS, klik, permintaan tarik, dan `affiliate_ledger` append-only. Tidak ada `tenant_id`, partisi, CRM, payroll, atau penyaluran operasional.

## Indeks daftar

`campaigns (publication_status, sort_order, id)`, `invoices (status, created_at, id)`, `invoices (donor_id, created_at, id)`, `web_articles (publication_status, published_at, id)`, `audit_logs (created_at, id)`. Pagination kueri menyusul bersama modulnya. Belum ada partisi.
