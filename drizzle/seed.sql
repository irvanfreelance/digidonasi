-- Seed contoh fiktif Yayasan Lentera Barokah. Jalan di satu transaksi dengan digidonasi.seeding=on.
-- Bukan data lembaga sungguhan. Baris yang sudah disunting klien (seed_untouched = false) tidak ditimpa.
SELECT set_config('digidonasi.seeding', 'on', true);

INSERT INTO org_profile (
  id, seed_key, nama, nama_singkat, tagline, short_description, address,
  logo_url, favicon_url, primary_color, sidebar_color, accent_color,
  facebook_url, instagram_url, whatsapp_number, public_email, seed_untouched
) VALUES (
  1, 'org.profile',
  'Yayasan Lentera Barokah', 'Lentera',
  'Kebaikan yang sampai kepada yang berhak',
  $p$Lentera Barokah menghimpun zakat, infak, sedekah, dan wakaf dari donatur di Bandung Raya, lalu menyalurkannya untuk pangan, kesehatan, pendidikan, dan tanggap bencana. Visi kami: tidak ada dapur yang padam dan tidak ada anak yang putus sekolah karena biaya. Misi kami: menghimpun dengan amanah, menyalurkan dengan catatan, dan melaporkan dengan bahasa yang mudah dibaca.$p$,
  'Jl. Melati Rahayu No. 18, Sarijadi, Sukajadi, Bandung 40151',
  '/brand/logo.svg', '/brand/favicon.svg',
  '#0E6B56', '#0A3F34', '#C5922C',
  'https://facebook.com/lenterabarokah.example',
  'https://instagram.com/lenterabarokah.example',
  '6281200000180',
  'halo@lentera-barokah.example',
  true
)
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama,
  nama_singkat = EXCLUDED.nama_singkat,
  tagline = EXCLUDED.tagline,
  short_description = EXCLUDED.short_description,
  address = EXCLUDED.address,
  logo_url = EXCLUDED.logo_url,
  favicon_url = EXCLUDED.favicon_url,
  primary_color = EXCLUDED.primary_color,
  sidebar_color = EXCLUDED.sidebar_color,
  accent_color = EXCLUDED.accent_color,
  facebook_url = EXCLUDED.facebook_url,
  instagram_url = EXCLUDED.instagram_url,
  whatsapp_number = EXCLUDED.whatsapp_number,
  public_email = EXCLUDED.public_email
WHERE org_profile.seed_untouched;

INSERT INTO app_config (key, value, description, is_proposal) VALUES
  ('timezone', 'Asia/Jakarta', 'Zona waktu tampilan.', false),
  ('bootstrap_admin_opt_in', 'false', 'Isi email lewat env pelaksana. Berkas ini tidak membuat akun.', true),
  ('bootstrap_admin_email', '', 'Kosong. Bukan email orang.', true),
  ('default_commission_pct', '0', 'Usulan: kampanye baru 0 persen sampai diatur.', true),
  ('attribution_model', 'last_click', 'Usulan model atribusi. Aplikasi yang menerapkan, bukan pemicu SQL.', true),
  ('attribution_window_days', '30', 'Usulan jendela klik terakhir. Bukan keputusan bisnis final.', true),
  ('commission_hold_days', '14', 'Usulan tahan komisi. Tidak ada pekerjaan otomatis di SQL.', true),
  ('brand_name', 'Yayasan Lentera Barokah', 'Nama merek contoh pada org_profile.', false),
  ('brand_logo_url', '/brand/logo.svg', 'Logo lokal.', false),
  ('brand_favicon_url', '/brand/favicon.svg', 'Ikon lokal.', false),
  ('brand_primary_color', '#0E6B56', 'Warna utama merek contoh.', false),
  ('brand_vision', 'Tidak ada dapur yang padam dan tidak ada anak yang putus sekolah karena biaya.', 'Visi singkat merek contoh.', false)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_proposal = EXCLUDED.is_proposal
WHERE app_config.seed_untouched;

INSERT INTO categories (seed_key, name, slug, icon_name, sort_order) VALUES
  ('demo-cat-zakat', 'Zakat', 'demo-zakat', 'Banknote', 1),
  ('demo-cat-infak', 'Infak', 'demo-infak', 'HandHeart', 2),
  ('demo-cat-sedekah', 'Sedekah', 'demo-sedekah', 'Heart', 3),
  ('demo-cat-wakaf', 'Wakaf', 'demo-wakaf', 'Landmark', 4),
  ('demo-cat-qurban', 'Qurban', 'demo-qurban', 'Gift', 5),
  ('demo-cat-kemanusiaan', 'Kemanusiaan', 'demo-kemanusiaan', 'Heart', 6),
  ('demo-cat-bencana', 'Bencana', 'demo-bencana', 'Siren', 7),
  ('demo-cat-pendidikan', 'Pendidikan', 'demo-pendidikan', 'BookOpen', 8),
  ('demo-cat-kesehatan', 'Kesehatan', 'demo-kesehatan', 'Stethoscope', 9)
ON CONFLICT (seed_key) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  icon_name = EXCLUDED.icon_name,
  sort_order = EXCLUDED.sort_order
WHERE categories.seed_untouched;

INSERT INTO campaigns (
  seed_key, category_id, slug, title, summary, description, image_url, image_alt,
  publication_status, is_verified, is_urgent, is_zakat, is_qurban, is_fixed_amount,
  is_bundle, has_no_target, has_no_time_limit, is_carousel, minimum_amount,
  target_amount, suggestion_amounts, end_date, base_commission_pct, sort_order
)
SELECT v.seed_key, c.id, v.slug, v.title, v.summary, v.description, v.image_url, v.image_alt,
       'ACTIVE', v.is_verified, v.is_urgent, v.is_zakat, v.is_qurban, v.is_fixed_amount,
       v.is_bundle, v.has_no_target, v.has_no_time_limit, v.is_carousel, v.minimum_amount,
       v.target_amount, v.suggestion_amounts,
       CASE WHEN v.end_days IS NULL THEN NULL ELSE (CURRENT_DATE + v.end_days)::date END,
       v.base_commission_pct, v.sort_order
FROM (VALUES
  ('demo-umum', 'demo-cat-kemanusiaan', 'demo-umum',
    $t$Beras untuk Dapur Keluarga$t$,
    $t$Sembako bulanan bagi keluarga yang memasak dari dapur umum.$t$,
    $t$Di Gang Melati, banyak keluarga menggabungkan beras bantuan dengan lauk yang dibeli harian. Program ini mengisi 8 kilogram beras, minyak, dan telur setiap bulan agar dapur tidak padam di minggu ketiga. Relawan mencatat nama di buku posko, lalu beras diantar sebelum magrib.$t$,
    '/seed/kampanye/pangan.webp', $t$Butir beras siap dibagi$t$,
    true, false, false, false, false, false, false, false, true,
    10000::bigint, 150000000::bigint, ARRAY[25000,50000,100000]::bigint[], 180::int, 0::numeric, 1::smallint),
  ('demo-mendesak', 'demo-cat-bencana', 'demo-mendesak',
    $t$Tanggap Banjir Kampung Cisaladah$t$,
    $t$Posko dapur dan selimut untuk warga yang mengungsi naik ke balai.$t$,
    $t$Air sungai naik semalaman dan menutup jalan setapak. Warga mengungsi ke balai dengan pakaian yang masih basah. Dana ini membeli beras darurat, selimut, dan obat luka ringan, lalu dicatat per keluarga di posko. Bukan penggalangan untuk peristiwa di luar cerita ini.$t$,
    '/seed/kampanye/bencana.webp', $t$Jalan yang tergenang air$t$,
    true, true, false, false, false, false, false, false, true,
    10000::bigint, 80000000::bigint, ARRAY[50000,100000,250000]::bigint[], 18::int, 5::numeric, 2::smallint),
  ('demo-zakat', 'demo-cat-zakat', 'demo-zakat',
    $t$Zakat Maal dan Profesi$t$,
    $t$Himpunan zakat untuk mustahik pangan, kesehatan, dan pendidikan.$t$,
    $t$Zakat yang masuk dicatat terpisah dari infak. Penyaluran diutamakan untuk keluarga yang dapur dan biaya sekolahnya tersendat, dengan musyawarah amil sebelum nama ditulis di berita acara. Program ini tidak memuat daftar penerima sungguhan.$t$,
    '/seed/kampanye/zakat.webp', $t$Kubah masjid di cahaya sore$t$,
    false, false, true, false, false, false, false, false, true,
    50000::bigint, 250000000::bigint, ARRAY[50000,100000,250000]::bigint[], 200::int, 0::numeric, 3::smallint),
  ('demo-qurban', 'demo-cat-qurban', 'demo-qurban',
    $t$Qurban untuk Pelosok$t$,
    $t$Kambing utuh atau patungan sapi, dagingnya dibagi di kampung yang jarang tersentuh.$t$,
    $t$Hewan dititipkan ke peternak mitra sampai hari pemotongan. Daging dibagi dalam kantong keluarga, bukan dijual. Pilih kambing untuk satu nama, atau sapi untuk tujuh nama mudhohi.$t$,
    '/seed/kampanye/qurban.webp', $t$Kambing putih di padang rumput$t$,
    false, false, false, true, true, false, false, false, false,
    2500000::bigint, 180000000::bigint, ARRAY[]::bigint[], 160::int, 0::numeric, 4::smallint),
  ('demo-bundel', 'demo-cat-kesehatan', 'demo-bundel',
    $t$Paket Periksa dan Sembako$t$,
    $t$Sekali bayar untuk beras keluarga dan periksa kesehatan di pos pelayanan.$t$,
    $t$Paket ini menggabungkan beras bulanan dan layanan periksa dasar: tensi, gula darah, dan obat ringan sesuai stok pos. Nominal anak paket mengikuti aturan bundel, dan keduanya harus terisi seimbang.$t$,
    '/seed/kampanye/kesehatan.webp', $t$Stetoskop dan masker di meja periksa$t$,
    false, false, false, false, false, true, false, false, false,
    20000::bigint, 40000000::bigint, ARRAY[]::bigint[], 90::int, 0::numeric, 5::smallint),
  ('demo-tanpa-target', 'demo-cat-wakaf', 'demo-tanpa-target',
    $t$Wakaf Musala Dusun Cipeundeuy$t$,
    $t$Batu, semen, dan atap untuk musala yang sekarang masih panggung bambu.$t$,
    $t$Warga shalat berjamaah di panggung yang bocor bila hujan miring. Wakaf dipakai bertahap: pondasi, dinding, lalu atap. Tidak ada angka target karena pekerjaan mengikuti bahan yang sudah terkumpul.$t$,
    '/seed/kampanye/wakaf.webp', $t$Pekerja meratakan semen$t$,
    false, false, false, false, false, false, true, false, false,
    10000::bigint, NULL::bigint, ARRAY[50000,100000,500000]::bigint[], 400::int, 0::numeric, 6::smallint),
  ('demo-tanpa-batas', 'demo-cat-infak', 'demo-tanpa-batas',
    $t$Infak Operasional Amil$t$,
    $t$Gaji relawan harian, listrik kantor, dan buku catatan penyaluran.$t$,
    $t$Infak ini menjaga lampu kantor layanan tetap menyala dan buku penyaluran tetap kebeli. Tidak ada tanggal tutup karena operasional berjalan sepanjang tahun.$t$,
    '/seed/kampanye/infak.webp', $t$Gambar kerja di atas meja$t$,
    false, false, false, false, false, false, false, true, false,
    10000::bigint, 25000000::bigint, ARRAY[10000,25000,50000]::bigint[], NULL::int, 0::numeric, 7::smallint),
  ('demo-nominal-tetap', 'demo-cat-pendidikan', 'demo-nominal-tetap',
    $t$Paket Seragam dan Buku Tulis$t$,
    $t$Satu paket tetap: dua stel seragam, sepatu, dan buku tulis satu semester.$t$,
    $t$Harga paket dikunci agar donatur tahu persis apa yang terbayar. Sekolah mitra menerima paket utuh, bukan uang tunai di tangan anak. Jumlah hanya kelipatan satu paket.$t$,
    '/seed/kampanye/pendidikan.webp', $t$Ruang kelas yang masih kosong$t$,
    false, false, false, false, true, false, false, false, false,
    100000::bigint, 60000000::bigint, ARRAY[100000]::bigint[], 120::int, 0::numeric, 8::smallint)
) AS v(
  seed_key, category_key, slug, title, summary, description, image_url, image_alt,
  is_verified, is_urgent, is_zakat, is_qurban, is_fixed_amount, is_bundle,
  has_no_target, has_no_time_limit, is_carousel, minimum_amount, target_amount,
  suggestion_amounts, end_days, base_commission_pct, sort_order
)
JOIN categories c ON c.seed_key = v.category_key
ON CONFLICT (seed_key) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  image_alt = EXCLUDED.image_alt,
  minimum_amount = EXCLUDED.minimum_amount,
  target_amount = EXCLUDED.target_amount,
  suggestion_amounts = EXCLUDED.suggestion_amounts,
  end_date = EXCLUDED.end_date,
  base_commission_pct = EXCLUDED.base_commission_pct,
  is_verified = EXCLUDED.is_verified,
  is_urgent = EXCLUDED.is_urgent,
  is_zakat = EXCLUDED.is_zakat,
  is_qurban = EXCLUDED.is_qurban,
  is_fixed_amount = EXCLUDED.is_fixed_amount,
  is_bundle = EXCLUDED.is_bundle,
  has_no_target = EXCLUDED.has_no_target,
  has_no_time_limit = EXCLUDED.has_no_time_limit,
  is_carousel = EXCLUDED.is_carousel,
  sort_order = EXCLUDED.sort_order,
  publication_status = EXCLUDED.publication_status
WHERE campaigns.seed_untouched;

INSERT INTO campaign_variants (seed_key, campaign_id, name, price_rupiah, names_per_qty)
SELECT v.seed_key, c.id, v.name, v.price_rupiah, v.names_per_qty
FROM (VALUES
  ('demo-qurban-kambing', 'demo-qurban', 'Kambing standar', 2500000::bigint, 1::smallint),
  ('demo-qurban-sapi', 'demo-qurban', 'Sapi patungan, 1 dari 7', 15000000::bigint, 7::smallint)
) AS v(seed_key, campaign_key, name, price_rupiah, names_per_qty)
JOIN campaigns c ON c.seed_key = v.campaign_key
ON CONFLICT (seed_key) DO UPDATE SET
  name = EXCLUDED.name,
  price_rupiah = EXCLUDED.price_rupiah,
  names_per_qty = EXCLUDED.names_per_qty
WHERE campaign_variants.seed_untouched;

INSERT INTO campaign_bundles (seed_key, bundle_campaign_id, item_campaign_id, qty)
SELECT v.seed_key, b.id, i.id, 1
FROM (VALUES
  ('demo-bundel-anak-umum', 'demo-bundel', 'demo-umum'),
  ('demo-bundel-anak-tetap', 'demo-bundel', 'demo-nominal-tetap')
) AS v(seed_key, bundle_key, item_key)
JOIN campaigns b ON b.seed_key = v.bundle_key
JOIN campaigns i ON i.seed_key = v.item_key
ON CONFLICT (seed_key) DO UPDATE SET qty = EXCLUDED.qty
WHERE campaign_bundles.seed_untouched;

INSERT INTO campaign_updates (seed_key, campaign_id, title, body, publication_status)
SELECT v.seed_key, c.id, v.title, v.body, 'ACTIVE'
FROM (VALUES
  ('demo-update-mendesak', 'demo-mendesak', $t$Beras darurat sudah tiba di posko$t$,
    $t$![Relawan menurunkan kardus bantuan](/seed/kabar/pangan.webp)
Empat ratus paket beras diturunkan di balai Cisaladah. Dapur umum menyala sejak subuh, dan keluarga mengungsi mengambil jatah setelah nama mereka dicatat.$t$),
  ('demo-update-pangan', 'demo-umum', $t$Antrean dapur minggu ini lebih singkat$t$,
    $t$![Butir beras untuk dapur keluarga](/seed/kampanye/pangan.webp)
Berkat stok yang datang lebih awal, pembagian selesai sebelum magrib. Relawan menyisakan sepuluh paket untuk keluarga yang pulang kerja malam.$t$),
  ('demo-update-qurban', 'demo-qurban', $t$Kandang titipan sudah terisi$t$,
    $t$![Kambing yang dititipkan untuk qurban](/seed/kampanye/qurban.webp)
Peternak mitra menerima kambing titipan dan memberi pakan sampai hari pemotongan. Daftar mudhohi menempel di papan kandang.$t$),
  ('demo-update-sehat', 'demo-bundel', $t$Pos periksa dibuka setiap Kamis$t$,
    $t$![Tenaga kesehatan menyiapkan layanan](/seed/kabar/kesehatan.webp)
Tensi dan gula darah dilayani di ruang serbaguna. Obat ringan diberikan sesuai stok, dan pasien yang perlu rujukan dicatat untuk diantar ke puskesmas.$t$)
) AS v(seed_key, campaign_key, title, body)
JOIN campaigns c ON c.seed_key = v.campaign_key
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  publication_status = EXCLUDED.publication_status
WHERE campaign_updates.seed_untouched;

INSERT INTO campaign_stats (campaign_id, collected_amount, donor_count)
SELECT c.id, v.collected, v.donors
FROM (VALUES
  ('demo-umum', 86400000::bigint, 1264),
  ('demo-mendesak', 71250000::bigint, 980),
  ('demo-zakat', 64000000::bigint, 410),
  ('demo-qurban', 42500000::bigint, 96),
  ('demo-bundel', 12800000::bigint, 310),
  ('demo-tanpa-target', 18600000::bigint, 220),
  ('demo-tanpa-batas', 9400000::bigint, 540),
  ('demo-nominal-tetap', 21000000::bigint, 210)
) AS v(seed_key, collected, donors)
JOIN campaigns c ON c.seed_key = v.seed_key
ON CONFLICT (campaign_id) DO UPDATE SET
  collected_amount = EXCLUDED.collected_amount,
  donor_count = EXCLUDED.donor_count
WHERE campaign_stats.collected_amount = 0 AND campaign_stats.donor_count = 0;

INSERT INTO campaign_qris_static (seed_key, campaign_id, status, qris_string, is_demo)
SELECT 'demo-qris-umum', id, 'DISABLED', '', true
FROM campaigns WHERE seed_key = 'demo-umum'
ON CONFLICT (seed_key) DO UPDATE SET
  status = EXCLUDED.status,
  qris_string = EXCLUDED.qris_string,
  is_demo = EXCLUDED.is_demo
WHERE campaign_qris_static.seed_untouched;

INSERT INTO payment_providers (code, adapter_status, is_active, note) VALUES
  ('xendit', 'ready', false, 'Adapter siap, kanal tetap mati sampai klien mengisi rahasia di env.'),
  ('midtrans', 'ready', false, 'Adapter siap, kanal tetap mati sampai klien mengisi rahasia di env.'),
  ('faspay_snap', 'placeholder', false, 'Placeholder. Bukan implementasi dan bukan spesifikasi yang diverifikasi.'),
  ('faspay_legacy', 'placeholder', false, 'Placeholder non-SNAP. Bukan implementasi.')
ON CONFLICT (code) DO UPDATE SET
  adapter_status = EXCLUDED.adapter_status,
  note = EXCLUDED.note
WHERE payment_providers.is_active = false;

INSERT INTO payment_methods (
  seed_key, code, name, channel_type, legacy_alias, provider_code,
  admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order
) VALUES
  ('demo-pay-va', 'demo-va', 'Virtual account', 'VIRTUAL_ACCOUNT', 'va', 'xendit', 0, 0, false, false, 1),
  ('demo-pay-ewallet', 'demo-ewallet', 'Dompet digital', 'EWALLET', NULL, 'xendit', 0, 0, false, true, 2),
  ('demo-pay-retail', 'demo-retail', 'Gerai ritel', 'OVER_THE_COUNTER', 'retail_outlet', 'xendit', 0, 0, false, false, 3),
  ('demo-pay-qris', 'demo-qris', 'QRIS', 'QR_CODE', NULL, 'xendit', 0, 0, false, false, 4),
  ('demo-pay-snap', 'demo-snap', 'Snap', 'SNAP', 'midtrans', 'midtrans', 0, 0, false, true, 5),
  ('demo-pay-manual', 'demo-manual', 'Transfer manual', 'MANUAL', 'manual', NULL, 0, 0, false, false, 6)
ON CONFLICT (seed_key) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = false,
  channel_type = EXCLUDED.channel_type,
  legacy_alias = EXCLUDED.legacy_alias
WHERE payment_methods.seed_untouched;

INSERT INTO payment_instructions (seed_key, payment_method_id, title, body, sort_order)
SELECT v.seed_key, m.id, v.title, v.body, 1
FROM (VALUES
  ('demo-ins-va', 'demo-pay-va', 'Virtual account', 'Kanal belum dibuka. Jangan transfer ke nomor mana pun dari halaman ini.'),
  ('demo-ins-ewallet', 'demo-pay-ewallet', 'Dompet digital', 'Kanal belum dibuka. Jangan membayar lewat tautan di luar invoice.'),
  ('demo-ins-retail', 'demo-pay-retail', 'Gerai ritel', 'Kanal belum dibuka. Tidak ada kode bayar yang berlaku.'),
  ('demo-ins-qris', 'demo-pay-qris', 'QRIS', 'Tidak ada gambar QR dan tidak ada string yang bisa dipindai.'),
  ('demo-ins-snap', 'demo-pay-snap', 'Snap', 'Kanal belum dibuka. Jangan melanjutkan ke halaman bayar.'),
  ('demo-ins-manual', 'demo-pay-manual', 'Transfer manual', 'Rekening pembayaran belum dibuka. Nomor 000 bukan rekening tujuan.')
) AS v(seed_key, method_key, title, body)
JOIN payment_methods m ON m.seed_key = v.method_key
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body
WHERE payment_instructions.seed_untouched;

INSERT INTO notification_templates (seed_key, event_trigger, channel, subject, body, is_active) VALUES
  ('demo-tpl-checkout-email', 'CHECKOUT', 'email', 'Tagihan donasi Lentera Barokah', 'Halo, tagihan Anda sudah tercatat. Templat ini belum dikirim karena kunci pengirim kosong.', false),
  ('demo-tpl-checkout-wa', 'CHECKOUT', 'wa', NULL, 'Tagihan donasi Anda sudah tercatat. Templat ini belum dikirim.', false),
  ('demo-tpl-paid-email', 'PAID', 'email', 'Terima kasih, donasi sudah kami catat', 'Terima kasih. Donasi Anda membantu program yang Anda pilih. Templat ini belum dikirim.', false),
  ('demo-tpl-paid-wa', 'PAID', 'wa', NULL, 'Terima kasih. Donasi Anda sudah kami catat. Templat ini belum dikirim.', false)
ON CONFLICT (seed_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  is_active = EXCLUDED.is_active
WHERE notification_templates.seed_untouched;

INSERT INTO tracking_public_ids (key, public_id) VALUES
  ('meta_pixel_id', NULL),
  ('google_ads_id', NULL),
  ('google_analytic_id', NULL),
  ('tiktok_pixel_id', NULL)
ON CONFLICT (key) DO UPDATE SET public_id = tracking_public_ids.public_id
WHERE tracking_public_ids.seed_untouched;

INSERT INTO pixel_events (seed_key, screen_name, meta_event, tiktok_event, google_event, is_active) VALUES
  ('demo-pixel-donasi', 'donasi', NULL, NULL, NULL, false),
  ('demo-pixel-checkout', 'checkout', NULL, NULL, NULL, false)
ON CONFLICT (seed_key) DO UPDATE SET is_active = EXCLUDED.is_active
WHERE pixel_events.seed_untouched;

INSERT INTO donation_blocks (seed_key, heading, body, links, publication_status) VALUES
  ('donasi.header', 'Lentera Barokah', 'Pilih program, lalu salurkan dari genggaman.', $j$[{"image":"/brand/logo.svg","label":"Beranda","href":"/"}]$j$, 'ACTIVE'),
  ('donasi.search_placeholder', NULL, 'Cari program atau kategori', '[]', 'ACTIVE'),
  ('donasi.carousel', 'Program yang sedang berjalan', 'Geser untuk melihat zakat, pangan, dan tanggap banjir.', $j$[{"image":"/seed/kampanye/zakat.webp","href":"/donasi/demo-zakat"},{"image":"/seed/kampanye/pangan.webp","href":"/donasi/demo-umum"},{"image":"/seed/kampanye/bencana.webp","href":"/donasi/demo-mendesak"}]$j$, 'ACTIVE'),
  ('donasi.kategori_heading', 'Kategori pilihan', 'Zakat, infak, sedekah, wakaf, qurban, kemanusiaan, bencana, pendidikan, dan kesehatan.', '[]', 'ACTIVE'),
  ('donasi.kategori_items', 'Pilih jalan kebaikan', 'Kategori diambil dari program yang sedang tayang.', $j$[{"image":"/seed/kampanye/zakat.webp"},{"image":"/seed/kampanye/pendidikan.webp"},{"image":"/seed/kampanye/kesehatan.webp"}]$j$, 'ACTIVE'),
  ('donasi.mendesak_heading', 'Bantuan mendesak', 'Program dengan sisa hari yang pendek.', $j$[{"label":"Lihat lainnya","href":"/donasi/mendesak","image":"/seed/kampanye/bencana.webp"}]$j$, 'ACTIVE'),
  ('donasi.mendesak_items', 'Yang perlu segera', 'Kartu diambil dari program bertanda mendesak.', $j$[{"image":"/seed/kampanye/bencana.webp","href":"/donasi/demo-mendesak"}]$j$, 'ACTIVE'),
  ('donasi.rekomendasi_heading', 'Program pilihan', 'Nominal terkumpul, sasaran, dan sisa waktu ada di setiap kartu.', $j$[{"image":"/seed/kampanye/pangan.webp"}]$j$, 'ACTIVE'),
  ('donasi.list', 'Semua program', 'Daftar program yang sedang tayang.', '[]', 'ACTIVE'),
  ('donasi.search_result_heading', 'Hasil pencarian', '{n} program ditemukan', '[]', 'ACTIVE'),
  ('donasi.search_empty', NULL, 'Tidak ada program yang sesuai. Coba kata lain atau lihat semua kategori.', '[]', 'ACTIVE'),
  ('donasi.footer', 'Lentera Barokah', 'Jl. Melati Rahayu No. 18, Bandung. halo@lentera-barokah.example', $j$[{"label":"Instagram","href":"https://instagram.com/lenterabarokah.example"},{"label":"Facebook","href":"https://facebook.com/lenterabarokah.example"}]$j$, 'ACTIVE'),
  ('donasi.mendesak_page_title', 'Bantuan mendesak', 'Program dengan waktu yang tinggal sedikit.', $j$[{"image":"/seed/kampanye/bencana.webp"}]$j$, 'ACTIVE'),
  ('donasi.mendesak_empty', NULL, 'Saat ini tidak ada program mendesak yang tayang.', '[]', 'ACTIVE'),
  ('donasi.list_sort_labels', 'Urutkan', NULL, $j$[{"label":"Terbaru"},{"label":"Paling mendesak"}]$j$, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  heading = EXCLUDED.heading,
  body = EXCLUDED.body,
  links = EXCLUDED.links,
  publication_status = EXCLUDED.publication_status
WHERE donation_blocks.seed_untouched;

INSERT INTO website_blocks (seed_key, heading, body, links, items, publication_status) VALUES
  ('web.video', 'Cerita dari posko', 'Relawan menceritakan pagi di dapur umum: beras ditimbang, nama dicatat, lalu paket diantar sebelum magrib.', $j$[{"label":"Lihat program","href":"/program","image":"/seed/kabar/pangan.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.hero_badge', 'Lembaga amil zakat', 'Menghimpun dan menyalurkan zakat, infak, sedekah, serta wakaf.', $j$[{"image":"/brand/favicon.svg"}]$j$, '[]', 'ACTIVE'),
  ('web.hero_copy', 'Kebaikan yang sampai kepada yang berhak', 'Dari Bandung, Lentera Barokah menyalakan program pangan, kesehatan, pendidikan, dan tanggap bencana.', $j$[{"label":"Donasi sekarang","href":"/donasi"},{"label":"Lihat program","href":"/program","image":"/seed/kampanye/zakat.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.hero_map', 'Jangkauan cerita', 'Kantor di Bandung. Cerita program menyentuh dapur umum, musala dusun, dan posko banjir.', $j$[{"image":"/seed/kampanye/bencana.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.care_copy', 'Yang kami urus', 'Empat pintu: perut yang kenyang, badan yang diperiksa, anak yang tetap sekolah, dan warga yang baru kena bencana.', $j$[{"image":"/seed/kampanye/pangan.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.care_items', 'Bidang peduli', NULL, '[]', $j$[{"title":"Pangan","body":"Beras dan dapur umum.","image":"/seed/kampanye/pangan.webp"},{"title":"Kesehatan","body":"Pos periksa Kamis.","image":"/seed/kampanye/kesehatan.webp"},{"title":"Pendidikan","body":"Seragam dan buku.","image":"/seed/kampanye/pendidikan.webp"},{"title":"Bencana","body":"Posko dan selimut.","image":"/seed/kampanye/bencana.webp"}]$j$, 'ACTIVE'),
  ('web.featured_copy', 'Program yang bisa Anda pilih', 'Setiap kartu menampilkan nominal terkumpul dan sisa waktu.', $j$[{"label":"Lihat semua","href":"/program","image":"/seed/kampanye/qurban.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.featured_items', 'Sorotan', NULL, '[]', $j$[{"title":"Beras untuk Dapur Keluarga","image":"/seed/kampanye/pangan.webp","href":"/donasi/demo-umum"},{"title":"Tanggap Banjir Kampung Cisaladah","image":"/seed/kampanye/bencana.webp","href":"/donasi/demo-mendesak"},{"title":"Paket Seragam dan Buku Tulis","image":"/seed/kampanye/pendidikan.webp","href":"/donasi/demo-nominal-tetap"}]$j$, 'ACTIVE'),
  ('web.values', 'Cara kami bekerja', NULL, '[]',
    $j$[{"title":"Amanah","body":"Zakat dicatat terpisah dari infak.","image":"/seed/kampanye/zakat.webp"},{"title":"Tercatat","body":"Setiap paket punya nama di buku posko.","image":"/seed/kabar/pangan.webp"},{"title":"Tepat","body":"Bantuan mengikuti kebutuhan yang sudah dimusyawarahkan.","image":"/seed/kampanye/wakaf.webp"},{"title":"Terbuka","body":"Laporan semester ditulis dengan bahasa biasa.","image":"/seed/artikel/rak.webp"}]$j$, 'ACTIVE'),
  ('web.jejak_copy', 'Jejak yang sudah berjalan', 'Beras terbagi, kandang titipan terisi, dan ruang kelas mendapat paket buku.', $j$[{"image":"/seed/kampanye/pendidikan.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.jejak_items', 'Cuplikan jejak', NULL, '[]', $j$[{"title":"Dapur umum","body":"Pembagian selesai sebelum magrib.","image":"/seed/kampanye/pangan.webp"},{"title":"Musala","body":"Pondasi mulai diturunkan.","image":"/seed/kampanye/wakaf.webp"},{"title":"Qurban","body":"Kambing titipan sudah di kandang.","image":"/seed/kampanye/qurban.webp"}]$j$, 'ACTIVE'),
  ('web.testimoni_copy', 'Yang dikatakan donatur', 'Kalimat pendek dari orang yang menyalurkan lewat program pangan dan pendidikan.', '[]', '[]', 'ACTIVE'),
  ('web.testimoni_items', 'Kutipan', NULL, '[]', $j$[{"image":"/seed/kabar/kesehatan.webp"},{"image":"/seed/kampanye/pendidikan.webp"}]$j$, 'ACTIVE'),
  ('web.mitra_copy', 'Yang berjalan bersama', 'Sekolah, puskesmas, dan kelompok peternak membantu agar barang sampai dalam bentuk yang tepat.', $j$[{"image":"/seed/kampanye/infak.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.mitra_items', 'Mitra cerita', NULL, '[]', $j$[{"title":"SD Mekar Sarijadi","image":"/seed/kampanye/pendidikan.webp"},{"title":"Pos Kesehatan Melati","image":"/seed/kampanye/kesehatan.webp"},{"title":"Peternak Cisaladah","image":"/seed/kampanye/qurban.webp"}]$j$, 'ACTIVE'),
  ('web.kabar_copy', 'Kabar dari lapangan', 'Tulisan pendek tentang posko, kelas, dan catatan semester.', $j$[{"label":"Semua kabar","href":"/kabar-kebaikan","image":"/seed/artikel/buku.webp"}]$j$, '[]', 'ACTIVE'),
  ('web.kabar_items', 'Tulisan terbaru', NULL, '[]', $j$[{"title":"Dapur umum menyala lagi","image":"/seed/kabar/pangan.webp","href":"/kabar-kebaikan"},{"title":"Seragam untuk tahun ajaran baru","image":"/seed/artikel/buku.webp","href":"/kabar-kebaikan"},{"title":"Catatan penyaluran semester ini","image":"/seed/artikel/rak.webp","href":"/kabar-kebaikan"}]$j$, 'ACTIVE'),
  ('web.kontak_cta', 'Ada yang ingin ditanyakan?', 'Tulis ke halo@lentera-barokah.example atau kirim pesan ke nomor layanan yang tertera di kaki halaman.', $j$[{"label":"Donasi sekarang","href":"/donasi"},{"label":"Hubungi kami","href":"/kontak","image":"/brand/logo.svg"}]$j$, '[]', 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  heading = EXCLUDED.heading,
  body = EXCLUDED.body,
  links = EXCLUDED.links,
  items = EXCLUDED.items,
  publication_status = EXCLUDED.publication_status
WHERE website_blocks.seed_untouched;

INSERT INTO web_article_categories (seed_key, name, slug, publication_status) VALUES
  ('demo-article-cat-kabar', 'Kabar kebaikan', 'kabar-kebaikan', 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  publication_status = EXCLUDED.publication_status
WHERE web_article_categories.seed_untouched;

INSERT INTO web_articles (seed_key, category_id, slug, title, excerpt, body, publication_status, published_at)
SELECT v.seed_key, c.id, v.slug, v.title, v.excerpt, v.body, 'ACTIVE', TIMESTAMP '2026-10-02 09:00:00+07'
FROM (VALUES
  ('demo-article-1', 'dapur-umum-cisaladah', $t$Dapur umum Cisaladah menyala lagi$t$,
    $t$Empat ratus paket beras turun di balai, dan antrean selesai sebelum magrib.$t$,
    $t$![Relawan menurunkan kardus beras](/seed/kabar/pangan.webp)
Hujan reda pada hari kedua. Relawan membuka karung di teras balai, menimbang delapan kilogram untuk setiap keluarga, lalu menulis nama di buku yang kertasnya masih lembap. Dapur umum menyalakan tungku dari beras yang sama. Malamnya, sisa sepuluh paket disimpan untuk warga yang baru bisa pulang setelah kerja.$t$),
  ('demo-article-2', 'seragam-tahun-ajaran', $t$Seragam baru untuk tahun ajaran depan$t$,
    $t$Satu paket tetap: dua stel seragam, sepatu, dan buku tulis.$t$,
    $t$![Tumpukan buku tulis](/seed/artikel/buku.webp)
Sekolah mitra menerima paket utuh, bukan uang tunai. Guru mencentang ukuran di daftar kelas, lalu orang tua mengambil seragam di ruang guru pada hari Sabtu. Buku tulis cukup untuk satu semester, dan sampulnya masih polos agar anak yang menulis nama sendiri.$t$),
  ('demo-article-3', 'catatan-penyaluran-semester', $t$Catatan penyaluran semester ini$t$,
    $t$Ringkasan pangan, kesehatan, dan pendidikan dalam bahasa biasa.$t$,
    $t$![Rak catatan dan buku](/seed/artikel/rak.webp)
Semester ini beras bulanan berjalan di tiga titik, pos periksa buka dua belas Kamis, dan paket seragam menutup satu angkatan. Angka di laporan mengikuti buku posko.$t$)
) AS v(seed_key, slug, title, excerpt, body)
JOIN web_article_categories c ON c.seed_key = 'demo-article-cat-kabar'
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  slug = EXCLUDED.slug,
  publication_status = EXCLUDED.publication_status,
  published_at = COALESCE(web_articles.published_at, EXCLUDED.published_at)
WHERE web_articles.seed_untouched;

INSERT INTO web_tags (seed_key, name, slug) VALUES
  ('demo-tag-contoh', 'Penyaluran', 'penyaluran')
ON CONFLICT (seed_key) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug
WHERE web_tags.seed_untouched;

INSERT INTO web_article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM web_articles a
JOIN web_tags t ON t.seed_key = 'demo-tag-contoh'
WHERE a.seed_key IN ('demo-article-1', 'demo-article-2', 'demo-article-3')
ON CONFLICT DO NOTHING;

INSERT INTO web_testimonials (seed_key, person_label, quote, sort_order, publication_status) VALUES
  ('demo-testimoni-1', 'Donatur rutin, Bandung', 'Saya memilih beras bulanan karena laporannya menyebut dapur mana yang kebagian.', 1, 'ACTIVE'),
  ('demo-testimoni-2', 'Orang tua murid', 'Seragam datang satu paket. Anak tidak perlu membawa uang ke sekolah.', 2, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  person_label = EXCLUDED.person_label,
  quote = EXCLUDED.quote,
  publication_status = EXCLUDED.publication_status
WHERE web_testimonials.seed_untouched;

INSERT INTO web_partners (seed_key, name, sort_order, publication_status) VALUES
  ('demo-mitra-1', 'SD Mekar Sarijadi', 1, 'ACTIVE'),
  ('demo-mitra-2', 'Pos Kesehatan Melati', 2, 'ACTIVE'),
  ('demo-mitra-3', 'Kelompok Peternak Cisaladah', 3, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  name = EXCLUDED.name,
  publication_status = EXCLUDED.publication_status
WHERE web_partners.seed_untouched;

INSERT INTO web_care_categories (seed_key, title, summary, sort_order, publication_status) VALUES
  ('demo-care-1', 'Pangan', 'Beras bulanan dan dapur umum agar keluarga tidak menunggu sampai minggu ketiga.', 1, 'ACTIVE'),
  ('demo-care-2', 'Kesehatan', 'Pos periksa untuk tensi, gula darah, dan obat ringan.', 2, 'ACTIVE'),
  ('demo-care-3', 'Pendidikan', 'Seragam, sepatu, dan buku tulis dalam paket yang harganya tetap.', 3, 'ACTIVE'),
  ('demo-care-4', 'Bencana', 'Posko, selimut, dan beras darurat ketika air naik.', 4, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  publication_status = EXCLUDED.publication_status
WHERE web_care_categories.seed_untouched;

INSERT INTO web_impact_categories (seed_key, title, summary, sort_order, publication_status) VALUES
  ('demo-jejak-1', 'Dapur umum', 'Pembagian beras yang selesai sebelum magrib.', 1, 'ACTIVE'),
  ('demo-jejak-2', 'Musala dusun', 'Pondasi dan dinding yang dibangun bertahap dari wakaf.', 2, 'ACTIVE'),
  ('demo-jejak-3', 'Kandang titipan', 'Hewan qurban yang dipelihara sampai hari pemotongan.', 3, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  publication_status = EXCLUDED.publication_status
WHERE web_impact_categories.seed_untouched;

INSERT INTO web_impact_metrics (seed_key, metric_key, label, value_amount, suffix, is_demo, publication_status) VALUES
  ('demo-metric-1', 'demo_metric', 'Donatur yang tercatat di buku program', 4020, 'orang', true, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  label = EXCLUDED.label,
  value_amount = EXCLUDED.value_amount,
  suffix = EXCLUDED.suffix,
  publication_status = EXCLUDED.publication_status
WHERE web_impact_metrics.seed_untouched;

INSERT INTO web_distribution_points (seed_key, label, latitude, longitude, publication_status) VALUES
  ('demo-pin-1', 'Kantor layanan Bandung', -6.87620, 107.57580, 'ACTIVE'),
  ('demo-pin-2', 'Posko Cisaladah', -7.22780, 107.90810, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  label = EXCLUDED.label,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  publication_status = EXCLUDED.publication_status
WHERE web_distribution_points.seed_untouched;

INSERT INTO web_about_content (id, seed_key, title, body, publication_status) VALUES
  (1, 'demo-about', 'Tentang Lentera Barokah',
   $a$Lentera Barokah adalah lembaga amil zakat di Bandung. Kami menghimpun zakat, infak, sedekah, dan wakaf, lalu menyalurkannya untuk pangan, kesehatan, pendidikan, dan tanggap bencana.

Visi: tidak ada dapur yang padam dan tidak ada anak yang putus sekolah karena biaya.

Misi: menghimpun dengan amanah, menyalurkan dengan catatan nama, dan melaporkan dengan bahasa yang mudah dibaca.

Kantor layanan berada di Jl. Melati Rahayu No. 18, Sarijadi, Sukajadi, Bandung 40151. Surat menyurat ke halo@lentera-barokah.example.$a$,
   'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  publication_status = EXCLUDED.publication_status
WHERE web_about_content.seed_untouched;

INSERT INTO web_history_timeline (seed_key, year_label, title, body, sort_order, publication_status) VALUES
  ('demo-timeline-1', '2018', 'Yayasan berdiri', 'Akta dicatat dan kantor layanan pertama dibuka di rumah kontrakan Sarijadi.', 1, 'ACTIVE'),
  ('demo-timeline-2', '2021', 'Dapur umum pertama', 'Pembagian beras pindah dari teras kantor ke balai warga.', 2, 'ACTIVE'),
  ('demo-timeline-3', '2024', 'Pos periksa Kamis', 'Pemeriksaan tensi dan gula darah dibuka dua kali sebulan, lalu menjadi setiap Kamis.', 3, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  year_label = EXCLUDED.year_label,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  publication_status = EXCLUDED.publication_status
WHERE web_history_timeline.seed_untouched;

INSERT INTO web_mission_points (seed_key, title, body, sort_order, publication_status) VALUES
  ('demo-mission-1', 'Menghimpun dengan amanah', 'Zakat dicatat terpisah dari infak, sedekah, dan wakaf.', 1, 'ACTIVE'),
  ('demo-mission-2', 'Menyalurkan dengan catatan', 'Setiap paket punya nama di buku posko sebelum barang keluar.', 2, 'ACTIVE'),
  ('demo-mission-3', 'Melaporkan dengan bahasa biasa', 'Donatur dapat membaca ke mana dana semester ini berjalan.', 3, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  publication_status = EXCLUDED.publication_status
WHERE web_mission_points.seed_untouched;

INSERT INTO web_team_members (seed_key, role_label, display_name, sort_order, publication_status) VALUES
  ('demo-team-1', 'Ketua', 'Sari Wulandari', 1, 'ACTIVE'),
  ('demo-team-2', 'Amil penghimpunan', 'Dimas Pratama', 2, 'ACTIVE'),
  ('demo-team-3', 'Koordinator penyaluran', 'Nining Kartika', 3, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  role_label = EXCLUDED.role_label,
  display_name = EXCLUDED.display_name,
  publication_status = EXCLUDED.publication_status
WHERE web_team_members.seed_untouched;

INSERT INTO web_legality (seed_key, title, document_number, issued_by, publication_status) VALUES
  ('demo-legal-1', 'Akta pendirian yayasan', 'LB-YS-2018-014', 'Notaris Raka Widjaya, Kota Bandung', 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  document_number = EXCLUDED.document_number,
  issued_by = EXCLUDED.issued_by,
  publication_status = EXCLUDED.publication_status
WHERE web_legality.seed_untouched;

INSERT INTO web_faqs (seed_key, question, answer, sort_order, publication_status) VALUES
  ('demo-faq-1', 'Apakah zakat dan infak dicampur?', 'Tidak. Zakat masuk program bertanda zakat dan dicatat terpisah dari infak.', 1, 'ACTIVE'),
  ('demo-faq-2', 'Bisakah saya berdonasi tanpa membuat akun?', 'Bisa. Isi nama pada halaman program. Akun hanya perlu bila Anda ingin melihat riwayat.', 2, 'ACTIVE'),
  ('demo-faq-3', 'Kapan laporan penyaluran terbit?', 'Ringkasan semester ditulis setelah buku posko ditutup, lalu dibaca di halaman kabar.', 3, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  publication_status = EXCLUDED.publication_status
WHERE web_faqs.seed_untouched;

INSERT INTO web_financial_reports (seed_key, title, period_label, summary, publication_status) VALUES
  ('demo-report-1', 'Catatan penyaluran semester', 'Januari–Juni 2026',
   'Beras bulanan berjalan di tiga titik, pos periksa buka dua belas kali, dan paket seragam menutup satu angkatan. Angka mengikuti buku posko, bukan opini auditor.',
   'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  period_label = EXCLUDED.period_label,
  summary = EXCLUDED.summary,
  publication_status = EXCLUDED.publication_status
WHERE web_financial_reports.seed_untouched;

INSERT INTO web_fund_allocations (seed_key, campaign_id, title, narrative, publication_status)
SELECT 'demo-allocation-1', c.id, 'Beras bulan berjalan',
  'Sebagian dana pangan bulan ini sudah menjadi karung di dapur umum. Sisa menunggu pembagian pekan depan.',
  'ACTIVE'
FROM campaigns c WHERE c.seed_key = 'demo-umum'
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  narrative = EXCLUDED.narrative,
  publication_status = EXCLUDED.publication_status
WHERE web_fund_allocations.seed_untouched;

INSERT INTO web_bank_accounts (seed_key, bank_name, account_number, account_name, payable, is_demo, publication_status) VALUES
  ('demo-bank-1', 'Bank Amanah Nusantara', '000', 'Yayasan Lentera Barokah', false, true, 'ACTIVE')
ON CONFLICT (seed_key) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  account_name = EXCLUDED.account_name,
  payable = false,
  publication_status = EXCLUDED.publication_status
WHERE web_bank_accounts.seed_untouched;

INSERT INTO affiliates (seed_key, nama, email, status) VALUES
  ('demo-afiliasi-raka', 'Raka Maulana', 'raka.relawan@lentera-barokah.example', 'ACTIVE'),
  ('demo-afiliasi-lestari', 'Lestari Putri', 'lestari.relawan@lentera-barokah.example', 'PENDING')
ON CONFLICT (seed_key) DO UPDATE SET
  nama = EXCLUDED.nama,
  email = EXCLUDED.email,
  status = EXCLUDED.status
WHERE affiliates.seed_untouched;

INSERT INTO affiliate_campaign_commissions (affiliate_id, campaign_id, commission_pct)
SELECT a.id, c.id, 8
FROM affiliates a
JOIN campaigns c ON c.seed_key = 'demo-mendesak'
WHERE a.seed_key = 'demo-afiliasi-raka'
ON CONFLICT (affiliate_id, campaign_id) DO UPDATE SET commission_pct = EXCLUDED.commission_pct;

-- Tidak ada users, donors, invoices, transactions, payment_events,
-- notification_outbox, affiliate_ledger, payout_requests, atau klik.
-- Dua afiliasi contoh tidak membawa saldo.

SELECT set_config('digidonasi.seeding', 'off', true);
