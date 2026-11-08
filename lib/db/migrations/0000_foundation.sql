-- Sumber kebenaran skema digidonasi, revisi 1.
-- Direkonsiliasi ke konvensi erpboilerplate: org_profile, app_config, users, audit_logs.
-- Draf SQL admin_users dipetakan ke users. Bukan tabel kedua.
-- PostgreSQL 17. Tanpa DROP tabel, tanpa sandi, tanpa website_enabled di basis.

-- Dipasang oleh npm run db:migrate pada basis klien yang kosong.
-- Menolak nama basis yang memuat darul atau hikam, dan menolak tabel lain di public.
-- WEBSITE_ENABLED bukan kolom dan bukan baris app_config. Hak paket ada di env server.
-- Tidak ada DROP tabel, TRUNCATE, sandi, host produksi, atau secret.

-- -----------------------------------------------------------------------
-- Penjaga
-- -----------------------------------------------------------------------
DO $$
DECLARE
  foreign_tables int;
  revision int;
  dbname text := current_database();
  allowed text[] := ARRAY[
    'digidonasi_schema',
    'org_profile',
    'app_config',
    'users',
    'audit_logs',
    'donors',
    'affiliates',
    'categories',
    'campaigns',
    'campaign_variants',
    'campaign_bundles',
    'campaign_updates',
    'campaign_stats',
    'campaign_qris_static',
    'payment_providers',
    'payment_methods',
    'payment_instructions',
    'invoices',
    'transactions',
    'transaction_qurban_names',
    'payment_events',
    'notification_templates',
    'notification_outbox',
    'tracking_public_ids',
    'pixel_events',
    'donation_blocks',
    'website_blocks',
    'web_article_categories',
    'web_articles',
    'web_tags',
    'web_article_tags',
    'web_testimonials',
    'web_partners',
    'web_care_categories',
    'web_impact_categories',
    'web_impact_metrics',
    'web_distribution_points',
    'web_about_content',
    'web_history_timeline',
    'web_mission_points',
    'web_team_members',
    'web_legality',
    'web_faqs',
    'web_financial_reports',
    'web_fund_allocations',
    'web_bank_accounts',
    'affiliate_clicks',
    'affiliate_campaign_commissions',
    'affiliate_ledger',
    'payout_requests'
  ];
BEGIN
  IF dbname ~* 'darul|hikam' THEN
    RAISE EXCEPTION 'digidonasi menolak basis bernama %', dbname;
  END IF;

  SELECT count(*) INTO foreign_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND NOT (c.relname = ANY (allowed));

  IF foreign_tables > 0 THEN
    RAISE EXCEPTION 'digidonasi menolak pemasangan: ada % tabel lain di skema public', foreign_tables;
  END IF;

  IF to_regclass('public.digidonasi_schema') IS NOT NULL THEN
    SELECT s.revision INTO revision FROM digidonasi_schema s WHERE s.id = 1;
    IF revision IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION 'revisi skema % tidak kompatibel dengan berkas ini', revision;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------
-- Fungsi
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION digidonasi_require_column(p_table text, p_column text, p_type text)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
      AND udt_name = p_type
  ) THEN
    RAISE EXCEPTION 'skema tidak kompatibel: %.% bertipe % tidak ada', p_table, p_column, p_type;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION digidonasi_mark_edited()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF coalesce(current_setting('digidonasi.seeding', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.seed_untouched := false;
  IF TG_TABLE_NAME = 'org_profile' THEN
    NEW.is_seed_default := false;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION digidonasi_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION affiliate_ledger_deltas(p_movement text, p_amount bigint)
RETURNS TABLE(pending bigint, available bigint, reserved bigint, settled bigint)
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    CASE p_movement
      WHEN 'commission_hold' THEN p_amount
      WHEN 'hold_to_available' THEN -p_amount
      WHEN 'reverse_pending' THEN -p_amount
      ELSE 0::bigint
    END,
    CASE p_movement
      WHEN 'hold_to_available' THEN p_amount
      WHEN 'reverse_available' THEN -p_amount
      WHEN 'payout_reserve' THEN -p_amount
      WHEN 'payout_release' THEN p_amount
      ELSE 0::bigint
    END,
    CASE p_movement
      WHEN 'payout_reserve' THEN p_amount
      WHEN 'payout_release' THEN -p_amount
      WHEN 'payout_settle' THEN -p_amount
      ELSE 0::bigint
    END,
    CASE p_movement
      WHEN 'payout_settle' THEN p_amount
      ELSE 0::bigint
    END;
$$;

CREATE OR REPLACE FUNCTION affiliate_ledger_guard()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  have_pending bigint;
  have_available bigint;
  have_reserved bigint;
  have_settled bigint;
  add_pending bigint;
  add_available bigint;
  add_reserved bigint;
  add_settled bigint;
  cap constant bigint := 100000000000000;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'affiliate_ledger hanya menambah baris';
  END IF;

  PERFORM 1 FROM affiliates WHERE id = NEW.affiliate_id FOR UPDATE;

  SELECT
    coalesce(sum(d.pending), 0),
    coalesce(sum(d.available), 0),
    coalesce(sum(d.reserved), 0),
    coalesce(sum(d.settled), 0)
  INTO have_pending, have_available, have_reserved, have_settled
  FROM affiliate_ledger l
  CROSS JOIN LATERAL affiliate_ledger_deltas(l.movement, l.amount_rupiah) d
  WHERE l.affiliate_id = NEW.affiliate_id;

  SELECT d.pending, d.available, d.reserved, d.settled
  INTO add_pending, add_available, add_reserved, add_settled
  FROM affiliate_ledger_deltas(NEW.movement, NEW.amount_rupiah) d;

  IF have_pending + add_pending < 0
     OR have_available + add_available < 0
     OR have_reserved + add_reserved < 0
     OR have_settled + add_settled < 0 THEN
    RAISE EXCEPTION 'saldo afiliasi tidak cukup untuk %', NEW.movement;
  END IF;

  IF have_pending + add_pending > cap
     OR have_available + add_available > cap
     OR have_reserved + add_reserved > cap
     OR have_settled + add_settled > cap THEN
    RAISE EXCEPTION 'penjaga luapan saldo afiliasi';
  END IF;

  IF NEW.movement = 'commission_hold' THEN
    IF NEW.transaction_id IS NULL THEN
      RAISE EXCEPTION 'commission_hold butuh transaction_id';
    END IF;
    IF EXISTS (
      SELECT 1
      FROM transactions t
      JOIN invoices i ON i.id = t.invoice_id
      JOIN affiliates a ON a.id = NEW.affiliate_id
      WHERE t.id = NEW.transaction_id
        AND t.affiliate_id IS NOT DISTINCT FROM NEW.affiliate_id
        AND i.donor_email IS NOT NULL
        AND lower(i.donor_email) = lower(a.email)
    ) THEN
      RAISE EXCEPTION 'donasi ke diri sendiri tidak menghasilkan komisi';
    END IF;
  END IF;

  IF NEW.movement IN ('hold_to_available', 'reverse_pending', 'reverse_available')
     AND NEW.transaction_id IS NULL THEN
    RAISE EXCEPTION '% butuh transaction_id', NEW.movement;
  END IF;

  IF NEW.movement IN ('payout_reserve', 'payout_release', 'payout_settle') THEN
    IF NEW.payout_request_id IS NULL THEN
      RAISE EXCEPTION '% butuh payout_request_id', NEW.movement;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM payout_requests p
      WHERE p.id = NEW.payout_request_id
        AND p.affiliate_id = NEW.affiliate_id
        AND p.amount_rupiah = NEW.amount_rupiah
    ) THEN
      RAISE EXCEPTION 'nominal penarikan tidak sama dengan permintaan';
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION affiliate_ledger_immutable()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'affiliate_ledger tidak boleh diubah atau dihapus';
END $$;

CREATE OR REPLACE FUNCTION digidonasi_invoice_lines_match()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_invoice_id bigint;
  expected bigint;
  actual bigint;
BEGIN
  v_invoice_id := coalesce(NEW.invoice_id, OLD.invoice_id);
  SELECT i.base_amount INTO expected FROM invoices i WHERE i.id = v_invoice_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT coalesce(sum(t.amount), 0) INTO actual FROM transactions t WHERE t.invoice_id = v_invoice_id;
  IF expected IS DISTINCT FROM actual THEN
    RAISE EXCEPTION 'jumlah transaksi % tidak sama dengan base_amount % pada invoice %', actual, expected, v_invoice_id;
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION digidonasi_invoice_self_match()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  actual bigint;
BEGIN
  SELECT coalesce(sum(t.amount), 0) INTO actual
  FROM transactions t
  WHERE t.invoice_id = NEW.id;
  IF actual IS DISTINCT FROM NEW.base_amount THEN
    RAISE EXCEPTION 'jumlah transaksi % tidak sama dengan base_amount % pada invoice %', actual, NEW.base_amount, NEW.id;
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION digidonasi_payment_event_amount()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  total bigint;
BEGIN
  SELECT i.total_amount INTO total FROM invoices i WHERE i.id = NEW.invoice_id;
  IF total IS NULL OR total IS DISTINCT FROM NEW.amount_rupiah THEN
    RAISE EXCEPTION 'nominal event pembayaran tidak sama dengan total invoice';
  END IF;
  RETURN NEW;
END $$;

-- -----------------------------------------------------------------------
-- Tabel
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digidonasi_schema (
  id smallint PRIMARY KEY CHECK (id = 1),
  revision smallint NOT NULL CHECK (revision = 1),
  note text NOT NULL,
  installed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_profile (
  id smallint PRIMARY KEY CHECK (id = 1),
  seed_key text NOT NULL UNIQUE,
  nama text NOT NULL,
  nama_singkat text NOT NULL,
  tagline text NOT NULL,
  short_description text NOT NULL,
  address text NOT NULL,
  logo_url text,
  favicon_url text,
  video_url text,
  primary_color text NOT NULL,
  sidebar_color text NOT NULL,
  accent_color text NOT NULL,
  facebook_url text,
  instagram_url text,
  whatsapp_number text,
  public_email text,
  is_seed_default boolean NOT NULL DEFAULT true,
  seed_untouched boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CHECK (sidebar_color ~ '^#[0-9A-Fa-f]{6}$'),
  CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text NOT NULL,
  is_proposal boolean NOT NULL,
  seed_untouched boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (key <> 'website_enabled')
);

CREATE TABLE IF NOT EXISTS users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama text NOT NULL,
  email text NOT NULL,
  google_sub text,
  role text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  seed_key text UNIQUE,
  seed_untouched boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (role IN ('SUPERADMIN', 'WEBSITE_EDITOR')),
  CHECK (email ~* '^[^@]+@[^@]+$'),
  CHECK (google_sub IS NULL OR length(google_sub) > 0)
);
COMMENT ON TABLE users IS 'Operator panel. Memetakan admin_users pada draf SQL. Bukan donors dan bukan affiliates. Tanpa password_hash.';
COMMENT ON COLUMN users.is_active IS 'Memetakan status ACTIVE/INACTIVE pada draf SQL. false = INACTIVE.';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_uq ON users (google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_admin_id bigint REFERENCES users (id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  value_before jsonb,
  value_after jsonb,
  source text NOT NULL DEFAULT 'web_app',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donors (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama text NOT NULL,
  email text,
  google_sub text,
  phone_canonical text,
  is_anonymous_default boolean NOT NULL DEFAULT false,
  seed_key text UNIQUE,
  seed_untouched boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (email IS NULL OR email ~* '^[^@]+@[^@]+$'),
  CHECK (google_sub IS NULL OR length(google_sub) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS donors_email_lower_uq ON donors (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS donors_google_sub_uq ON donors (google_sub) WHERE google_sub IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS donors_phone_uq ON donors (phone_canonical) WHERE phone_canonical IS NOT NULL;

CREATE TABLE IF NOT EXISTS affiliates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama text NOT NULL,
  email text NOT NULL,
  google_sub text,
  status text NOT NULL DEFAULT 'PENDING',
  seed_key text UNIQUE,
  seed_untouched boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED')),
  CHECK (email ~* '^[^@]+@[^@]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS affiliates_email_lower_uq ON affiliates (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_google_sub_uq ON affiliates (google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_name text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS campaigns (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  category_id bigint NOT NULL REFERENCES categories (id),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL,
  description text NOT NULL,
  image_url text,
  image_alt text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  is_verified boolean NOT NULL DEFAULT false,
  is_urgent boolean NOT NULL DEFAULT false,
  is_zakat boolean NOT NULL DEFAULT false,
  is_qurban boolean NOT NULL DEFAULT false,
  is_fixed_amount boolean NOT NULL DEFAULT false,
  is_bundle boolean NOT NULL DEFAULT false,
  has_no_target boolean NOT NULL DEFAULT false,
  has_no_time_limit boolean NOT NULL DEFAULT false,
  is_carousel boolean NOT NULL DEFAULT false,
  minimum_amount bigint NOT NULL DEFAULT 10000,
  target_amount bigint,
  suggestion_amounts bigint[] NOT NULL DEFAULT ARRAY[]::bigint[],
  end_date date,
  base_commission_pct numeric(5,2) NOT NULL DEFAULT 0,
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  CHECK (minimum_amount >= 0 AND minimum_amount <= 1000000000000),
  CHECK (target_amount IS NULL OR (target_amount >= 0 AND target_amount <= 1000000000000)),
  CHECK (has_no_target = (target_amount IS NULL)),
  CHECK (has_no_time_limit = (end_date IS NULL)),
  CHECK (base_commission_pct = base_commission_pct),
  CHECK (base_commission_pct >= 0 AND base_commission_pct <= 100)
);

CREATE TABLE IF NOT EXISTS campaign_variants (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  campaign_id bigint NOT NULL REFERENCES campaigns (id),
  name text NOT NULL,
  price_rupiah bigint NOT NULL,
  names_per_qty smallint NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (price_rupiah > 0 AND price_rupiah <= 1000000000000),
  CHECK (names_per_qty >= 1)
);

CREATE TABLE IF NOT EXISTS campaign_bundles (
  seed_key text PRIMARY KEY,
  bundle_campaign_id bigint NOT NULL REFERENCES campaigns (id),
  item_campaign_id bigint NOT NULL REFERENCES campaigns (id),
  qty smallint NOT NULL,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (qty > 0),
  CHECK (bundle_campaign_id <> item_campaign_id),
  UNIQUE (bundle_campaign_id, item_campaign_id)
);

CREATE TABLE IF NOT EXISTS campaign_updates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  campaign_id bigint NOT NULL REFERENCES campaigns (id),
  title text NOT NULL,
  body text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS campaign_stats (
  campaign_id bigint PRIMARY KEY REFERENCES campaigns (id),
  collected_amount bigint NOT NULL DEFAULT 0,
  donor_count integer NOT NULL DEFAULT 0,
  CHECK (collected_amount >= 0 AND collected_amount <= 100000000000000),
  CHECK (donor_count >= 0)
);

CREATE TABLE IF NOT EXISTS campaign_qris_static (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  campaign_id bigint NOT NULL REFERENCES campaigns (id),
  status text NOT NULL DEFAULT 'DISABLED',
  qris_string text NOT NULL DEFAULT '',
  is_demo boolean NOT NULL DEFAULT true,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (status IN ('DISABLED', 'ACTIVE')),
  CHECK (NOT is_demo OR (status = 'DISABLED' AND qris_string = '')),
  CHECK (status = 'DISABLED' OR length(qris_string) = 0 OR length(qris_string) >= 20)
);

CREATE TABLE IF NOT EXISTS payment_providers (
  code text PRIMARY KEY,
  adapter_status text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  note text NOT NULL,
  CHECK (code IN ('xendit', 'midtrans', 'faspay_snap', 'faspay_legacy')),
  CHECK (adapter_status IN ('ready', 'placeholder')),
  CHECK (
    (code IN ('xendit', 'midtrans') AND adapter_status = 'ready')
    OR (code IN ('faspay_snap', 'faspay_legacy') AND adapter_status = 'placeholder')
  ),
  CHECK (NOT is_active OR adapter_status = 'ready')
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  channel_type text NOT NULL,
  legacy_alias text,
  provider_code text REFERENCES payment_providers (code),
  admin_fee_flat bigint NOT NULL DEFAULT 0,
  admin_fee_pct numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  is_redirect boolean NOT NULL DEFAULT false,
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (channel_type IN ('VIRTUAL_ACCOUNT', 'EWALLET', 'OVER_THE_COUNTER', 'QR_CODE', 'SNAP', 'MANUAL')),
  CHECK (
    (channel_type = 'MANUAL' AND provider_code IS NULL)
    OR (channel_type <> 'MANUAL' AND provider_code IS NOT NULL)
  ),
  CHECK (admin_fee_flat >= 0 AND admin_fee_flat <= 1000000000000),
  CHECK (admin_fee_pct = admin_fee_pct AND admin_fee_pct >= 0 AND admin_fee_pct <= 100),
  CHECK (is_active = false OR provider_code IS NULL OR provider_code IN ('xendit', 'midtrans'))
);

CREATE TABLE IF NOT EXISTS payment_instructions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  payment_method_id bigint NOT NULL REFERENCES payment_methods (id),
  title text NOT NULL,
  body text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS invoices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_code text NOT NULL UNIQUE,
  donor_id bigint REFERENCES donors (id) ON DELETE SET NULL,
  payment_method_id bigint NOT NULL REFERENCES payment_methods (id),
  donor_name_snapshot text NOT NULL,
  donor_email text,
  donor_phone text,
  is_anonymous boolean NOT NULL DEFAULT false,
  doa text,
  base_amount bigint NOT NULL,
  admin_fee bigint NOT NULL DEFAULT 0,
  total_amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  provider_code text REFERENCES payment_providers (code),
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  CHECK (base_amount >= 0 AND admin_fee >= 0),
  CHECK (base_amount <= 1000000000000 AND admin_fee <= 1000000000000),
  CHECK (total_amount = base_amount + admin_fee),
  CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  CHECK ((status = 'PAID') = (paid_at IS NOT NULL)),
  CHECK (provider_code IS NULL OR provider_code IN ('xendit', 'midtrans'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id bigint NOT NULL REFERENCES invoices (id),
  campaign_id bigint NOT NULL REFERENCES campaigns (id),
  variant_id bigint REFERENCES campaign_variants (id),
  bundle_campaign_id bigint REFERENCES campaigns (id),
  affiliate_id bigint REFERENCES affiliates (id),
  qty smallint NOT NULL DEFAULT 1,
  amount bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (qty > 0),
  CHECK (amount >= 0 AND amount <= 1000000000000),
  CHECK (bundle_campaign_id IS NULL OR bundle_campaign_id <> campaign_id)
);

CREATE TABLE IF NOT EXISTS transaction_qurban_names (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id bigint NOT NULL REFERENCES transactions (id),
  mudhohi_name text NOT NULL,
  CHECK (length(btrim(mudhohi_name)) > 0)
);

CREATE TABLE IF NOT EXISTS payment_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_code text NOT NULL REFERENCES payment_providers (code),
  provider_event_id text NOT NULL,
  invoice_id bigint NOT NULL REFERENCES invoices (id),
  mapped_status text NOT NULL,
  amount_rupiah bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_code, provider_event_id),
  CHECK (provider_code IN ('xendit', 'midtrans')),
  CHECK (mapped_status IN ('pending', 'paid', 'failed')),
  CHECK (amount_rupiah >= 0 AND amount_rupiah <= 1000000000000)
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  event_trigger text NOT NULL,
  channel text NOT NULL,
  subject text,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  seed_untouched boolean NOT NULL DEFAULT true,
  UNIQUE (event_trigger, channel),
  CHECK (event_trigger IN ('CHECKOUT', 'PAID')),
  CHECK (channel IN ('email', 'wa'))
);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  template_id bigint REFERENCES notification_templates (id),
  dedupe_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE TABLE IF NOT EXISTS tracking_public_ids (
  key text PRIMARY KEY,
  public_id text,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (key IN ('meta_pixel_id', 'google_ads_id', 'google_analytic_id', 'tiktok_pixel_id')),
  CHECK (public_id IS NULL OR length(public_id) > 0)
);

CREATE TABLE IF NOT EXISTS pixel_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  screen_name text NOT NULL,
  meta_event text,
  tiktok_event text,
  google_event text,
  is_active boolean NOT NULL DEFAULT false,
  seed_untouched boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS donation_blocks (
  seed_key text PRIMARY KEY,
  heading text,
  body text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE')),
  CHECK (jsonb_typeof(links) = 'array')
);

CREATE TABLE IF NOT EXISTS website_blocks (
  seed_key text PRIMARY KEY,
  heading text,
  body text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE')),
  CHECK (jsonb_typeof(links) = 'array'),
  CHECK (jsonb_typeof(items) = 'array')
);

CREATE TABLE IF NOT EXISTS web_article_categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_articles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  category_id bigint REFERENCES web_article_categories (id),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  body text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  published_at timestamptz,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_tags (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  seed_untouched boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS web_article_tags (
  article_id bigint NOT NULL REFERENCES web_articles (id),
  tag_id bigint NOT NULL REFERENCES web_tags (id),
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS web_testimonials (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  person_label text NOT NULL,
  quote text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_partners (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  name text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_care_categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_impact_categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_impact_metrics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  metric_key text NOT NULL UNIQUE,
  label text NOT NULL,
  value_amount bigint NOT NULL,
  suffix text NOT NULL DEFAULT '',
  is_demo boolean NOT NULL DEFAULT true,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_distribution_points (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  label text NOT NULL,
  latitude numeric(8,5),
  longitude numeric(8,5),
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE')),
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
);

CREATE TABLE IF NOT EXISTS web_about_content (
  id smallint PRIMARY KEY CHECK (id = 1),
  seed_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_history_timeline (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  year_label text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_mission_points (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_team_members (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  role_label text NOT NULL,
  display_name text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  sort_order smallint NOT NULL DEFAULT 0,
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_legality (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  title text NOT NULL,
  document_number text NOT NULL,
  issued_by text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_faqs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_financial_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  title text NOT NULL,
  period_label text NOT NULL,
  summary text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_fund_allocations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  campaign_id bigint REFERENCES campaigns (id),
  title text NOT NULL,
  narrative text NOT NULL,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE'))
);

CREATE TABLE IF NOT EXISTS web_bank_accounts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seed_key text NOT NULL UNIQUE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  payable boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT true,
  publication_status text NOT NULL DEFAULT 'DRAFT',
  seed_untouched boolean NOT NULL DEFAULT true,
  CHECK (publication_status IN ('DRAFT', 'ACTIVE')),
  CHECK (payable = false),
  CHECK (NOT is_demo OR account_number = '000')
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  affiliate_id bigint NOT NULL REFERENCES affiliates (id),
  campaign_id bigint NOT NULL REFERENCES campaigns (id),
  click_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_campaign_commissions (
  affiliate_id bigint NOT NULL REFERENCES affiliates (id),
  campaign_id bigint NOT NULL REFERENCES campaigns (id),
  commission_pct numeric(5,2) NOT NULL,
  PRIMARY KEY (affiliate_id, campaign_id),
  CHECK (commission_pct = commission_pct),
  CHECK (commission_pct >= 0 AND commission_pct <= 100)
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  affiliate_id bigint NOT NULL REFERENCES affiliates (id),
  idempotency_key text NOT NULL UNIQUE,
  amount_rupiah bigint NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  settlement_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (amount_rupiah > 0 AND amount_rupiah <= 1000000000000),
  CHECK (status IN ('requested', 'rejected', 'settled')),
  CHECK (status <> 'settled' OR settlement_ref IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS affiliate_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  affiliate_id bigint NOT NULL REFERENCES affiliates (id),
  idempotency_key text NOT NULL UNIQUE,
  movement text NOT NULL,
  amount_rupiah bigint NOT NULL,
  transaction_id bigint REFERENCES transactions (id),
  payout_request_id bigint REFERENCES payout_requests (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (movement IN (
    'commission_hold', 'hold_to_available', 'reverse_pending', 'reverse_available',
    'payout_reserve', 'payout_release', 'payout_settle'
  )),
  CHECK (amount_rupiah > 0 AND amount_rupiah <= 1000000000000)
);

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_ledger_one_hold
  ON affiliate_ledger (transaction_id) WHERE movement = 'commission_hold';
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_ledger_one_release
  ON affiliate_ledger (transaction_id) WHERE movement = 'hold_to_available';
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_ledger_one_reverse
  ON affiliate_ledger (transaction_id) WHERE movement IN ('reverse_pending', 'reverse_available');
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_ledger_one_reserve
  ON affiliate_ledger (payout_request_id) WHERE movement = 'payout_reserve';
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_ledger_one_payout_release
  ON affiliate_ledger (payout_request_id) WHERE movement = 'payout_release';
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_ledger_one_settle
  ON affiliate_ledger (payout_request_id) WHERE movement = 'payout_settle';


-- Indeks daftar berhalaman. Bukan partisi.
CREATE INDEX IF NOT EXISTS idx_users_active ON users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_public_list ON campaigns (publication_status, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns (category_id, publication_status, id);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status_created ON invoices (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_donor ON invoices (donor_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions (invoice_id, id);
CREATE INDEX IF NOT EXISTS idx_articles_pub ON web_articles (publication_status, published_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC, id DESC);

-- -----------------------------------------------------------------------
-- Pemicu. Dibuat hanya jika belum ada, tanpa DROP.
-- -----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_org_profile_edited') THEN
    CREATE TRIGGER trg_org_profile_edited BEFORE UPDATE ON org_profile
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_app_config_edited') THEN
    CREATE TRIGGER trg_app_config_edited BEFORE UPDATE ON app_config
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_categories_edited') THEN
    CREATE TRIGGER trg_categories_edited BEFORE UPDATE ON categories
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_campaigns_edited') THEN
    CREATE TRIGGER trg_campaigns_edited BEFORE UPDATE ON campaigns
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_variants_edited') THEN
    CREATE TRIGGER trg_variants_edited BEFORE UPDATE ON campaign_variants
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bundles_edited') THEN
    CREATE TRIGGER trg_bundles_edited BEFORE UPDATE ON campaign_bundles
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_updates_edited') THEN
    CREATE TRIGGER trg_updates_edited BEFORE UPDATE ON campaign_updates
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_qris_edited') THEN
    CREATE TRIGGER trg_qris_edited BEFORE UPDATE ON campaign_qris_static
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_methods_edited') THEN
    CREATE TRIGGER trg_methods_edited BEFORE UPDATE ON payment_methods
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_instructions_edited') THEN
    CREATE TRIGGER trg_instructions_edited BEFORE UPDATE ON payment_instructions
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_donation_blocks_edited') THEN
    CREATE TRIGGER trg_donation_blocks_edited BEFORE UPDATE ON donation_blocks
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_website_blocks_edited') THEN
    CREATE TRIGGER trg_website_blocks_edited BEFORE UPDATE ON website_blocks
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_articles_edited') THEN
    CREATE TRIGGER trg_articles_edited BEFORE UPDATE ON web_articles
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ledger_guard') THEN
    CREATE TRIGGER trg_ledger_guard BEFORE INSERT ON affiliate_ledger
      FOR EACH ROW EXECUTE FUNCTION affiliate_ledger_guard();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ledger_immutable') THEN
    CREATE TRIGGER trg_ledger_immutable BEFORE UPDATE OR DELETE ON affiliate_ledger
      FOR EACH ROW EXECUTE FUNCTION affiliate_ledger_immutable();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_invoice_self') THEN
    CREATE CONSTRAINT TRIGGER trg_invoice_self
      AFTER INSERT OR UPDATE ON invoices
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION digidonasi_invoice_self_match();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_invoice_lines') THEN
    CREATE CONSTRAINT TRIGGER trg_invoice_lines
      AFTER INSERT OR UPDATE OR DELETE ON transactions
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION digidonasi_invoice_lines_match();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_edited') THEN
    CREATE TRIGGER trg_users_edited BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated') THEN
    CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION digidonasi_set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_org_profile_updated') THEN
    CREATE TRIGGER trg_org_profile_updated BEFORE UPDATE ON org_profile
      FOR EACH ROW EXECUTE FUNCTION digidonasi_set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_donors_edited') THEN
    CREATE TRIGGER trg_donors_edited BEFORE UPDATE ON donors
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_affiliates_edited') THEN
    CREATE TRIGGER trg_affiliates_edited BEFORE UPDATE ON affiliates
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notifications_edited') THEN
    CREATE TRIGGER trg_notifications_edited BEFORE UPDATE ON notification_templates
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tracking_edited') THEN
    CREATE TRIGGER trg_tracking_edited BEFORE UPDATE ON tracking_public_ids
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pixels_edited') THEN
    CREATE TRIGGER trg_pixels_edited BEFORE UPDATE ON pixel_events
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_article_categories_edited') THEN
    CREATE TRIGGER trg_article_categories_edited BEFORE UPDATE ON web_article_categories
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tags_edited') THEN
    CREATE TRIGGER trg_tags_edited BEFORE UPDATE ON web_tags
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_testimonials_edited') THEN
    CREATE TRIGGER trg_testimonials_edited BEFORE UPDATE ON web_testimonials
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partners_edited') THEN
    CREATE TRIGGER trg_partners_edited BEFORE UPDATE ON web_partners
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_care_edited') THEN
    CREATE TRIGGER trg_care_edited BEFORE UPDATE ON web_care_categories
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_impact_cat_edited') THEN
    CREATE TRIGGER trg_impact_cat_edited BEFORE UPDATE ON web_impact_categories
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_metrics_edited') THEN
    CREATE TRIGGER trg_metrics_edited BEFORE UPDATE ON web_impact_metrics
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_points_edited') THEN
    CREATE TRIGGER trg_points_edited BEFORE UPDATE ON web_distribution_points
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_about_edited') THEN
    CREATE TRIGGER trg_about_edited BEFORE UPDATE ON web_about_content
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_timeline_edited') THEN
    CREATE TRIGGER trg_timeline_edited BEFORE UPDATE ON web_history_timeline
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_mission_edited') THEN
    CREATE TRIGGER trg_mission_edited BEFORE UPDATE ON web_mission_points
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_team_edited') THEN
    CREATE TRIGGER trg_team_edited BEFORE UPDATE ON web_team_members
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_legality_edited') THEN
    CREATE TRIGGER trg_legality_edited BEFORE UPDATE ON web_legality
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_faqs_edited') THEN
    CREATE TRIGGER trg_faqs_edited BEFORE UPDATE ON web_faqs
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reports_edited') THEN
    CREATE TRIGGER trg_reports_edited BEFORE UPDATE ON web_financial_reports
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_allocations_edited') THEN
    CREATE TRIGGER trg_allocations_edited BEFORE UPDATE ON web_fund_allocations
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_banks_edited') THEN
    CREATE TRIGGER trg_banks_edited BEFORE UPDATE ON web_bank_accounts
      FOR EACH ROW EXECUTE FUNCTION digidonasi_mark_edited();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payment_event_amount') THEN
    CREATE TRIGGER trg_payment_event_amount BEFORE INSERT ON payment_events
      FOR EACH ROW EXECUTE FUNCTION digidonasi_payment_event_amount();
  END IF;
END $$;

-- -----------------------------------------------------------------------
-- Kecocokan kolom. CREATE IF NOT EXISTS tidak cukup.
-- -----------------------------------------------------------------------
DO $$
BEGIN
  PERFORM digidonasi_require_column('campaigns', 'is_zakat', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'is_qurban', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'is_bundle', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'is_fixed_amount', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'has_no_target', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'has_no_time_limit', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'is_urgent', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'is_carousel', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'is_verified', 'bool');
  PERFORM digidonasi_require_column('campaigns', 'base_commission_pct', 'numeric');
  PERFORM digidonasi_require_column('invoices', 'invoice_code', 'text');
  PERFORM digidonasi_require_column('invoices', 'base_amount', 'int8');
  PERFORM digidonasi_require_column('affiliate_ledger', 'idempotency_key', 'text');
  PERFORM digidonasi_require_column('payment_providers', 'adapter_status', 'text');
  PERFORM digidonasi_require_column('donation_blocks', 'seed_key', 'text');
  PERFORM digidonasi_require_column('website_blocks', 'items', 'jsonb');
  PERFORM digidonasi_require_column('users', 'role', 'text');
  PERFORM digidonasi_require_column('users', 'is_active', 'bool');
  PERFORM digidonasi_require_column('users', 'google_sub', 'text');
  PERFORM digidonasi_require_column('org_profile', 'is_seed_default', 'bool');
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    RAISE EXCEPTION 'users sudah memetakan admin panel; admin_users tidak boleh dibuat';
  END IF;
  IF to_regclass('public.saved_segments') IS NOT NULL
     OR to_regclass('public.blast_batches') IS NOT NULL
     OR to_regclass('public.payroll_runs') IS NOT NULL
     OR to_regclass('public.employees') IS NOT NULL THEN
    RAISE EXCEPTION 'sisa CRM, payroll, atau HRD tidak kompatibel';
  END IF;
  PERFORM digidonasi_require_column('web_impact_metrics', 'is_demo', 'bool');
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'password_hash'
  ) THEN
    RAISE EXCEPTION 'password_hash bukan bagian digidonasi';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'website_enabled'
  ) THEN
    RAISE EXCEPTION 'website_enabled tidak boleh menjadi kolom';
  END IF;
END $$;

INSERT INTO digidonasi_schema (id, revision, note)
VALUES (
  1,
  1,
  'Draf v2. Website diatur env WEBSITE_ENABLED, bukan basis. Tidak ada impor Darul Hikam.'
)
ON CONFLICT (id) DO NOTHING;

