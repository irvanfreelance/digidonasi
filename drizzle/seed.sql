-- Seed sintetis. Jalan di satu transaksi dengan digidonasi.seeding=on.
SELECT set_config('digidonasi.seeding', 'on', true);

INSERT INTO org_profile (
  id, seed_key, nama, nama_singkat, tagline, short_description, address,
  primary_color, sidebar_color, accent_color, seed_untouched
) VALUES (
  1, 'org.profile',
  '[DEMO] Lembaga Contoh', 'DEMO',
  '[DEMO] Bukan lembaga sungguhan',
  '[DEMO] Teks kaki beranda donasi. Sunting sebelum diterbitkan.',
  '[DEMO] Alamat contoh, bukan kantor operasional',
  '#01665a', '#01665a', '#2e8b7a', true
)
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama,
  nama_singkat = EXCLUDED.nama_singkat,
  tagline = EXCLUDED.tagline,
  short_description = EXCLUDED.short_description,
  address = EXCLUDED.address,
  primary_color = EXCLUDED.primary_color,
  sidebar_color = EXCLUDED.sidebar_color,
  accent_color = EXCLUDED.accent_color
WHERE org_profile.seed_untouched;

INSERT INTO app_config (key, value, description, is_proposal) VALUES
  ('timezone', 'Asia/Jakarta', 'Zona waktu tampilan.', false),
  ('bootstrap_admin_opt_in', 'false', 'Isi email lewat env pelaksana. Berkas ini tidak membuat akun.', true),
  ('bootstrap_admin_email', '', 'Kosong. Bukan email orang.', true),
  ('default_commission_pct', '0', 'Usulan: kampanye baru 0 persen sampai diatur.', true),
  ('attribution_model', 'last_click', 'Usulan model atribusi. Aplikasi yang menerapkan, bukan pemicu SQL.', true),
  ('attribution_window_days', '30', 'Usulan jendela klik terakhir. Bukan keputusan bisnis final.', true),
  ('commission_hold_days', '14', 'Usulan tahan komisi. Tidak ada pekerjaan otomatis di SQL.', true)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  is_proposal = EXCLUDED.is_proposal
WHERE app_config.seed_untouched;

INSERT INTO categories (seed_key, name, slug, icon_name, sort_order) VALUES
  ('demo-cat-zakat', '[DEMO] Zakat', 'demo-zakat', 'Banknote', 1),
  ('demo-cat-infak', '[DEMO] Infak', 'demo-infak', 'HandHeart', 2),
  ('demo-cat-wakaf', '[DEMO] Wakaf', 'demo-wakaf', 'Landmark', 3),
  ('demo-cat-qurban', '[DEMO] Qurban', 'demo-qurban', 'Gift', 4),
  ('demo-cat-kemanusiaan', '[DEMO] Kemanusiaan', 'demo-kemanusiaan', 'Heart', 5)
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
       'DRAFT', v.is_verified, v.is_urgent, v.is_zakat, v.is_qurban, v.is_fixed_amount,
       v.is_bundle, v.has_no_target, v.has_no_time_limit, v.is_carousel, v.minimum_amount,
       v.target_amount, v.suggestion_amounts, v.end_date, v.base_commission_pct, v.sort_order
FROM (VALUES
  ('demo-umum', 'demo-cat-kemanusiaan', 'demo-umum', '[DEMO] Donasi umum', '[DEMO] Ringkasan umum', '[DEMO] Deskripsi umum.', 'demo://kampanye/umum', '[DEMO] Gambar umum',
    true, false, false, false, false, false, false, false, false, 10000::bigint, 100000000::bigint, ARRAY[10000,50000,100000]::bigint[], DATE '2027-12-31', 0::numeric, 1::smallint),
  ('demo-mendesak', 'demo-cat-kemanusiaan', 'demo-mendesak', '[DEMO] Bantuan mendesak', '[DEMO] Ringkasan mendesak', '[DEMO] Bukan peristiwa sungguhan.', 'demo://kampanye/mendesak', '[DEMO] Gambar mendesak',
    true, true, false, false, false, false, false, false, true, 10000::bigint, 50000000::bigint, ARRAY[25000,50000]::bigint[], DATE '2027-06-30', 5::numeric, 2::smallint),
  ('demo-zakat', 'demo-cat-zakat', 'demo-zakat', '[DEMO] Zakat', '[DEMO] Ringkasan zakat', '[DEMO] Bukan himpunan asnaf.', 'demo://kampanye/zakat', '[DEMO] Gambar zakat',
    false, false, true, false, false, false, false, false, false, 50000::bigint, 200000000::bigint, ARRAY[50000,100000]::bigint[], DATE '2027-12-31', 0::numeric, 3::smallint),
  ('demo-qurban', 'demo-cat-qurban', 'demo-qurban', '[DEMO] Qurban', '[DEMO] Ringkasan qurban', '[DEMO] Harga contoh per varian.', 'demo://kampanye/qurban', '[DEMO] Gambar qurban',
    false, false, false, true, true, false, false, false, false, 2500000::bigint, 200000000::bigint, ARRAY[]::bigint[], DATE '2027-12-31', 0::numeric, 4::smallint),
  ('demo-bundel', 'demo-cat-infak', 'demo-bundel', '[DEMO] Bundel', '[DEMO] Ringkasan bundel', '[DEMO] Dua kampanye anak.', 'demo://kampanye/bundel', '[DEMO] Gambar bundel',
    false, false, false, false, false, true, false, false, false, 20000::bigint, 10000000::bigint, ARRAY[]::bigint[], DATE '2027-12-31', 0::numeric, 5::smallint),
  ('demo-tanpa-target', 'demo-cat-wakaf', 'demo-tanpa-target', '[DEMO] Tanpa target', '[DEMO] Tidak punya target nominal', '[DEMO] Teks.', 'demo://kampanye/tanpa-target', '[DEMO] Gambar tanpa target',
    false, false, false, false, false, false, true, false, false, 10000::bigint, NULL::bigint, ARRAY[10000]::bigint[], DATE '2027-12-31', 0::numeric, 6::smallint),
  ('demo-tanpa-batas', 'demo-cat-wakaf', 'demo-tanpa-batas', '[DEMO] Tanpa batas waktu', '[DEMO] Tidak punya tanggal selesai', '[DEMO] Teks.', 'demo://kampanye/tanpa-batas', '[DEMO] Gambar tanpa batas',
    false, false, false, false, false, false, false, true, false, 10000::bigint, 10000000::bigint, ARRAY[10000]::bigint[], NULL::date, 0::numeric, 7::smallint),
  ('demo-nominal-tetap', 'demo-cat-infak', 'demo-nominal-tetap', '[DEMO] Nominal tetap', '[DEMO] Satu harga', '[DEMO] Bukan qurban.', 'demo://kampanye/nominal-tetap', '[DEMO] Gambar nominal tetap',
    false, false, false, false, true, false, false, false, false, 100000::bigint, 10000000::bigint, ARRAY[100000]::bigint[], DATE '2027-12-31', 0::numeric, 8::smallint)
) AS v(
  seed_key, category_key, slug, title, summary, description, image_url, image_alt,
  is_verified, is_urgent, is_zakat, is_qurban, is_fixed_amount, is_bundle,
  has_no_target, has_no_time_limit, is_carousel, minimum_amount, target_amount,
  suggestion_amounts, end_date, base_commission_pct, sort_order
)
JOIN categories c ON c.seed_key = v.category_key
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  description = EXCLUDED.description,
  base_commission_pct = EXCLUDED.base_commission_pct,
  is_verified = EXCLUDED.is_verified,
  is_urgent = EXCLUDED.is_urgent,
  is_zakat = EXCLUDED.is_zakat,
  is_qurban = EXCLUDED.is_qurban,
  is_fixed_amount = EXCLUDED.is_fixed_amount,
  is_bundle = EXCLUDED.is_bundle,
  has_no_target = EXCLUDED.has_no_target,
  has_no_time_limit = EXCLUDED.has_no_time_limit,
  is_carousel = EXCLUDED.is_carousel
WHERE campaigns.seed_untouched;

INSERT INTO campaign_variants (seed_key, campaign_id, name, price_rupiah, names_per_qty)
SELECT v.seed_key, c.id, v.name, v.price_rupiah, v.names_per_qty
FROM (VALUES
  ('demo-qurban-kambing', 'demo-qurban', '[DEMO] Kambing', 2500000::bigint, 1::smallint),
  ('demo-qurban-sapi', 'demo-qurban', '[DEMO] Sapi', 15000000::bigint, 7::smallint)
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

INSERT INTO campaign_updates (seed_key, campaign_id, title, body)
SELECT 'demo-update-mendesak', c.id,
       '[DEMO] Kabar contoh',
       '[DEMO] Ini konten suntingan, bukan operasional penyaluran dan bukan data penerima.'
FROM campaigns c WHERE c.seed_key = 'demo-mendesak'
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body
WHERE campaign_updates.seed_untouched;

INSERT INTO campaign_stats (campaign_id, collected_amount, donor_count)
SELECT id, 0, 0 FROM campaigns
WHERE seed_key LIKE 'demo-%'
ON CONFLICT (campaign_id) DO NOTHING;

INSERT INTO campaign_qris_static (seed_key, campaign_id, status, qris_string, is_demo)
SELECT 'demo-qris-umum', id, 'DISABLED', '', true
FROM campaigns WHERE seed_key = 'demo-umum'
ON CONFLICT (seed_key) DO UPDATE SET
  status = EXCLUDED.status,
  qris_string = EXCLUDED.qris_string,
  is_demo = EXCLUDED.is_demo
WHERE campaign_qris_static.seed_untouched;

INSERT INTO payment_providers (code, adapter_status, is_active, note) VALUES
  ('xendit', 'ready', false, 'Adapter v1. Tidak aktif sampai klien mengisi rahasia di env dan menyalakan kanal.'),
  ('midtrans', 'ready', false, 'Adapter v1. Tidak aktif sampai klien mengisi rahasia di env dan menyalakan kanal.'),
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
  ('demo-pay-va', 'demo-va', '[DEMO] Virtual account', 'VIRTUAL_ACCOUNT', 'va', 'xendit', 0, 0, false, false, 1),
  ('demo-pay-ewallet', 'demo-ewallet', '[DEMO] Dompet', 'EWALLET', NULL, 'xendit', 0, 0, false, true, 2),
  ('demo-pay-retail', 'demo-retail', '[DEMO] Gerai', 'OVER_THE_COUNTER', 'retail_outlet', 'xendit', 0, 0, false, false, 3),
  ('demo-pay-qris', 'demo-qris', '[DEMO] QR tidak bisa dipindai', 'QR_CODE', NULL, 'xendit', 0, 0, false, false, 4),
  ('demo-pay-snap', 'demo-snap', '[DEMO] Snap', 'SNAP', 'midtrans', 'midtrans', 0, 0, false, true, 5),
  ('demo-pay-manual', 'demo-manual', '[DEMO] Manual nonaktif', 'MANUAL', 'manual', NULL, 0, 0, false, false, 6)
ON CONFLICT (seed_key) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = false,
  channel_type = EXCLUDED.channel_type,
  legacy_alias = EXCLUDED.legacy_alias
WHERE payment_methods.seed_untouched;

INSERT INTO payment_instructions (seed_key, payment_method_id, title, body, sort_order)
SELECT v.seed_key, m.id, v.title, v.body, 1
FROM (VALUES
  ('demo-ins-va', 'demo-pay-va', '[DEMO] Instruksi VA', '[DEMO] Kanal nonaktif. Jangan dibayar.'),
  ('demo-ins-ewallet', 'demo-pay-ewallet', '[DEMO] Instruksi dompet', '[DEMO] Kanal nonaktif. Jangan dibayar.'),
  ('demo-ins-retail', 'demo-pay-retail', '[DEMO] Instruksi gerai', '[DEMO] Kanal nonaktif. Jangan dibayar.'),
  ('demo-ins-qris', 'demo-pay-qris', '[DEMO] Instruksi QR', '[DEMO] Tidak ada gambar QR dan tidak ada string bayar.'),
  ('demo-ins-snap', 'demo-pay-snap', '[DEMO] Instruksi Snap', '[DEMO] Kanal nonaktif. Jangan dibayar.'),
  ('demo-ins-manual', 'demo-pay-manual', '[DEMO] Instruksi manual', '[DEMO] Bukan rekening. Nomor 000 tidak ada di kanal ini.')
) AS v(seed_key, method_key, title, body)
JOIN payment_methods m ON m.seed_key = v.method_key
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body
WHERE payment_instructions.seed_untouched;

INSERT INTO notification_templates (seed_key, event_trigger, channel, subject, body, is_active) VALUES
  ('demo-tpl-checkout-email', 'CHECKOUT', 'email', '[DEMO] Tagihan', '[DEMO] Templat. Tidak ada kunci pengirim.', false),
  ('demo-tpl-checkout-wa', 'CHECKOUT', 'wa', NULL, '[DEMO] Templat. Tidak ada kunci pengirim.', false),
  ('demo-tpl-paid-email', 'PAID', 'email', '[DEMO] Terima kasih', '[DEMO] Templat. Tidak ada kunci pengirim.', false),
  ('demo-tpl-paid-wa', 'PAID', 'wa', NULL, '[DEMO] Templat. Tidak ada kunci pengirim.', false)
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

INSERT INTO donation_blocks (seed_key, heading, body, links) VALUES
  ('donasi.header', '[DEMO] Lembaga Contoh', NULL, '[]'),
  ('donasi.search_placeholder', NULL, '[DEMO] Cari kampanye atau kategori', '[]'),
  ('donasi.carousel', '[DEMO] Geser kampanye', NULL, '[]'),
  ('donasi.kategori_heading', '[DEMO] Kategori pilihan', NULL, '[]'),
  ('donasi.kategori_items', '[DEMO] Isi kategori', 'Baris categories.', '[]'),
  ('donasi.mendesak_heading', '[DEMO] Bantuan mendesak', NULL, '[{"label":"[DEMO] Lainnya","href":"/donasi/mendesak"}]'),
  ('donasi.mendesak_items', '[DEMO] Kartu mendesak', 'Kampanye is_urgent.', '[]'),
  ('donasi.rekomendasi_heading', '[DEMO] Rekomendasi kebaikan', NULL, '[]'),
  ('donasi.list', '[DEMO] Daftar kampanye', NULL, '[]'),
  ('donasi.search_result_heading', '[DEMO] Hasil pencarian', '[DEMO] {n} program ditemukan', '[]'),
  ('donasi.search_empty', NULL, '[DEMO] Tidak ada kampanye yang sesuai.', '[]'),
  ('donasi.footer', '[DEMO] Kaki halaman', '[DEMO] Medsos dan hak cipta contoh.', '[]'),
  ('donasi.mendesak_page_title', '[DEMO] Bantuan mendesak', NULL, '[]'),
  ('donasi.mendesak_empty', NULL, '[DEMO] Belum ada program mendesak.', '[]'),
  ('donasi.list_sort_labels', '[DEMO] Urutan', NULL, '[{"label":"[DEMO] Terbaru"},{"label":"[DEMO] Paling mendesak"}]')
ON CONFLICT (seed_key) DO UPDATE SET
  heading = EXCLUDED.heading,
  body = EXCLUDED.body,
  links = EXCLUDED.links
WHERE donation_blocks.seed_untouched;

INSERT INTO website_blocks (seed_key, heading, body, links, items) VALUES
  ('web.video', '[DEMO] Saksikan contoh', '[DEMO] Naskah video. Tidak ada berkas video.', '[{"label":"[DEMO] Lihat program","href":"/program"}]', '[]'),
  ('web.hero_badge', '[DEMO] Lencana contoh', '[DEMO] Bukan nomor izin.', '[]', '[]'),
  ('web.hero_copy', '[DEMO] Judul beranda', '[DEMO] Paragraf contoh.', '[{"label":"[DEMO] Donasi sekarang","href":"/donasi"},{"label":"[DEMO] Lihat program","href":"/program"}]', '[]'),
  ('web.hero_map', '[DEMO] Peta contoh', '[DEMO] Bukan sebaran operasional.', '[]', '[]'),
  ('web.care_copy', '[DEMO] Dampak contoh', '[DEMO] Paragraf kategori peduli.', '[]', '[]'),
  ('web.care_items', '[DEMO] Kategori peduli', NULL, '[]', '[]'),
  ('web.featured_copy', '[DEMO] Program unggulan', '[DEMO] Program kami', '[{"label":"[DEMO] Lihat semua","href":"/program"}]', '[]'),
  ('web.featured_items', '[DEMO] Kartu unggulan', NULL, '[]', '[]'),
  ('web.values', '[DEMO] Nilai inti', NULL, '[]',
    '[{"title":"[DEMO] Legalitas contoh","body":"[DEMO] Bukan izin."},{"title":"[DEMO] Transparan contoh","body":"[DEMO] Bukan hasil audit."},{"title":"[DEMO] Sasaran contoh","body":"[DEMO] Bukan data penerima."},{"title":"[DEMO] Dampak contoh","body":"[DEMO] Bukan angka operasional."}]'),
  ('web.jejak_copy', '[DEMO] Bukti dampak', '[DEMO] Paragraf jejak.', '[]', '[]'),
  ('web.jejak_items', '[DEMO] Jejak', NULL, '[]', '[]'),
  ('web.testimoni_copy', '[DEMO] Kisah contoh', NULL, '[]', '[]'),
  ('web.testimoni_items', '[DEMO] Kutipan', NULL, '[]', '[]'),
  ('web.mitra_copy', '[DEMO] Kemitraan contoh', NULL, '[]', '[]'),
  ('web.mitra_items', '[DEMO] Mitra', NULL, '[]', '[]'),
  ('web.kabar_copy', '[DEMO] Kabar contoh', '[DEMO] Berita dan laporan contoh.', '[{"label":"[DEMO] Semua berita","href":"/kabar-kebaikan"}]', '[]'),
  ('web.kabar_items', '[DEMO] Kartu artikel', NULL, '[]', '[]'),
  ('web.kontak_cta', '[DEMO] Ajakan kontak', '[DEMO] Bukan nomor petugas.', '[{"label":"[DEMO] Donasi sekarang","href":"/donasi"},{"label":"[DEMO] Hubungi kami","href":"/kontak"}]', '[]')
ON CONFLICT (seed_key) DO UPDATE SET
  heading = EXCLUDED.heading,
  body = EXCLUDED.body,
  links = EXCLUDED.links,
  items = EXCLUDED.items
WHERE website_blocks.seed_untouched;

INSERT INTO web_article_categories (seed_key, name, slug) VALUES
  ('demo-article-cat-kabar', '[DEMO] Kabar', 'demo-kabar')
ON CONFLICT (seed_key) DO UPDATE SET name = EXCLUDED.name
WHERE web_article_categories.seed_untouched;

INSERT INTO web_articles (seed_key, category_id, slug, title, excerpt, body)
SELECT v.seed_key, c.id, v.slug, v.title, v.excerpt, v.body
FROM (VALUES
  ('demo-article-1', 'demo-artikel-1', '[DEMO] Artikel satu', '[DEMO] Kutipan satu', '[DEMO] Isi satu.'),
  ('demo-article-2', 'demo-artikel-2', '[DEMO] Artikel dua', '[DEMO] Kutipan dua', '[DEMO] Isi dua.'),
  ('demo-article-3', 'demo-artikel-3', '[DEMO] Artikel tiga', '[DEMO] Kutipan tiga', '[DEMO] Isi tiga.')
) AS v(seed_key, slug, title, excerpt, body)
JOIN web_article_categories c ON c.seed_key = 'demo-article-cat-kabar'
ON CONFLICT (seed_key) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body
WHERE web_articles.seed_untouched;

INSERT INTO web_tags (seed_key, name, slug) VALUES
  ('demo-tag-contoh', '[DEMO] Contoh', 'demo-contoh')
ON CONFLICT (seed_key) DO UPDATE SET name = EXCLUDED.name
WHERE web_tags.seed_untouched;

INSERT INTO web_article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM web_articles a
JOIN web_tags t ON t.seed_key = 'demo-tag-contoh'
WHERE a.seed_key IN ('demo-article-1', 'demo-article-2', 'demo-article-3')
ON CONFLICT DO NOTHING;

INSERT INTO web_testimonials (seed_key, person_label, quote, sort_order) VALUES
  ('demo-testimoni-1', '[DEMO] Peran contoh', '[DEMO] Kutipan fiktif.', 1)
ON CONFLICT (seed_key) DO UPDATE SET quote = EXCLUDED.quote
WHERE web_testimonials.seed_untouched;

INSERT INTO web_partners (seed_key, name, sort_order) VALUES
  ('demo-mitra-1', '[DEMO] Mitra contoh', 1)
ON CONFLICT (seed_key) DO UPDATE SET name = EXCLUDED.name
WHERE web_partners.seed_untouched;

INSERT INTO web_care_categories (seed_key, title, summary, sort_order) VALUES
  ('demo-care-1', '[DEMO] Peduli contoh', '[DEMO] Bukan program operasional.', 1)
ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary
WHERE web_care_categories.seed_untouched;

INSERT INTO web_impact_categories (seed_key, title, summary, sort_order) VALUES
  ('demo-jejak-1', '[DEMO] Jejak contoh', '[DEMO] Bukan wilayah penyaluran.', 1)
ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary
WHERE web_impact_categories.seed_untouched;

INSERT INTO web_impact_metrics (seed_key, metric_key, label, value_amount, suffix, is_demo) VALUES
  ('demo-metric-1', 'demo_metric', '[DEMO] Angka pemasaran', 0, '[DEMO]', true)
ON CONFLICT (seed_key) DO UPDATE SET label = EXCLUDED.label, value_amount = EXCLUDED.value_amount
WHERE web_impact_metrics.seed_untouched;

INSERT INTO web_distribution_points (seed_key, label, latitude, longitude) VALUES
  ('demo-pin-1', '[DEMO] Kota contoh', NULL, NULL)
ON CONFLICT (seed_key) DO UPDATE SET label = EXCLUDED.label
WHERE web_distribution_points.seed_untouched;

INSERT INTO web_about_content (id, seed_key, title, body) VALUES
  (1, 'demo-about', '[DEMO] Tentang contoh', '[DEMO] Bukan profil lembaga sungguhan.')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body
WHERE web_about_content.seed_untouched;

INSERT INTO web_history_timeline (seed_key, year_label, title, body, sort_order) VALUES
  ('demo-timeline-1', '[DEMO]', '[DEMO] Linimasa', '[DEMO] Bukan sejarah resmi.', 1)
ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body
WHERE web_history_timeline.seed_untouched;

INSERT INTO web_mission_points (seed_key, title, body, sort_order) VALUES
  ('demo-mission-1', '[DEMO] Misi contoh', '[DEMO] Bukan anggaran dasar.', 1)
ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body
WHERE web_mission_points.seed_untouched;

INSERT INTO web_team_members (seed_key, role_label, display_name, sort_order) VALUES
  ('demo-team-1', '[DEMO] Peran contoh', '[DEMO] Nama jabatan', 1)
ON CONFLICT (seed_key) DO UPDATE SET role_label = EXCLUDED.role_label, display_name = EXCLUDED.display_name
WHERE web_team_members.seed_untouched;

INSERT INTO web_legality (seed_key, title, document_number, issued_by) VALUES
  ('demo-legal-1', '[DEMO] Dokumen contoh', 'DEMO-000', '[DEMO] Bukan instansi')
ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title
WHERE web_legality.seed_untouched;

INSERT INTO web_faqs (seed_key, question, answer, sort_order) VALUES
  ('demo-faq-1', '[DEMO] Pertanyaan contoh?', '[DEMO] Jawaban contoh.', 1)
ON CONFLICT (seed_key) DO UPDATE SET question = EXCLUDED.question, answer = EXCLUDED.answer
WHERE web_faqs.seed_untouched;

INSERT INTO web_financial_reports (seed_key, title, period_label, summary) VALUES
  ('demo-report-1', '[DEMO] Laporan contoh', '[DEMO] Periode', '[DEMO] Bukan hasil audit.')
ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary
WHERE web_financial_reports.seed_untouched;

INSERT INTO web_fund_allocations (seed_key, campaign_id, title, narrative)
SELECT 'demo-allocation-1', c.id, '[DEMO] Alokasi contoh', '[DEMO] Narasi konten, bukan pencairan.'
FROM campaigns c WHERE c.seed_key = 'demo-umum'
ON CONFLICT (seed_key) DO UPDATE SET title = EXCLUDED.title, narrative = EXCLUDED.narrative
WHERE web_fund_allocations.seed_untouched;

INSERT INTO web_bank_accounts (seed_key, bank_name, account_number, account_name, payable, is_demo) VALUES
  ('demo-bank-1', '[DEMO] Bank contoh', '000', '[DEMO] Bukan rekening', false, true)
ON CONFLICT (seed_key) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  payable = false
WHERE web_bank_accounts.seed_untouched;

-- Tidak ada baris users, donors, affiliates, invoices, transactions,
-- payment_events, notification_outbox, affiliate_ledger, payout_requests, atau klik.

SELECT set_config('digidonasi.seeding', 'off', true);
