# Peta kompatibilitas skema

Sumber yang dijalankan: `lib/db/migrations/0000_foundation.sql`, 50 tabel. `drizzle/schema.ts` mencerminkan nama tabel dan kolom yang sama. Drizzle Query tidak dipakai. `drizzle-kit push` dan `generate` tidak ada di skrip npm; keluarannya, bila dijalankan manual, hanya boleh ke `drizzle/kit`, bukan ke berkas migrasi.

`main` jarak jauh saat paket ini hanya berisi `README.md`. Daftar tabel ada di cabang PR, di berkas SQL di atas, bukan di halaman default GitHub.

Acuan yang dibaca: `https://github.com/irvanfreelance/erpboilerplate` commit `9ad94292402bb5a444ce01346f75d85133b7468d` (`first commit`, 6 November 2026). Bukan `erpabps`.

## Dipakai ulang

| Boilerplate | Digidonasi | Catatan |
|---|---|---|
| `org_profile` | `org_profile` | `varchar` nama/warna, `favicon_url`, `is_seed_default`, default `#01665a`. Ditambah kontak donasi dan `seed_untouched`. |
| `app_config` | `app_config` | `key varchar(100)`, `value`, `description`, `updated_at`. Ditambah `is_proposal` dan `seed_untouched`. Kunci `website_enabled` ditolak. |
| `users` | `users` | `BIGSERIAL`, `varchar` nama/email/role, `is_active`, `deleted_at`. Peran hanya `SUPERADMIN` dan `WEBSITE_EDITOR`. |
| `audit_logs` | `audit_logs` | `user_id`, `entity_id bigint`, `field_changed`, `ip_address`, `user_agent`. |

## Disesuaikan

| Draf SQL | Keputusan |
|---|---|
| `admin_users` | Tidak dibuat. Dipetakan ke `users` supaya tidak ada dua tabel operator. |
| `status` ACTIVE/INACTIVE | Menjadi `is_active`. `false` sama dengan INACTIVE. Satu `CHECK` status ikut hilang karena kolomnya tidak dibuat. |
| `actor_admin_id` | Menjadi `audit_logs.user_id`. |
| `password_hash` | Tidak dibuat. Bukan sandi dan bukan login hari 1. |
| `user_tokens` | Tidak dibuat. Bukan sesi. |
| `audit_logs.donor_id` | Tidak dibuat. Audit hanya pelaku panel. |
| Peran `admin`, `supervisor`, `tim_blast` | Diganti dua peran panel yang disetujui. |
| PK | `BIGSERIAL`, sama seperti boilerplate. |

## Sengaja tidak dibawa

Tabel dan menu CRM: `programs`, `campaigns` versi CRM, `donors` versi CRM, `transactions` versi CRM, `field_definitions`, `donor_dynamic_fields`, `donor_search_index`, `prospect_notes`, `vendor_profiles`, `blast_batches`, `blast_records`, `saved_segments`, `tag_definitions`, `distribute_batches`, `data_imports`, `extension_configs`. Tidak ada FINS, payroll, atau HCM. Cookie penanda UI dan fallback admin pertama tidak dipasang. Logo serta nama Relawan Nusantara tidak disalin.

`donors`, `campaigns`, dan `transactions` pada basis ini adalah tabel donasi baru, bukan tabel CRM itu.

## Baru

Donatur (`donors`), afiliasi (`affiliates`), kampanye dan anaknya, kanal, invoice, transaksi, peristiwa bayar, blok donasi, blok dan tabel CMS, klik, permintaan tarik, dan `affiliate_ledger` append-only. Tidak ada `tenant_id`, partisi, CRM, payroll, atau penyaluran operasional.

## Indeks daftar

`campaigns (publication_status, sort_order, id)`, `invoices (status, created_at, id)`, `invoices (donor_id, created_at, id)`, `web_articles (publication_status, published_at, id)`, `audit_logs (created_at, id)`. Pagination kueri menyusul bersama modulnya. Belum ada partisi.
