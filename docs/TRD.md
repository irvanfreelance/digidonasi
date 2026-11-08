# TRD

Satu proses, satu `DATABASE_URL`. Tidak ada `tenant_id`.

`WEBSITE_ENABLED` dibaca di server. Proxy menolak rute lembaga dan `/api/website` dengan 404 serta `Cache-Control: no-store` bila nilainya bukan `true`. Halaman yang sama juga memanggil `notFound()`.

Pintu masuk: `/masuk`, `/panel/login`, dan `/afiliasi/masuk`. `/login` mengalihkan ke `/panel/login`. Cookie, `aud`, dan tabel mengikuti tiga audiens. Admin tetap di pohon `(dashboard)`. Checkout, webhook, dan CMS belum diimplementasikan. API yang belum waktunya menjawab 501 setelah lolos guard.

Tiga audiens Google, verifikasi webhook, dan job komisi belum dipasang. Nama penyedia Faspay ada di katalog basis sebagai placeholder tidak aktif.

Query memakai SQL berparameter. Migrasi satu berkas dijalankan dalam satu transaksi.
