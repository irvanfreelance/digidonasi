# Progres

Tanggal: 12 November 2026 WIB. Bukan paket 5. Data contoh diganti merek fiktif Yayasan Lentera Barokah beserta foto lokal. Kanal pembayaran tetap mati. Hari 5–7 tidak dimulai.

## Sebelumnya

Tanggal: 11 November 2026 WIB. Paket 4.

## Sumber

- `main` awal paket ini: `3648297145b2814539cb8a064693c97636b2ffb3` (PR #4 sudah digabung).
- Next.js 16.4.5 dan React 19.3.1 tidak diubah.
- Tidak ada deploy dan tidak ada transaksi sandbox sungguhan.

## Paket 4

Webhook Xendit memakai token callback. Webhook Midtrans memakai SHA-512. Event yang sama tidak mengubah status dua kali. Nominal yang tidak sama ditolak. Status `PAID` tidak mundur. Event lunas setelah gagal tidak menaikkan terkumpul. Invoice yang lewat batas waktu menjadi `FAILED`. Rekonsiliasi superadmin mencatat alasan di audit dan tidak menambah `campaign_stats`. Faspay tetap tidak bisa dipilih. Tanpa kunci, charge tetap mock.

## Perintah

Dijalankan 11 November 2026, Node v22.23.4, PostgreSQL 17.11 lokal port 5433.

- `npm test`: 17 lulus, 0 gagal. Termasuk regresi hari 1–3 dan uji pembayaran.
- `npm run lint`: lulus.
- `npm run typecheck`: lulus.
- `npm run build`: lulus.

## Blocker

Sandbox Xendit dan Midtrans belum tervalidasi. `PAYMENT_MODE` bukan `live`, dan tidak ada kunci di mesin ini.

## Berikutnya

Hari 5 hanya setelah paket ini digabung dengan persetujuan. Tidak ada auto-merge. Untuk uji sandbox, isi `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN`, `MIDTRANS_SERVER_KEY`, dan `PAYMENT_MODE=live` di lingkungan klien, bukan di repo.

- Commit: `3e393451da75c7ce6a38db718738791cb65feb0b`
- PR: https://github.com/irvanfreelance/digidonasi/pull/5
