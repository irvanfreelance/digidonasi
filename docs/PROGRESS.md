# Progres

Tanggal: 10 November 2026 WIB. Paket 3. Hari 4–7 tidak dimulai.

## Sumber

- `main` awal paket ini: `84ffc98bb15ff5d87fed96a584fee0c0ec074ead` (PR #3 sudah digabung).
- Next.js 16.4.5 dan React 19.3.1 tidak diubah.
- Tidak ada deploy. Xendit dan Midtrans nyata belum dihubungkan.

## Paket 3

Katalog hanya menampilkan kampanye `ACTIVE`. Checkout tamu dan donor membuat invoice `PENDING` lewat adapter mock. Nominal, jumlah, bundel, dan nama qurban ditolak bila tidak sah. Kode invoice unik, termasuk dua checkout bersamaan. Riwayat memakai `donor_id` sesi. Email tamu tidak mengklaim invoice. Panel superadmin menyunting kampanye, kategori, varian, bundel, kabar, lembaga, dan blok beranda donasi.

## Perintah

Dijalankan 10 November 2026, Node v22.23.4, PostgreSQL 17.11 lokal port 5433.

- `npm test`: 16 lulus, 0 gagal. Termasuk regresi hari 1–2 dan uji donasi.
- `npm run lint -- --max-warnings 0`: lulus.
- `npm run typecheck`: lulus.
- `npm run build`: lulus.
- Katalog `/donasi` pada lebar 390 px memuat kartu satu kolom dan tombol cari selebar layar. Tangkapan: `/opt/cursor/artifacts/donasi-mobile.png`.

## Blocker

Pembayaran mock tidak pernah menjadi `PAID`. Sandbox Xendit/Midtrans belum diuji.

## Berikutnya

Hari 4 hanya setelah paket ini digabung dengan persetujuan. Tidak ada auto-merge.

- Commit: `c9ecc7c5aa63270490e0a2edff8b13821ab37a91`
- PR: https://github.com/irvanfreelance/digidonasi/pull/4
