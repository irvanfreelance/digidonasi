CREATE SEQUENCE IF NOT EXISTS transaction_qurban_names_id_seq;
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS ngo_configs_id_seq1;
--> statement-breakpoint
CREATE TABLE "ngo_configs" (
    "id" int8 NOT NULL DEFAULT nextval('ngo_configs_id_seq1'::regclass),
    "ngo_name" varchar(150) NOT NULL,
    "logo_url" varchar(255),
    "short_description" text,
    "address" text,
    "legal_info" text,
    "primary_color" varchar(20) DEFAULT '#1086b1'::character varying,
    "whatsapp_number" varchar(20),
    "instagram_url" varchar(255),
    "facebook_url" varchar(255),
    "favicon_url" varchar(255),
    "meta_pixel_id" varchar(50),
    "meta_capi_token" text,
    "google_ads_id" varchar(50),
    "google_developer_token" varchar(255),
    "google_analytic_id" varchar(50),
    "tiktok_pixel_id" varchar(50),
    "tiktok_events_api_token" text,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS pixel_events_id_seq;
--> statement-breakpoint
CREATE TABLE "pixel_events" (
    "id" int4 NOT NULL DEFAULT nextval('pixel_events_id_seq'::regclass),
    "screen_name" varchar(100) NOT NULL,
    "meta_event" varchar(100),
    "tiktok_event" varchar(100),
    "google_event" varchar(100),
    "is_active" bool DEFAULT true,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS payment_logs_id_seq1;
--> statement-breakpoint
CREATE TABLE "payment_logs" (
    "id" int8 NOT NULL DEFAULT nextval('payment_logs_id_seq1'::regclass),
    "invoice_code" varchar(50) NOT NULL,
    "endpoint" varchar(255),
    "type" varchar(50),
    "request_payload" text,
    "response_payload" text,
    "http_status" int4,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS ads_conversion_logs_id_seq1;
--> statement-breakpoint
CREATE TABLE "ads_conversion_logs" (
    "id" int8 NOT NULL DEFAULT nextval('ads_conversion_logs_id_seq1'::regclass),
    "invoice_code" varchar(50) NOT NULL,
    "platform" varchar(50) NOT NULL,
    "event_name" varchar(100) NOT NULL,
    "request_payload" text,
    "response_payload" text,
    "http_status" int4,
    "status" varchar(20),
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS categories_id_seq1;
--> statement-breakpoint
CREATE TABLE "categories" (
    "id" int8 NOT NULL DEFAULT nextval('categories_id_seq1'::regclass),
    "name" varchar(100) NOT NULL,
    "color_theme" varchar(50),
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS campaigns_id_seq1;
--> statement-breakpoint
CREATE TABLE "campaigns" (
    "id" int8 NOT NULL DEFAULT nextval('campaigns_id_seq1'::regclass),
    "category_id" int8 NOT NULL,
    "title" varchar(255) NOT NULL,
    "slug" varchar(255) NOT NULL,
    "image_url" varchar(255),
    "description" text,
    "is_verified" bool DEFAULT true,
    "is_urgent" bool DEFAULT false,
    "minimum_amount" int8 DEFAULT 10000,
    "suggestion_amounts" _int8 DEFAULT ARRAY[10000, 25000, 50000, 100000, 200000, 500000],
    "is_zakat" bool DEFAULT false,
    "is_qurban" bool DEFAULT false,
    "is_fixed_amount" bool DEFAULT false,
    "is_bundle" bool DEFAULT false,
    "has_no_target" bool DEFAULT false,
    "has_no_time_limit" bool DEFAULT false,
    "sort" int4 DEFAULT 0,
    "target_amount" int8,
    "end_date" timestamptz,
    "base_commission_pct" numeric(5,2) DEFAULT 0.00,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "is_carousel" bool DEFAULT false,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS transactions_id_seq1;
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS invoices_id_seq1;
--> statement-breakpoint
CREATE TABLE "invoices" (
    "id" int8 NOT NULL DEFAULT nextval('invoices_id_seq1'::regclass),
    "invoice_code" varchar(50) NOT NULL,
    "donor_id" int8,
    "payment_method_id" int8 NOT NULL,
    "donor_name_snapshot" varchar(150) NOT NULL,
    "donor_email" varchar(150),
    "donor_phone" varchar(20),
    "is_anonymous" bool DEFAULT false,
    "base_amount" int8 NOT NULL,
    "admin_fee" int8 DEFAULT 0,
    "total_amount" int8 NOT NULL,
    "unique_code" int4 DEFAULT 0,
    "fb_click_id" varchar(255),
    "fb_browser_id" varchar(255),
    "tiktok_click_id" varchar(255),
    "google_click_id" varchar(255),
    "client_ip_address" varchar(45),
    "client_user_agent" text,
    "status" varchar(20) DEFAULT 'PENDING'::character varying,
    "va_number" varchar(50),
    "payment_url" text,
    "qris_dynamic" text,
    "xendit_payment_request_id" varchar(255),
    "doa" text,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" timestamptz,
    "is_wa_checkout_sent" bool DEFAULT false,
    "is_wa_paid_sent" bool DEFAULT false,
    "is_email_checkout_sent" bool DEFAULT false,
    "is_email_paid_sent" bool DEFAULT false,
    "is_ads_sent" bool DEFAULT false,
    "proof_transfer" text,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS campaign_variants_id_seq1;
--> statement-breakpoint
CREATE TABLE "campaign_variants" (
    "id" int8 NOT NULL DEFAULT nextval('campaign_variants_id_seq1'::regclass),
    "campaign_id" int8 NOT NULL,
    "name" varchar(150) NOT NULL,
    "price" int8 NOT NULL,
    "names_per_qty" int2 DEFAULT 1,
    "stock_limit" int4,
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS affiliates_id_seq1;
--> statement-breakpoint
CREATE TABLE "affiliates" (
    "id" int8 NOT NULL DEFAULT nextval('affiliates_id_seq1'::regclass),
    "affiliate_code" varchar(20) NOT NULL,
    "name" varchar(100) NOT NULL,
    "email" varchar(150) NOT NULL,
    "phone" varchar(20),
    "balance" int8 DEFAULT 0,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS donors_id_seq1;
--> statement-breakpoint
CREATE TABLE "donors" (
    "id" int8 NOT NULL DEFAULT nextval('donors_id_seq1'::regclass),
    "name" varchar(150) NOT NULL,
    "email" varchar(150),
    "phone" varchar(20),
    "is_anonymous_default" bool DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS payment_methods_id_seq1;
--> statement-breakpoint
CREATE TABLE "payment_methods" (
    "id" int8 NOT NULL DEFAULT nextval('payment_methods_id_seq1'::regclass),
    "code" varchar(50) NOT NULL,
    "name" varchar(100) NOT NULL,
    "logo_url" varchar(255),
    "type" varchar(50) NOT NULL,
    "provider" varchar(50) NOT NULL,
    "admin_fee_flat" int8 DEFAULT 0,
    "admin_fee_pct" numeric(5,2) DEFAULT 0.00,
    "is_active" bool DEFAULT true,
    "is_redirect" bool DEFAULT false,
    "sort_order" int4 DEFAULT 0,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS campaign_qris_static_id_seq1;
--> statement-breakpoint
CREATE TABLE "campaign_qris_static" (
    "id" int8 NOT NULL DEFAULT nextval('campaign_qris_static_id_seq1'::regclass),
    "campaign_id" int8 NOT NULL,
    "external_id" varchar(100) NOT NULL,
    "qris_string" text NOT NULL,
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE TABLE "campaign_bundles" (
    "bundle_campaign_id" int8 NOT NULL,
    "item_campaign_id" int8 NOT NULL,
    "qty" int2 DEFAULT 1,
    PRIMARY KEY ("bundle_campaign_id","item_campaign_id")
);
--> statement-breakpoint
CREATE TABLE "campaign_stats" (
    "campaign_id" int8 NOT NULL,
    "collected_amount" int8 DEFAULT 0,
    "donor_count" int4 DEFAULT 0,
    "package_sold" int4 DEFAULT 0,
    "views_count" int8 DEFAULT 0,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("campaign_id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS campaign_updates_id_seq1;
--> statement-breakpoint
CREATE TABLE "campaign_updates" (
    "id" int8 NOT NULL DEFAULT nextval('campaign_updates_id_seq1'::regclass),
    "campaign_id" int8 NOT NULL,
    "title" varchar(255) NOT NULL,
    "excerpt" text,
    "content" text,
    "image_url" varchar(255),
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_commissions" (
    "affiliate_id" int8 NOT NULL,
    "campaign_id" int8 NOT NULL,
    "commission_type" varchar(20) DEFAULT 'PERCENTAGE'::character varying,
    "commission_value" numeric(10,2) NOT NULL,
    PRIMARY KEY ("affiliate_id","campaign_id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_campaign_stats" (
    "affiliate_id" int8 NOT NULL,
    "campaign_id" int8 NOT NULL,
    "click_count" int4 DEFAULT 0,
    "converted_donors" int4 DEFAULT 0,
    "raised_amount" int8 DEFAULT 0,
    "commission_earned" int8 DEFAULT 0,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("affiliate_id","campaign_id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS withdrawals_id_seq1;
--> statement-breakpoint
CREATE TABLE "withdrawals" (
    "id" int8 NOT NULL DEFAULT nextval('withdrawals_id_seq1'::regclass),
    "affiliate_id" int8 NOT NULL,
    "amount" int8 NOT NULL,
    "bank_account_info" varchar(255) NOT NULL,
    "status" varchar(20) DEFAULT 'PENDING'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "processed_at" timestamptz,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS payment_instructions_id_seq1;
--> statement-breakpoint
CREATE TABLE "payment_instructions" (
    "id" int8 NOT NULL DEFAULT nextval('payment_instructions_id_seq1'::regclass),
    "payment_method_id" int8 NOT NULL,
    "title" varchar(255) NOT NULL,
    "content" text NOT NULL,
    "sort_order" int4 DEFAULT 0,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
    "id" int8 NOT NULL DEFAULT nextval('transactions_id_seq1'::regclass),
    "invoice_id" int8 NOT NULL,
    "invoice_created_at" timestamptz NOT NULL,
    "campaign_id" int8 NOT NULL,
    "bundle_campaign_id" int8,
    "variant_id" int8,
    "affiliate_id" int8,
    "qty" int2 DEFAULT 1,
    "amount" int8 NOT NULL,
    "affiliate_commission" int8 DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS transaction_qurban_names_id_seq1;
--> statement-breakpoint
CREATE TABLE "transaction_qurban_names" (
    "id" int8 NOT NULL DEFAULT nextval('transaction_qurban_names_id_seq1'::regclass),
    "transaction_id" int8 NOT NULL,
    "transaction_created_at" timestamptz NOT NULL,
    "mudhohi_name" varchar(150) NOT NULL,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS notification_templates_id_seq1;
--> statement-breakpoint
CREATE TABLE "notification_templates" (
    "id" int8 NOT NULL DEFAULT nextval('notification_templates_id_seq1'::regclass),
    "event_trigger" varchar(50) NOT NULL,
    "channel" varchar(20) NOT NULL,
    "message_content" text NOT NULL,
    "is_active" bool DEFAULT true,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS notification_logs_id_seq1;
--> statement-breakpoint
CREATE TABLE "notification_logs" (
    "id" int8 NOT NULL DEFAULT nextval('notification_logs_id_seq1'::regclass),
    "template_id" int8,
    "invoice_code" varchar(50),
    "recipient" varchar(150) NOT NULL,
    "channel" varchar(20) NOT NULL,
    "request_payload" text,
    "response_payload" text,
    "status" varchar(20),
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_articles_id_seq;
--> statement-breakpoint
CREATE TABLE "web_articles" (
    "id" int8 NOT NULL DEFAULT nextval('web_articles_id_seq'::regclass),
    "slug" varchar(220) NOT NULL,
    "title" varchar(70) NOT NULL,
    "title_long" varchar(300),
    "excerpt" varchar(160) NOT NULL,
    "body" text NOT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'draft'::character varying CHECK ((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])),
    "featured_image_url" text,
    "featured_image_alt" varchar(300),
    "featured_image_caption" varchar(500),
    "featured_image_width" int2,
    "featured_image_height" int2,
    "seo_title" varchar(70),
    "seo_description" varchar(160),
    "og_image_url" text,
    "og_image_alt" varchar(300),
    "canonical_url" text,
    "robots_directive" varchar(30) NOT NULL DEFAULT 'index,follow'::character varying CHECK ((robots_directive)::text = ANY ((ARRAY['index,follow'::character varying, 'noindex,follow'::character varying, 'index,nofollow'::character varying, 'noindex,nofollow'::character varying])::text[])),
    "schema_org_json" jsonb,
    "twitter_title" varchar(70),
    "twitter_description" varchar(200),
    "twitter_card_type" varchar(25) NOT NULL DEFAULT 'summary_large_image'::character varying CHECK ((twitter_card_type)::text = ANY ((ARRAY['summary'::character varying, 'summary_large_image'::character varying])::text[])),
    "locale" varchar(10) NOT NULL DEFAULT 'id'::character varying,
    "program_id" int8,
    "author_id" int8 NOT NULL,
    "published_at" timestamptz,
    "is_featured" bool NOT NULL DEFAULT false,
    "view_count" int4 NOT NULL DEFAULT 0,
    "read_time_min" int2,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "deleted_at" timestamptz,
    "category_id" int8,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS admins_id_seq1;
--> statement-breakpoint
CREATE TABLE "admins" (
    "id" int8 NOT NULL DEFAULT nextval('admins_id_seq1'::regclass),
    "name" varchar(100) NOT NULL,
    "email" varchar(150) NOT NULL,
    "role" varchar(50) NOT NULL DEFAULT 'SUPERADMIN' CHECK ("role" IN ('SUPERADMIN','WEBSITE_EDITOR')),
    "status" varchar(20) DEFAULT 'ACTIVE'::character varying,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE TABLE "web_article_tags" (
    "article_id" int8 NOT NULL,
    "tag_id" int8 NOT NULL,
    PRIMARY KEY ("article_id","tag_id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_tags_id_seq;
--> statement-breakpoint
CREATE TABLE "web_tags" (
    "id" int8 NOT NULL DEFAULT nextval('web_tags_id_seq'::regclass),
    "name" varchar(80) NOT NULL,
    "slug" varchar(80) NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_testimonials_id_seq;
--> statement-breakpoint
CREATE TABLE "web_testimonials" (
    "id" int8 NOT NULL DEFAULT nextval('web_testimonials_id_seq'::regclass),
    "person_name" varchar(150) NOT NULL,
    "person_role" varchar(150) NOT NULL,
    "person_type" varchar(20) NOT NULL CHECK ((person_type)::text = ANY ((ARRAY['muzakki'::character varying, 'mustahiq'::character varying])::text[])),
    "initials" bpchar(3) NOT NULL,
    "quote" text NOT NULL,
    "avatar_url" text,
    "program_id" int8,
    "is_active" bool NOT NULL DEFAULT true,
    "display_order" int2 NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_impact_metrics_id_seq;
--> statement-breakpoint
CREATE TABLE "web_impact_metrics" (
    "id" int8 NOT NULL DEFAULT nextval('web_impact_metrics_id_seq'::regclass),
    "metric_key" varchar(60) NOT NULL,
    "label" varchar(150) NOT NULL,
    "value" numeric(15,2) NOT NULL DEFAULT 0,
    "suffix" varchar(20),
    "display_order" int2 NOT NULL DEFAULT 0,
    "is_active" bool NOT NULL DEFAULT true,
    "updated_by" int8,
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_financial_reports_id_seq;
--> statement-breakpoint
CREATE TABLE "web_financial_reports" (
    "id" int8 NOT NULL DEFAULT nextval('web_financial_reports_id_seq'::regclass),
    "title" varchar(250) NOT NULL,
    "report_type" varchar(30) NOT NULL CHECK ((report_type)::text = ANY ((ARRAY['annual'::character varying, 'quarterly'::character varying, 'monthly'::character varying, 'special_audit'::character varying])::text[])),
    "period_label" varchar(50) NOT NULL,
    "period_year" int2 NOT NULL,
    "period_quarter" int2 CHECK (period_quarter = ANY (ARRAY[1, 2, 3, 4])),
    "audit_status" varchar(40) NOT NULL DEFAULT 'unaudited'::character varying CHECK ((audit_status)::text = ANY ((ARRAY['unaudited'::character varying, 'internally_reviewed'::character varying, 'kap_audited'::character varying])::text[])),
    "file_url" text NOT NULL,
    "file_size_kb" int4,
    "download_count" int4 NOT NULL DEFAULT 0,
    "is_published" bool NOT NULL DEFAULT false,
    "uploaded_by" int8 NOT NULL,
    "published_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_faqs_id_seq;
--> statement-breakpoint
CREATE TABLE "web_faqs" (
    "id" int8 NOT NULL DEFAULT nextval('web_faqs_id_seq'::regclass),
    "question" text NOT NULL,
    "answer" text NOT NULL,
    "category" varchar(60) DEFAULT 'general'::character varying CHECK ((category)::text = ANY ((ARRAY['general'::character varying, 'donation'::character varying, 'zakat'::character varying, 'program'::character varying, 'partnership'::character varying, 'technical'::character varying])::text[])),
    "is_active" bool NOT NULL DEFAULT true,
    "display_order" int2 NOT NULL DEFAULT 0,
    "created_by" int8,
    "updated_by" int8,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_fund_allocations_id_seq;
--> statement-breakpoint
CREATE TABLE "web_fund_allocations" (
    "id" int8 NOT NULL DEFAULT nextval('web_fund_allocations_id_seq'::regclass),
    "program_id" int8 NOT NULL,
    "period_year" int2 NOT NULL,
    "period_month" int2 NOT NULL CHECK ((period_month >= 1) AND (period_month <= 12)),
    "allocated_amount" numeric(15,2) NOT NULL CHECK (allocated_amount >= (0)::numeric),
    "disbursed_amount" numeric(15,2) NOT NULL DEFAULT 0 CHECK (disbursed_amount >= (0)::numeric),
    "beneficiary_count" int4 NOT NULL DEFAULT 0,
    "notes" text,
    "created_by" int8,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_cms_audit_log_id_seq;
--> statement-breakpoint
CREATE TABLE "web_cms_audit_log" (
    "id" int8 NOT NULL DEFAULT nextval('web_cms_audit_log_id_seq'::regclass),
    "user_id" int8 NOT NULL,
    "action" varchar(30) NOT NULL CHECK ((action)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'publish'::character varying, 'unpublish'::character varying, 'verify_donation'::character varying])::text[])),
    "entity_type" varchar(60) NOT NULL,
    "entity_id" int8 NOT NULL,
    "diff_json" jsonb,
    "ip_address" varchar(45),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_partners_id_seq;
--> statement-breakpoint
CREATE TABLE "web_partners" (
    "id" int8 NOT NULL DEFAULT nextval('web_partners_id_seq'::regclass),
    "name" varchar(200) NOT NULL,
    "logo_url" text,
    "website_url" text,
    "partner_type" varchar(50) CHECK ((partner_type)::text = ANY ((ARRAY['corporate'::character varying, 'government'::character varying, 'ngo'::character varying, 'academic'::character varying, 'media'::character varying, 'other'::character varying])::text[])),
    "is_active" bool NOT NULL DEFAULT true,
    "display_order" int2 NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_team_members_id_seq;
--> statement-breakpoint
CREATE TABLE "web_team_members" (
    "id" int8 NOT NULL DEFAULT nextval('web_team_members_id_seq'::regclass),
    "name" varchar(150) NOT NULL,
    "title" varchar(200) NOT NULL,
    "department" varchar(100),
    "initials" bpchar(3) NOT NULL,
    "avatar_url" text,
    "bio" text,
    "accent_color" varchar(10) DEFAULT '#3268C3'::character varying,
    "is_active" bool NOT NULL DEFAULT true,
    "display_order" int2 NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_bank_accounts_id_seq;
--> statement-breakpoint
CREATE TABLE "web_bank_accounts" (
    "id" int8 NOT NULL DEFAULT nextval('web_bank_accounts_id_seq'::regclass),
    "bank_name" varchar(100) NOT NULL,
    "account_number" varchar(50) NOT NULL,
    "account_name" varchar(150) NOT NULL,
    "bank_code" varchar(20),
    "logo_url" text,
    "is_active" bool NOT NULL DEFAULT true,
    "display_order" int2 NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE SEQUENCE IF NOT EXISTS web_article_categories_id_seq;
--> statement-breakpoint
CREATE TABLE "web_article_categories" (
    "id" int8 NOT NULL DEFAULT nextval('web_article_categories_id_seq'::regclass),
    "name" varchar(100) NOT NULL,
    "slug" varchar(120) NOT NULL,
    "description" text,
    "is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX pixel_events_screen_name_key ON pixel_events USING btree (screen_name);
--> statement-breakpoint
CREATE INDEX idx_payment_logs_invoice ON payment_logs USING btree (invoice_code);
--> statement-breakpoint
CREATE INDEX idx_ads_conversion_logs_invoice ON ads_conversion_logs USING btree (invoice_code);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;
--> statement-breakpoint
CREATE UNIQUE INDEX campaigns_slug_key ON campaigns USING btree (slug);
--> statement-breakpoint
CREATE INDEX idx_campaigns_category ON campaigns USING btree (category_id);
--> statement-breakpoint
CREATE INDEX idx_campaigns_status_created ON campaigns USING btree (status, created_at DESC);
--> statement-breakpoint
CREATE INDEX idx_campaigns_urgent ON campaigns USING btree (is_urgent) WHERE (is_urgent = true);
--> statement-breakpoint
ALTER TABLE "invoices" ADD FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "invoices" ADD FOREIGN KEY ("donor_id") REFERENCES "donors"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX invoices_invoice_code_key ON invoices USING btree (invoice_code);
--> statement-breakpoint
CREATE INDEX idx_invoices_created_at ON invoices USING btree (created_at);
--> statement-breakpoint
CREATE INDEX idx_invoices_status ON invoices USING btree (status);
--> statement-breakpoint
CREATE INDEX idx_invoices_donor ON invoices USING btree (donor_id);
--> statement-breakpoint
ALTER TABLE "campaign_variants" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX idx_campaign_variants_campaign ON campaign_variants USING btree (campaign_id);
--> statement-breakpoint
CREATE UNIQUE INDEX affiliates_affiliate_code_key ON affiliates USING btree (affiliate_code);
--> statement-breakpoint
CREATE UNIQUE INDEX affiliates_email_key ON affiliates USING btree (email);
--> statement-breakpoint
CREATE INDEX idx_donors_email ON donors USING btree (email);
--> statement-breakpoint
ALTER TABLE "campaign_qris_static" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX campaign_qris_static_external_id_key ON campaign_qris_static USING btree (external_id);
--> statement-breakpoint
CREATE INDEX idx_campaign_qris_campaign ON campaign_qris_static USING btree (campaign_id);
--> statement-breakpoint
ALTER TABLE "campaign_bundles" ADD FOREIGN KEY ("bundle_campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "campaign_bundles" ADD FOREIGN KEY ("item_campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX idx_campaign_bundles_bundle ON campaign_bundles USING btree (bundle_campaign_id);
--> statement-breakpoint
ALTER TABLE "campaign_stats" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "campaign_updates" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX idx_campaign_updates_campaign ON campaign_updates USING btree (campaign_id, created_at DESC);
--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "affiliate_campaign_stats" ADD FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "affiliate_campaign_stats" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "withdrawals" ADD FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id");
--> statement-breakpoint
CREATE INDEX idx_withdrawals_affiliate ON withdrawals USING btree (affiliate_id);
--> statement-breakpoint
ALTER TABLE "payment_instructions" ADD FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "transactions" ADD FOREIGN KEY ("bundle_campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "transactions" ADD FOREIGN KEY ("variant_id") REFERENCES "campaign_variants"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "transactions" ADD FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX idx_transactions_campaign ON transactions USING btree (campaign_id);
--> statement-breakpoint
CREATE INDEX idx_transactions_created_at ON transactions USING btree (created_at);
--> statement-breakpoint
CREATE INDEX idx_transactions_invoice ON transactions USING btree (invoice_id);
--> statement-breakpoint
CREATE INDEX idx_transactions_affiliate ON transactions USING btree (affiliate_id);
--> statement-breakpoint
ALTER TABLE "transaction_qurban_names" ADD FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX idx_transaction_qurban_trx ON transaction_qurban_names USING btree (transaction_id);
--> statement-breakpoint
CREATE UNIQUE INDEX notification_templates_event_trigger_key ON notification_templates USING btree (event_trigger);
--> statement-breakpoint
ALTER TABLE "notification_logs" ADD FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX idx_notification_logs_template ON notification_logs USING btree (template_id);
--> statement-breakpoint
CREATE INDEX idx_notification_logs_invoice ON notification_logs USING btree (invoice_code);
--> statement-breakpoint
ALTER TABLE "web_articles" ADD FOREIGN KEY ("author_id") REFERENCES "admins"("id");
--> statement-breakpoint
ALTER TABLE "web_articles" ADD FOREIGN KEY ("program_id") REFERENCES "campaigns"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "web_articles" ADD FOREIGN KEY ("category_id") REFERENCES "web_article_categories"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX web_articles_slug_key ON web_articles USING btree (slug);
--> statement-breakpoint
CREATE INDEX idx_art_status ON web_articles USING btree (status);
--> statement-breakpoint
CREATE INDEX idx_art_published_at ON web_articles USING btree (published_at DESC);
--> statement-breakpoint
CREATE INDEX idx_art_program_id ON web_articles USING btree (program_id);
--> statement-breakpoint
CREATE INDEX idx_art_slug ON web_articles USING btree (slug);
--> statement-breakpoint
CREATE INDEX idx_art_deleted ON web_articles USING btree (deleted_at) WHERE (deleted_at IS NULL);
--> statement-breakpoint
CREATE INDEX idx_art_featured ON web_articles USING btree (published_at DESC) WHERE ((is_featured = true) AND ((status)::text = 'published'::text));
--> statement-breakpoint
CREATE INDEX idx_art_noindex ON web_articles USING btree (id) WHERE ((robots_directive)::text ~~ 'noindex%'::text);
--> statement-breakpoint
CREATE INDEX idx_art_fts ON web_articles USING gin (to_tsvector('indonesian'::regconfig, (((title)::text || ' '::text) || (COALESCE(excerpt, ''::character varying))::text)));
--> statement-breakpoint
CREATE UNIQUE INDEX admins_email_key ON admins USING btree (email);
--> statement-breakpoint
ALTER TABLE "web_article_tags" ADD FOREIGN KEY ("article_id") REFERENCES "web_articles"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "web_article_tags" ADD FOREIGN KEY ("tag_id") REFERENCES "web_tags"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX idx_article_tags_tag_id ON web_article_tags USING btree (tag_id);
--> statement-breakpoint
CREATE UNIQUE INDEX web_tags_name_key ON web_tags USING btree (name);
--> statement-breakpoint
CREATE UNIQUE INDEX web_tags_slug_key ON web_tags USING btree (slug);
--> statement-breakpoint
CREATE INDEX idx_tags_slug ON web_tags USING btree (slug);
--> statement-breakpoint
ALTER TABLE "web_testimonials" ADD FOREIGN KEY ("program_id") REFERENCES "campaigns"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX idx_testimonials_type ON web_testimonials USING btree (person_type);
--> statement-breakpoint
CREATE INDEX idx_testimonials_is_active ON web_testimonials USING btree (is_active) WHERE (is_active = true);
--> statement-breakpoint
CREATE INDEX idx_testimonials_display_order ON web_testimonials USING btree (display_order);
--> statement-breakpoint
ALTER TABLE "web_impact_metrics" ADD FOREIGN KEY ("updated_by") REFERENCES "admins"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX idx_impact_metrics_order ON web_impact_metrics USING btree (display_order);
--> statement-breakpoint
CREATE UNIQUE INDEX web_impact_metrics_metric_key_key ON web_impact_metrics USING btree (metric_key);
--> statement-breakpoint
CREATE INDEX idx_impact_metrics_active ON web_impact_metrics USING btree (is_active) WHERE (is_active = true);
--> statement-breakpoint
ALTER TABLE "web_financial_reports" ADD FOREIGN KEY ("uploaded_by") REFERENCES "admins"("id");
--> statement-breakpoint
CREATE INDEX idx_reports_year ON web_financial_reports USING btree (period_year DESC);
--> statement-breakpoint
CREATE INDEX idx_reports_type ON web_financial_reports USING btree (report_type);
--> statement-breakpoint
CREATE INDEX idx_reports_is_published ON web_financial_reports USING btree (is_published) WHERE (is_published = true);
--> statement-breakpoint
ALTER TABLE "web_faqs" ADD FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "web_faqs" ADD FOREIGN KEY ("updated_by") REFERENCES "admins"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX idx_faqs_active ON web_faqs USING btree (is_active) WHERE (is_active = true);
--> statement-breakpoint
CREATE INDEX idx_faqs_category ON web_faqs USING btree (category);
--> statement-breakpoint
CREATE INDEX idx_faqs_order ON web_faqs USING btree (display_order);
--> statement-breakpoint
ALTER TABLE "web_fund_allocations" ADD FOREIGN KEY ("program_id") REFERENCES "campaigns"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "web_fund_allocations" ADD FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX web_fund_allocations_program_id_period_year_period_month_key ON web_fund_allocations USING btree (program_id, period_year, period_month);
--> statement-breakpoint
CREATE INDEX idx_alloc_program_id ON web_fund_allocations USING btree (program_id);
--> statement-breakpoint
CREATE INDEX idx_alloc_period ON web_fund_allocations USING btree (period_year DESC, period_month DESC);
--> statement-breakpoint
ALTER TABLE "web_cms_audit_log" ADD FOREIGN KEY ("user_id") REFERENCES "admins"("id") ON DELETE CASCADE;
--> statement-breakpoint
CREATE INDEX idx_audit_user_id ON web_cms_audit_log USING btree (user_id);
--> statement-breakpoint
CREATE INDEX idx_audit_entity ON web_cms_audit_log USING btree (entity_type, entity_id);
--> statement-breakpoint
CREATE INDEX idx_audit_created_at ON web_cms_audit_log USING btree (created_at DESC);
--> statement-breakpoint
CREATE INDEX idx_audit_recent ON web_cms_audit_log USING btree (created_at DESC);
--> statement-breakpoint
CREATE INDEX idx_partners_active ON web_partners USING btree (is_active) WHERE (is_active = true);
--> statement-breakpoint
CREATE INDEX idx_partners_order ON web_partners USING btree (display_order);
--> statement-breakpoint
CREATE INDEX idx_team_active ON web_team_members USING btree (is_active) WHERE (is_active = true);
--> statement-breakpoint
CREATE INDEX idx_team_order ON web_team_members USING btree (display_order);
--> statement-breakpoint
CREATE INDEX idx_bank_accounts_active ON web_bank_accounts USING btree (is_active) WHERE (is_active = true);
--> statement-breakpoint
CREATE UNIQUE INDEX web_article_categories_slug_key ON web_article_categories USING btree (slug);
--> statement-breakpoint
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_url text, ADD COLUMN IF NOT EXISTS icon_name varchar(50), ADD COLUMN IF NOT EXISTS display_order int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE ngo_configs ADD COLUMN IF NOT EXISTS email varchar(150), ADD COLUMN IF NOT EXISTS office_hours varchar(255), ADD COLUMN IF NOT EXISTS jejak_kebaikan_title varchar(150) DEFAULT 'Jejak Kebaikan', ADD COLUMN IF NOT EXISTS jejak_kebaikan_subtitle varchar(150);
--> statement-breakpoint
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS subject varchar(255);
--> statement-breakpoint
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sort int DEFAULT 0;
--> statement-breakpoint
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS sort int DEFAULT 0;
--> statement-breakpoint
ALTER TABLE web_articles ALTER COLUMN title TYPE varchar(255), ALTER COLUMN title_long TYPE varchar(255), ALTER COLUMN excerpt TYPE varchar(500), ALTER COLUMN seo_title TYPE varchar(255), ALTER COLUMN seo_description TYPE varchar(500);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_key ON admins (lower(email));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_icon_library (id bigserial PRIMARY KEY, url text NOT NULL, label varchar(100), created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_impact_categories (id bigserial PRIMARY KEY, icon_url text, label varchar(100) NOT NULL, value numeric(15,2) NOT NULL DEFAULT 0, suffix varchar(20) DEFAULT '', display_order smallint NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_impact_categories_order ON web_impact_categories (display_order);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_care_categories (id bigserial PRIMARY KEY, icon_name varchar(50) NOT NULL DEFAULT 'Heart', icon_url text, label varchar(100) NOT NULL, quote_text text, quote_source varchar(150), description text, photo_url text, is_active boolean NOT NULL DEFAULT true, display_order smallint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_about_content (id bigserial PRIMARY KEY, hero_title varchar(255), hero_subtitle text, sejarah_heading varchar(255), sejarah_paragraph_1 text, sejarah_paragraph_2 text, visi_text text, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_history_timeline (id bigserial PRIMARY KEY, year varchar(10) NOT NULL, description text NOT NULL, display_order int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_mission_points (id bigserial PRIMARY KEY, content text NOT NULL, display_order int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT CURRENT_TIMESTAMP, updated_at timestamptz DEFAULT CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_legality (id bigserial PRIMARY KEY, title varchar(255) NOT NULL, document_number varchar(150), issued_by varchar(255), issued_date date, file_url text, is_active boolean NOT NULL DEFAULT true, display_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS web_distribution_points (id bigserial PRIMARY KEY, name varchar(150) NOT NULL, type varchar(20) NOT NULL DEFAULT 'province', latitude numeric(10,6) NOT NULL, longitude numeric(10,6) NOT NULL, description text, display_order smallint NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, updated_by bigint REFERENCES admins(id) ON DELETE SET NULL, updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_distribution_points_order ON web_distribution_points (display_order);
--> statement-breakpoint
CREATE OR REPLACE VIEW v_published_articles AS SELECT a.id, a.slug, a.title, a.title_long, a.excerpt, c.name AS category_name, a.category_id, a.read_time_min, a.featured_image_url, a.featured_image_alt, a.featured_image_caption, a.featured_image_width, a.featured_image_height, a.published_at, u.name AS author_name, NULL::text AS author_avatar_url FROM web_articles a JOIN admins u ON a.author_id = u.id LEFT JOIN web_article_categories c ON a.category_id = c.id WHERE a.status = 'published' AND a.deleted_at IS NULL;
--> statement-breakpoint
CREATE OR REPLACE VIEW v_article_seo AS SELECT id, slug, COALESCE(seo_title, title) AS meta_title, COALESCE(seo_description, excerpt) AS meta_description, COALESCE(og_image_url, featured_image_url) AS og_image, COALESCE(og_image_alt, featured_image_alt) AS og_image_alt, canonical_url, robots_directive, locale, schema_org_json, published_at, updated_at, featured_image_url IS NULL AS flag_missing_og_image, featured_image_alt IS NULL OR featured_image_alt = '' AS flag_missing_alt_text, length(COALESCE(seo_title, title)) > 60 AS flag_title_too_long, length(COALESCE(seo_description, excerpt)) > 155 AS flag_desc_too_long, schema_org_json IS NULL AS flag_missing_schema_org, canonical_url IS NOT NULL AS has_canonical_override FROM web_articles WHERE deleted_at IS NULL;
