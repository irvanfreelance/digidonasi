import {
  bigint,
  boolean,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Cermin sebagian. Sumber kebenaran yang dijalankan adalah
 * lib/db/migrations/0000_foundation.sql. Aplikasi tidak memanggil Drizzle Query.
 */
const ts = (name: string) => timestamp(name, { withTimezone: true });

export const appConfig = pgTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description").notNull(),
  isProposal: boolean("is_proposal").notNull(),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const orgProfile = pgTable("org_profile", {
  id: smallint("id").primaryKey().default(1),
  seedKey: text("seed_key").notNull(),
  nama: text("nama").notNull(),
  namaSingkat: text("nama_singkat").notNull(),
  tagline: text("tagline").notNull(),
  primaryColor: text("primary_color").notNull(),
  sidebarColor: text("sidebar_color").notNull(),
  accentColor: text("accent_color").notNull(),
  isSeedDefault: boolean("is_seed_default").notNull().default(true),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  nama: text("nama").notNull(),
  email: text("email").notNull(),
  googleSub: text("google_sub"),
  role: text("role").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  seedKey: text("seed_key"),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
  createdAt: ts("created_at").notNull().defaultNow(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  userId: bigint("user_id", { mode: "bigint" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  fieldChanged: text("field_changed"),
  source: text("source").notNull().default("web_app"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const donors = pgTable("donors", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  nama: text("nama").notNull(),
  email: text("email"),
  googleSub: text("google_sub"),
});

export const affiliates = pgTable("affiliates", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  nama: text("nama").notNull(),
  email: text("email").notNull(),
  googleSub: text("google_sub"),
  status: text("status").notNull().default("PENDING"),
});

export const campaigns = pgTable("campaigns", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  seedKey: text("seed_key").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  publicationStatus: text("publication_status").notNull().default("DRAFT"),
  baseCommissionPct: numeric("base_commission_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  seedUntouched: boolean("seed_untouched").notNull().default(true),
});

export const invoices = pgTable("invoices", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  invoiceCode: text("invoice_code").notNull(),
  baseAmount: bigint("base_amount", { mode: "bigint" }).notNull(),
  adminFee: bigint("admin_fee", { mode: "bigint" }).notNull().default(BigInt(0)),
  totalAmount: bigint("total_amount", { mode: "bigint" }).notNull(),
  status: text("status").notNull().default("PENDING"),
});

export const affiliateLedger = pgTable("affiliate_ledger", {
  id: bigint("id", { mode: "bigint" }).generatedAlwaysAsIdentity().primaryKey(),
  affiliateId: bigint("affiliate_id", { mode: "bigint" }).notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  movement: text("movement").notNull(),
  amountRupiah: bigint("amount_rupiah", { mode: "bigint" }).notNull(),
});
