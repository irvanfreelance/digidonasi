import {
  bigint,
  bigserial,
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Cermin lengkap setiap tabel di lib/db/migrations/0000_foundation.sql.
 * Berkas SQL itulah yang dipasang. Drizzle Query tidak dipakai aplikasi.
 * drizzle-kit push/generate bukan jalan migrasi. Tes paritas menolak cermin yang kehilangan tabel.
 */
const ts = (name: string) => timestamp(name, { withTimezone: true });

export const digidonasiSchema = pgTable("digidonasi_schema", {
  id: smallint("id").primaryKey(),
  revision: smallint("revision").notNull(),
  note: text("note").notNull(),
  installedAt: ts("installed_at").notNull().defaultNow(),
});

export const orgProfile = pgTable("org_profile", {
  id: smallint("id").primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  nama: varchar("nama", { length: 200 }).notNull(),
  namaSingkat: varchar("nama_singkat", { length: 40 }).notNull(),
  tagline: varchar("tagline", { length: 200 }).notNull().default(''),
  shortDescription: text("short_description").notNull(),
  address: text("address").notNull(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  videoUrl: text("video_url"),
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default('#01665a'),
  sidebarColor: varchar("sidebar_color", { length: 7 }).notNull().default('#01665a'),
  accentColor: varchar("accent_color", { length: 7 }).notNull().default('#2e8b7a'),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  whatsappNumber: text("whatsapp_number"),
  publicEmail: text("public_email"),
  isSeedDefault: boolean("is_seed_default").notNull().default(true),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const appConfig = pgTable("app_config", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  isProposal: boolean("is_proposal").notNull().default(false),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  nama: varchar("nama", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  googleSub: varchar("google_sub", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(false),
  lastLoginAt: ts("last_login_at"),
  seedKey: text("seed_key").unique(),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: bigint("user_id", { mode: "bigint" }).references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: bigint("entity_id", { mode: "bigint" }),
  fieldChanged: varchar("field_changed", { length: 100 }),
  valueBefore: jsonb("value_before"),
  valueAfter: jsonb("value_after"),
  source: varchar("source", { length: 50 }).notNull().default('web_app'),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const donors = pgTable("donors", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  nama: text("nama").notNull(),
  email: text("email"),
  googleSub: text("google_sub"),
  phoneCanonical: text("phone_canonical"),
  isAnonymousDefault: boolean("is_anonymous_default").notNull().default(false),
  seedKey: text("seed_key").unique(),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const affiliates = pgTable("affiliates", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  nama: text("nama").notNull(),
  email: text("email").notNull(),
  googleSub: text("google_sub"),
  status: text("status").notNull().default('PENDING'),
  seedKey: text("seed_key").unique(),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  iconName: text("icon_name"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const campaigns = pgTable("campaigns", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  categoryId: bigint("category_id", { mode: "bigint" }).notNull().references(() => categories.id),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  isVerified: boolean("is_verified").notNull().default(false),
  isUrgent: boolean("is_urgent").notNull().default(false),
  isZakat: boolean("is_zakat").notNull().default(false),
  isQurban: boolean("is_qurban").notNull().default(false),
  isFixedAmount: boolean("is_fixed_amount").notNull().default(false),
  isBundle: boolean("is_bundle").notNull().default(false),
  hasNoTarget: boolean("has_no_target").notNull().default(false),
  hasNoTimeLimit: boolean("has_no_time_limit").notNull().default(false),
  isCarousel: boolean("is_carousel").notNull().default(false),
  minimumAmount: bigint("minimum_amount", { mode: "bigint" }).notNull().default(BigInt(10000)),
  targetAmount: bigint("target_amount", { mode: "bigint" }),
  suggestionAmounts: bigint("suggestion_amounts", { mode: "bigint" }).array().notNull(),
  endDate: date("end_date"),
  baseCommissionPct: numeric("base_commission_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const campaignVariants = pgTable("campaign_variants", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  campaignId: bigint("campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  name: text("name").notNull(),
  priceRupiah: bigint("price_rupiah", { mode: "bigint" }).notNull(),
  namesPerQty: smallint("names_per_qty").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const campaignBundles = pgTable("campaign_bundles", {
  seedKey: text("seed_key").primaryKey(),
  bundleCampaignId: bigint("bundle_campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  itemCampaignId: bigint("item_campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  qty: smallint("qty").notNull(),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const campaignUpdates = pgTable("campaign_updates", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  campaignId: bigint("campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const campaignStats = pgTable("campaign_stats", {
  campaignId: bigint("campaign_id", { mode: "bigint" }).primaryKey().references(() => campaigns.id),
  collectedAmount: bigint("collected_amount", { mode: "bigint" }).notNull().default(BigInt(0)),
  donorCount: integer("donor_count").notNull().default(0),
});

export const campaignQrisStatic = pgTable("campaign_qris_static", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  campaignId: bigint("campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  status: text("status").notNull().default('DISABLED'),
  qrisString: text("qris_string").notNull().default(''),
  isDemo: boolean("is_demo").notNull().default(true),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const paymentProviders = pgTable("payment_providers", {
  code: text("code").primaryKey(),
  adapterStatus: text("adapter_status").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  note: text("note").notNull(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  channelType: text("channel_type").notNull(),
  legacyAlias: text("legacy_alias"),
  providerCode: text("provider_code").references(() => paymentProviders.code),
  adminFeeFlat: bigint("admin_fee_flat", { mode: "bigint" }).notNull().default(BigInt(0)),
  adminFeePct: numeric("admin_fee_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(false),
  isRedirect: boolean("is_redirect").notNull().default(false),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const paymentInstructions = pgTable("payment_instructions", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  paymentMethodId: bigint("payment_method_id", { mode: "bigint" }).notNull().references(() => paymentMethods.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const invoices = pgTable("invoices", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  invoiceCode: text("invoice_code").unique().notNull(),
  donorId: bigint("donor_id", { mode: "bigint" }).references(() => donors.id),
  paymentMethodId: bigint("payment_method_id", { mode: "bigint" }).notNull().references(() => paymentMethods.id),
  donorNameSnapshot: text("donor_name_snapshot").notNull(),
  donorEmail: text("donor_email"),
  donorPhone: text("donor_phone"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  doa: text("doa"),
  baseAmount: bigint("base_amount", { mode: "bigint" }).notNull(),
  adminFee: bigint("admin_fee", { mode: "bigint" }).notNull().default(BigInt(0)),
  totalAmount: bigint("total_amount", { mode: "bigint" }).notNull(),
  status: text("status").notNull().default('PENDING'),
  providerCode: text("provider_code").references(() => paymentProviders.code),
  providerRef: text("provider_ref"),
  createdAt: ts("created_at").notNull().defaultNow(),
  paidAt: ts("paid_at"),
});

export const transactions = pgTable("transactions", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  invoiceId: bigint("invoice_id", { mode: "bigint" }).notNull().references(() => invoices.id),
  campaignId: bigint("campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  variantId: bigint("variant_id", { mode: "bigint" }).references(() => campaignVariants.id),
  bundleCampaignId: bigint("bundle_campaign_id", { mode: "bigint" }).references(() => campaigns.id),
  affiliateId: bigint("affiliate_id", { mode: "bigint" }).references(() => affiliates.id),
  qty: smallint("qty").notNull().default(1),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const transactionQurbanNames = pgTable("transaction_qurban_names", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  transactionId: bigint("transaction_id", { mode: "bigint" }).notNull().references(() => transactions.id),
  mudhohiName: text("mudhohi_name").notNull(),
});

export const paymentEvents = pgTable("payment_events", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  providerCode: text("provider_code").notNull().references(() => paymentProviders.code),
  providerEventId: text("provider_event_id").notNull(),
  invoiceId: bigint("invoice_id", { mode: "bigint" }).notNull().references(() => invoices.id),
  mappedStatus: text("mapped_status").notNull(),
  amountRupiah: bigint("amount_rupiah", { mode: "bigint" }).notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const notificationTemplates = pgTable("notification_templates", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  eventTrigger: text("event_trigger").notNull(),
  channel: text("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const notificationOutbox = pgTable("notification_outbox", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  templateId: bigint("template_id", { mode: "bigint" }).references(() => notificationTemplates.id),
  dedupeKey: text("dedupe_key").unique().notNull(),
  status: text("status").notNull().default('pending'),
  payload: jsonb("payload").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const trackingPublicIds = pgTable("tracking_public_ids", {
  key: text("key").primaryKey(),
  publicId: text("public_id"),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const pixelEvents = pgTable("pixel_events", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  screenName: text("screen_name").notNull(),
  metaEvent: text("meta_event"),
  tiktokEvent: text("tiktok_event"),
  googleEvent: text("google_event"),
  isActive: boolean("is_active").notNull().default(false),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const donationBlocks = pgTable("donation_blocks", {
  seedKey: text("seed_key").primaryKey(),
  heading: text("heading"),
  body: text("body"),
  links: jsonb("links").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const websiteBlocks = pgTable("website_blocks", {
  seedKey: text("seed_key").primaryKey(),
  heading: text("heading"),
  body: text("body"),
  links: jsonb("links").notNull(),
  items: jsonb("items").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webArticleCategories = pgTable("web_article_categories", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webArticles = pgTable("web_articles", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  categoryId: bigint("category_id", { mode: "bigint" }).references(() => webArticleCategories.id),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  publishedAt: ts("published_at"),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webTags = pgTable("web_tags", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webArticleTags = pgTable("web_article_tags", {
  articleId: bigint("article_id", { mode: "bigint" }).notNull().references(() => webArticles.id),
  tagId: bigint("tag_id", { mode: "bigint" }).notNull().references(() => webTags.id),
}, (table) => [primaryKey({ columns: [table.articleId, table.tagId] })]);

export const webTestimonials = pgTable("web_testimonials", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  personLabel: text("person_label").notNull(),
  quote: text("quote").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webPartners = pgTable("web_partners", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  name: text("name").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webCareCategories = pgTable("web_care_categories", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webImpactCategories = pgTable("web_impact_categories", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webImpactMetrics = pgTable("web_impact_metrics", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  metricKey: text("metric_key").unique().notNull(),
  label: text("label").notNull(),
  valueAmount: bigint("value_amount", { mode: "bigint" }).notNull(),
  suffix: text("suffix").notNull().default(''),
  isDemo: boolean("is_demo").notNull().default(true),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webDistributionPoints = pgTable("web_distribution_points", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  label: text("label").notNull(),
  latitude: numeric("latitude", { precision: 8, scale: 5 }),
  longitude: numeric("longitude", { precision: 8, scale: 5 }),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webAboutContent = pgTable("web_about_content", {
  id: smallint("id").primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webHistoryTimeline = pgTable("web_history_timeline", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  yearLabel: text("year_label").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webMissionPoints = pgTable("web_mission_points", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webTeamMembers = pgTable("web_team_members", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  roleLabel: text("role_label").notNull(),
  displayName: text("display_name").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  sortOrder: smallint("sort_order").notNull().default(0),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webLegality = pgTable("web_legality", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  title: text("title").notNull(),
  documentNumber: text("document_number").notNull(),
  issuedBy: text("issued_by").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webFaqs = pgTable("web_faqs", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webFinancialReports = pgTable("web_financial_reports", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  title: text("title").notNull(),
  periodLabel: text("period_label").notNull(),
  summary: text("summary").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webFundAllocations = pgTable("web_fund_allocations", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  campaignId: bigint("campaign_id", { mode: "bigint" }).references(() => campaigns.id),
  title: text("title").notNull(),
  narrative: text("narrative").notNull(),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const webBankAccounts = pgTable("web_bank_accounts", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  seedKey: text("seed_key").unique().notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  payable: boolean("payable").notNull().default(false),
  isDemo: boolean("is_demo").notNull().default(true),
  publicationStatus: text("publication_status").notNull().default('DRAFT'),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  affiliateId: bigint("affiliate_id", { mode: "bigint" }).notNull().references(() => affiliates.id),
  campaignId: bigint("campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  clickToken: text("click_token").unique().notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const affiliateCampaignCommissions = pgTable("affiliate_campaign_commissions", {
  affiliateId: bigint("affiliate_id", { mode: "bigint" }).notNull().references(() => affiliates.id),
  campaignId: bigint("campaign_id", { mode: "bigint" }).notNull().references(() => campaigns.id),
  commissionPct: numeric("commission_pct", { precision: 5, scale: 2 }).notNull(),
}, (table) => [primaryKey({ columns: [table.affiliateId, table.campaignId] })]);

export const payoutRequests = pgTable("payout_requests", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  affiliateId: bigint("affiliate_id", { mode: "bigint" }).notNull().references(() => affiliates.id),
  idempotencyKey: text("idempotency_key").unique().notNull(),
  amountRupiah: bigint("amount_rupiah", { mode: "bigint" }).notNull(),
  status: text("status").notNull().default('requested'),
  settlementRef: text("settlement_ref"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const affiliateLedger = pgTable("affiliate_ledger", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  affiliateId: bigint("affiliate_id", { mode: "bigint" }).notNull().references(() => affiliates.id),
  idempotencyKey: text("idempotency_key").unique().notNull(),
  movement: text("movement").notNull(),
  amountRupiah: bigint("amount_rupiah", { mode: "bigint" }).notNull(),
  transactionId: bigint("transaction_id", { mode: "bigint" }).references(() => transactions.id),
  payoutRequestId: bigint("payout_request_id", { mode: "bigint" }).references(() => payoutRequests.id),
  createdAt: ts("created_at").notNull().defaultNow(),
});
