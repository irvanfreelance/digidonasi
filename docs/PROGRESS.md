# Progres

Tanggal: 9 November 2026 WIB. Paket 2. Hari 3–7 tidak dimulai.

## Sumber

- `main` awal paket ini: `32f70d5a9b079f5e91244aafc423749b2b86ed7f`
- PR hari 1 dan koreksi skema sudah digabung. Cabang baru dari `main`.
- Next.js 16.4.5 dan React 19.3.1 tidak diubah.
- Boilerplate tetap `9ad94292402bb5a444ce01346f75d85133b7468d`, hanya dibaca.

## Paket 2

Tiga pintu Google dengan cookie HttpOnly terpisah: `digidonasi.donor`, `digidonasi.panel`, `digidonasi.affiliate`. `state` dan `nonce` dibuat di server. `next` hanya path di pintu yang sama. Panel memakai tabel `users`. Donatur dan afiliasi tidak saling membuat baris. Afiliasi baru `PENDING`. Editor ditolak jika `WEBSITE_ENABLED` bukan persis `true`.

Login nyata belum tervalidasi: tidak ada kredensial Google di VM ini. Uji memakai `AUTH_PROVIDER=mock` dan penolakan token sampah. Bukan transaksi Google sungguhan.

## Perintah

Dijalankan 9 November 2026, Node v22.23.4, PostgreSQL 17.11 lokal port 5433.

- `npm test`: 15 lulus, 0 gagal. Termasuk matriks tamu/donor/afiliasi/superadmin/editor, isolasi cookie, state/nonce/`next`, website mati/nyala, email yang sama pada dua baris, dan regresi hari 1.
- `npm run lint`: lulus.
- `npm run typecheck`: lulus.
- `npm run build`: lulus, Next.js 16.4.5.

## Berikutnya

Hari 3 hanya setelah paket ini hijau dan digabung dengan persetujuan. Tidak ada auto-merge.
