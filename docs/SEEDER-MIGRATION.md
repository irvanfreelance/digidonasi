# Seed

`npm run db:migrate` lalu `npm run db:seed`. Keduanya menolak URL yang memuat nama basis terlarang.

Setiap baris contoh punya `seed_key`. Pembaruan di luar `digidonasi.seeding=on` mematikan `seed_untouched`, dan pada `org_profile` juga `is_seed_default`. Jalan ulang menulis kembali hanya baris yang masih `seed_untouched`. `campaign_stats` yang sudah berubah tidak di-nol-kan.

Tidak ada transaksi lunas, tidak ada string QR, tidak ada kanal aktif, dan tidak ada email orang di berkas. Akun `SUPERADMIN` hanya muncul bila env opt-in diisi pelaksana. Email itu tidak disalin ke `app_config`.

Daftar blok beranda ada di [HOME-COVERAGE.md](HOME-COVERAGE.md).
