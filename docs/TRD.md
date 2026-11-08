# TRD

Satu proses, satu `DATABASE_URL`. Tidak ada `tenant_id`.

`WEBSITE_ENABLED` dibaca di server. Proxy menolak rute lembaga dan `/api/website` dengan 404 serta `Cache-Control: no-store` bila nilainya bukan `true`. Halaman yang sama juga memanggil `notFound()`.

Rute donasi, afiliasi, dan panel yang disebut pada rencana ada sebagai kerangka. API checkout, kampanye, webhook, dan afiliasi menjawab 501. API panel dan riwayat donatur menjawab 401. Tidak ada cookie sesi.

Tiga audiens Google, verifikasi webhook, dan job komisi belum dipasang. Nama penyedia Faspay ada di katalog basis sebagai placeholder tidak aktif.

Query memakai SQL berparameter. Migrasi satu berkas dijalankan dalam satu transaksi.
