# digidonasi

Fondasi satu klien untuk donasi, afiliasi, dan website opsional. Panel memakai pola shell lembaga: sidebar, warna `org_profile`, dan formulir pengaturan. Hari 1 memasang skema, seed sintetis, dan kerangka rute. Modul bisnis hari 2–7 belum dikerjakan.

Tidak ada proyek Vercel, hook preview, atau deploy dari repo ini.

## Env

Salin `.env.example` ke `.env.local`. `WEBSITE_ENABLED=true` adalah satu-satunya nilai yang menyalakan website. Basis lokal contoh:

`postgresql://postgres@127.0.0.1:5433/digidonasi`

Jangan menaruh rahasia produksi di berkas ini.

## Perintah

```bash
npm ci
npm run db:migrate
npm run db:seed
npm test
npm run lint
npm run typecheck
npm run build
```

Node 22.23 atau lebih baru. Next.js 16.4.5 dan React 19.3.1 terkunci di `package.json`.

## Dokumen

- [AGENTS.md](AGENTS.md)
- [docs/PROGRESS.md](docs/PROGRESS.md)
- [docs/SCHEMA-MAP.md](docs/SCHEMA-MAP.md)
- [docs/HOME-COVERAGE.md](docs/HOME-COVERAGE.md)
- [docs/PRD.md](docs/PRD.md)
- [docs/TRD.md](docs/TRD.md)
- [docs/ERD.md](docs/ERD.md)
- [docs/SEEDER-MIGRATION.md](docs/SEEDER-MIGRATION.md)
