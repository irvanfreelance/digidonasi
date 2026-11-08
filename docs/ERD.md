# ERD

Diagram target tidak berubah secara konseptual dari tinjauan: donatur, afiliasi, kampanye, invoice, buku, dan konten. Nama tabel operator adalah `users`, bukan `admin_users` dan bukan tabel kedua. Audit menunjuk `users`. `org_profile` dan `app_config` tetap satu-satunya pengaturan lembaga.

`affiliate_ledger` hanya menerima INSERT. Saldo adalah jumlah gerakan, bukan kolom yang diedit. Tidak ada tabel CRM, payroll, atau penyaluran.

Rincian kolom dan pemetaan ada di [SCHEMA-MAP.md](SCHEMA-MAP.md).
