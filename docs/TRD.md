# TRD

Satu proses, satu `DATABASE_URL`. Tidak ada `tenant_id`.

`WEBSITE_ENABLED` dibaca di server. Proxy menolak rute lembaga dan `/api/website` dengan 404 serta `Cache-Control: no-store` bila nilainya bukan `true`. Halaman yang sama juga memanggil `notFound()`.

Pintu masuk: `/masuk`, `/panel/login`, dan `/afiliasi/masuk`. Webhook Xendit dan Midtrans memverifikasi tanda tangan, menolak nominal yang tidak sama, dan tidak mengulang statistik. Faspay tidak bisa dipilih. CMS lembaga belum diimplementasikan.

Komisi afiliasi melekat pada webhook lunas dan pembalikan manual. Tidak ada penjadwal. Faspay tetap placeholder tidak aktif.

Query memakai SQL berparameter. Migrasi satu berkas dijalankan dalam satu transaksi.
