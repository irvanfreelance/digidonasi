import { randomBytes } from "node:crypto";
import type { Sql } from "@/lib/db";
import { resolveClick } from "@/lib/afiliasi/ledger";
import { createCharge, faspayRejected } from "@/lib/pembayaran/verify";

export class DonasiError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export type CheckoutLine = { slug: string; qty: number; amount: number };
export type CheckoutInput = {
  slug: string;
  qty?: number;
  amount?: number;
  variantId?: number | null;
  names?: string[];
  lines?: CheckoutLine[];
  donorName?: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  anonymous?: boolean;
  doa?: string | null;
  donorId?: string | null;
  sessionEmail?: string | null;
  sessionName?: string | null;
  invoiceCode?: string;
  methodCode?: string;
  clickToken?: string | null;
  now?: Date;
};

export type CheckoutResult = {
  invoiceCode: string;
  baseAmount: number;
  adminFee: number;
  totalAmount: number;
  instruction: string;
  provider: "mock" | "xendit" | "midtrans";
};

function int(value: unknown, label: string) {
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof number !== "number" || !Number.isSafeInteger(number)) throw new DonasiError(`${label}_tidak_sah`);
  return number;
}

function money(value: unknown) {
  const amount = int(value, "nominal");
  if (amount < 0 || amount > 1_000_000_000_000) throw new DonasiError("nominal_tidak_sah");
  return amount;
}

export function newInvoiceCode() {
  return `INV${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function isUniqueViolation(error: unknown) {
  return (error as { code?: string }).code === "23505";
}

type Campaign = {
  id: string;
  slug: string;
  title: string;
  publication_status: string;
  is_qurban: boolean;
  is_fixed_amount: boolean;
  is_bundle: boolean;
  minimum_amount: string;
};

export async function createCheckout(sql: Sql, input: CheckoutInput): Promise<CheckoutResult> {
  const rows = await sql<Campaign>(
    `SELECT id, slug, title, publication_status, is_qurban, is_fixed_amount, is_bundle, minimum_amount
     FROM campaigns WHERE slug = $1 LIMIT 1`,
    [input.slug],
  );
  const campaign = rows[0];
  if (!campaign || campaign.publication_status !== "ACTIVE") throw new DonasiError("kampanye_tidak_tersedia");

  const guest = !input.donorId;
  const email = guest ? input.donorEmail?.trim().toLowerCase() || null : input.sessionEmail?.trim().toLowerCase() || null;
  if (email && !email.includes("@")) throw new DonasiError("email_tidak_sah");
  const name = (guest ? input.donorName : input.donorName || input.sessionName || "Donatur")?.trim() || "";
  if (name.length < 2) throw new DonasiError("nama_tidak_sah");

  let base = 0;
  const prepared: { campaignId: string; variantId: string | null; bundleId: string | null; qty: number; amount: number; names: string[] }[] = [];

  if (campaign.is_bundle) {
    const children = await sql<{ item_campaign_id: string; qty: number; slug: string }>(
      `SELECT b.item_campaign_id, b.qty, c.slug
       FROM campaign_bundles b JOIN campaigns c ON c.id = b.item_campaign_id
       WHERE b.bundle_campaign_id = $1 ORDER BY b.seed_key`,
      [campaign.id],
    );
    if (!input.lines?.length) throw new DonasiError("bundel_tidak_seimbang");
    if (input.lines.length !== children.length) throw new DonasiError("bundel_tidak_seimbang");
    const bySlug = new Map(input.lines.map((line) => [line.slug, line]));
    for (const child of children) {
      const line = bySlug.get(child.slug);
      const qty = int(line?.qty, "jumlah");
      const amount = money(line?.amount);
      if (!line || qty !== Number(child.qty) || qty < 1) throw new DonasiError("bundel_tidak_seimbang");
      prepared.push({ campaignId: String(child.item_campaign_id), variantId: null, bundleId: String(campaign.id), qty, amount, names: [] });
      base += amount;
    }
    const minimum = Number(campaign.minimum_amount);
    if (base < minimum) throw new DonasiError("nominal_tidak_sah");
  } else if (campaign.is_qurban) {
    const qty = int(input.qty ?? 1, "jumlah");
    if (qty < 1 || qty > 1000) throw new DonasiError("jumlah_tidak_sah");
    const variants = await sql<{ id: string; price_rupiah: string; names_per_qty: number; is_active: boolean }>(
      `SELECT id, price_rupiah, names_per_qty, is_active FROM campaign_variants WHERE id = $1 AND campaign_id = $2 LIMIT 1`,
      [input.variantId, campaign.id],
    );
    const variant = variants[0];
    if (!variant || !variant.is_active) throw new DonasiError("varian_tidak_sah");
    const amount = Number(variant.price_rupiah) * qty;
    if (input.amount != null && money(input.amount) !== amount) throw new DonasiError("nominal_tidak_sah");
    const names = (input.names ?? []).map((item) => item.trim()).filter(Boolean);
    if (names.length !== qty * Number(variant.names_per_qty)) throw new DonasiError("nama_qurban_tidak_sesuai");
    prepared.push({ campaignId: String(campaign.id), variantId: String(variant.id), bundleId: null, qty, amount, names });
    base = amount;
  } else {
    const qty = int(input.qty ?? 1, "jumlah");
    if (qty < 1 || qty > 1000) throw new DonasiError("jumlah_tidak_sah");
    const amount = money(input.amount);
    const minimum = Number(campaign.minimum_amount) * qty;
    if (campaign.is_fixed_amount ? amount !== minimum : amount < minimum) throw new DonasiError("nominal_tidak_sah");
    prepared.push({ campaignId: String(campaign.id), variantId: null, bundleId: null, qty, amount, names: [] });
    base = amount;
  }

  let affiliateId: string | null = null;
  let clickCampaign: string | null = null;
  if (input.clickToken) {
    const click = await resolveClick(sql, input.clickToken, input.now ?? new Date());
    const self = Boolean(email && click && email.toLowerCase() === click.email.toLowerCase());
    if (click && !self) {
      affiliateId = click.affiliate_id;
      clickCampaign = click.campaign_id;
    }
  }

  const method = input.methodCode
    ? await sql<{ id: string; provider_code: string | null; is_active: boolean; code: string }>(
        `SELECT id, provider_code, is_active, code FROM payment_methods WHERE code = $1 LIMIT 1`,
        [input.methodCode],
      )
    : await sql<{ id: string; provider_code: string | null; is_active: boolean; code: string }>(
        `SELECT id, provider_code, is_active, code FROM payment_methods WHERE seed_key = 'demo-pay-manual' LIMIT 1`,
      );
  const chosen = method[0];
  if (!chosen) throw new DonasiError("metode_mock_tidak_ada");
  if (faspayRejected(chosen.code) || faspayRejected(String(chosen.provider_code || ""))) throw new DonasiError("faspay_tidak_tersedia");
  let provider: "mock" | "xendit" | "midtrans" = "mock";
  let providerRef = "mock";
  let instruction = "Menunggu pembayaran mock. Xendit dan Midtrans belum dihubungkan.";
  const code = input.invoiceCode || newInvoiceCode();
  if (input.methodCode) {
    if (!chosen.is_active || (chosen.provider_code !== "xendit" && chosen.provider_code !== "midtrans")) throw new DonasiError("metode_tidak_aktif");
    provider = chosen.provider_code;
    const charge = await createCharge({ provider, invoiceCode: code, amount: base });
    providerRef = charge.providerRef;
    instruction = charge.instruction;
  }
  const fee = 0;
  const inserted = await sql<{ id: string }>(
    `INSERT INTO invoices (
      invoice_code, donor_id, payment_method_id, donor_name_snapshot, donor_email, donor_phone,
      is_anonymous, doa, base_amount, admin_fee, total_amount, status, provider_code, provider_ref
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',$12,$13)
    RETURNING id`,
    [
      code,
      input.donorId ?? null,
      chosen.id,
      name,
      email,
      input.donorPhone?.trim() || null,
      Boolean(input.anonymous),
      input.doa?.trim() || null,
      base,
      fee,
      base + fee,
      provider === "mock" ? null : provider,
      providerRef,
    ],
  );
  for (const line of prepared) {
    const attributed = affiliateId && (line.campaignId === clickCampaign || line.bundleId === clickCampaign) ? affiliateId : null;
    const trx = await sql<{ id: string }>(
      `INSERT INTO transactions (invoice_id, campaign_id, variant_id, bundle_campaign_id, affiliate_id, qty, amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [inserted[0].id, line.campaignId, line.variantId, line.bundleId, attributed, line.qty, line.amount],
    );
    for (const mudhohi of line.names) {
      await sql(`INSERT INTO transaction_qurban_names (transaction_id, mudhohi_name) VALUES ($1,$2)`, [trx[0].id, mudhohi]);
    }
  }
  return {
    invoiceCode: code,
    baseAmount: base,
    adminFee: fee,
    totalAmount: base + fee,
    provider,
    instruction,
  };
}
