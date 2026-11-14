import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/afiliasi?code=KODE_AFILIASI
 * Mengambil profil ringkas afiliasi, ringkasan dana tergalang, dan daftar kampanye beserta link afiliasi.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();

  try {
    const campaigns = await query<{
      id: number;
      slug: string;
      title: string;
      banner_url: string | null;
      collected_amount: string;
      target_amount: string;
    }>(
      `SELECT c.id, c.slug, c.title, c.banner_url,
              COALESCE(cs.collected_amount, 0) AS collected_amount,
              c.target_amount
       FROM campaigns c
       LEFT JOIN campaign_stats cs ON cs.campaign_id = c.id
       WHERE c.status = 'ACTIVE'
       ORDER BY c.sort ASC, c.id DESC
       LIMIT 30`
    );

    if (!code) {
      return NextResponse.json({ affiliate: null, summary: null, campaigns });
    }

    const affiliates = await query<{
      id: number;
      affiliate_code: string;
      name: string;
      email: string;
      balance: string;
      status: string;
    }>(
      `SELECT id, affiliate_code, name, email, balance, status
       FROM affiliates
       WHERE lower(affiliate_code) = lower($1) AND status = 'ACTIVE'
       LIMIT 1`,
      [code]
    );

    if (affiliates.length === 0) {
      return NextResponse.json({ error: "Kode afiliasi tidak ditemukan atau nonaktif." }, { status: 404 });
    }

    const affiliate = affiliates[0];
    const [stats] = await query<{
      total_clicks: string;
      total_donors: string;
      total_raised: string;
      total_commission: string;
    }>(
      `SELECT COALESCE(SUM(click_count), 0) AS total_clicks,
              COALESCE(SUM(converted_donors), 0) AS total_donors,
              COALESCE(SUM(raised_amount), 0) AS total_raised,
              COALESCE(SUM(commission_earned), 0) AS total_commission
       FROM affiliate_campaign_stats
       WHERE affiliate_id = $1`,
      [affiliate.id]
    );

    const withdrawals = await query<{
      id: number;
      amount: string;
      bank_account_info: string;
      status: string;
      created_at: string;
    }>(
      `SELECT id, amount, bank_account_info, status, created_at
       FROM withdrawals
       WHERE affiliate_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [affiliate.id]
    );

    return NextResponse.json({
      affiliate,
      summary: stats ?? { total_clicks: "0", total_donors: "0", total_raised: "0", total_commission: "0" },
      withdrawals,
      campaigns,
    });
  } catch (err) {
    console.error("[GET /api/afiliasi]", err);
    return NextResponse.json({ error: "Gagal memuat data afiliasi" }, { status: 500 });
  }
}

/**
 * POST /api/afiliasi
 * Mengajukan penarikan saldo komisi afiliasi ke tabel withdrawals.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code ?? "").trim();
    const amount = Number(body.amount ?? 0);
    const bankAccountInfo = String(body.bank_account_info ?? "").trim();

    if (!code || !Number.isFinite(amount) || amount < 10000 || !bankAccountInfo) {
      return NextResponse.json(
        { error: "Kode afiliasi, nominal (min Rp 10.000), dan info rekening wajib diisi." },
        { status: 400 }
      );
    }

    const affiliates = await query<{ id: number; balance: string }>(
      `SELECT id, balance FROM affiliates WHERE lower(affiliate_code) = lower($1) AND status = 'ACTIVE' LIMIT 1`,
      [code]
    );
    if (affiliates.length === 0) {
      return NextResponse.json({ error: "Afiliasi tidak ditemukan." }, { status: 404 });
    }

    const aff = affiliates[0];
    if (Number(aff.balance) < amount) {
      return NextResponse.json({ error: "Saldo komisi tidak mencukupi." }, { status: 400 });
    }

    const [wd] = await query<{ id: number }>(
      `INSERT INTO withdrawals (affiliate_id, amount, bank_account_info, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING id`,
      [aff.id, amount, bankAccountInfo]
    );

    return NextResponse.json({ ok: true, id: wd.id });
  } catch (err) {
    console.error("[POST /api/afiliasi]", err);
    return NextResponse.json({ error: "Gagal mengajukan penarikan" }, { status: 500 });
  }
}

