import { query } from '@/lib/db';
import PDFDocument from 'pdfkit';

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatIDR(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

function formatPeriode(d: string | Date | null) {
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(d));
}

function safeHex(hex?: string | null) {
  return hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#1a6b3a';
}

function terbilangNum(n: number): string {
  const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  if (n < 12)            return s[n];
  if (n < 20)            return s[n - 10] + ' belas';
  if (n < 100)           return s[Math.floor(n / 10)] + ' puluh' + (n % 10 ? ' ' + s[n % 10] : '');
  if (n < 200)           return 'seratus' + (n % 100 ? ' ' + terbilangNum(n % 100) : '');
  if (n < 1_000)         return s[Math.floor(n / 100)] + ' ratus' + (n % 100 ? ' ' + terbilangNum(n % 100) : '');
  if (n < 2_000)         return 'seribu' + (n % 1_000 ? ' ' + terbilangNum(n % 1_000) : '');
  if (n < 1_000_000)     return terbilangNum(Math.floor(n / 1_000)) + ' ribu' + (n % 1_000 ? ' ' + terbilangNum(n % 1_000) : '');
  if (n < 1_000_000_000) return terbilangNum(Math.floor(n / 1_000_000)) + ' juta' + (n % 1_000_000 ? ' ' + terbilangNum(n % 1_000_000) : '');
  return terbilangNum(Math.floor(n / 1_000_000_000)) + ' miliar' + (n % 1_000_000_000 ? ' ' + terbilangNum(n % 1_000_000_000) : '');
}
function terbilang(n: number) {
  if (n === 0) return 'Nol Rupiah';
  const w = terbilangNum(Math.round(n));
  return w.charAt(0).toUpperCase() + w.slice(1) + ' Rupiah';
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

export async function getKwitansiData(invoiceCode: string) {
  let invTable = 'invoices';
  let txTable  = 'transactions';
  const m = invoiceCode.match(/INV-(\d{4})(\d{2})\d{2}-/);
  if (m) {
    const sfx = `y${m[1]}m${m[2]}`;
    const [ic, tc] = await Promise.all([
      query(`SELECT to_regclass($1) as e`, [`public.invoices_${sfx}`]),
      query(`SELECT to_regclass($1) as e`, [`public.transactions_${sfx}`]),
    ]);
    if (ic[0].e) invTable = `invoices_${sfx}`;
    if (tc[0].e) txTable  = `transactions_${sfx}`;
  }

  const [invoices, ngoRows] = await Promise.all([
    query(`
      SELECT
        i.id, i.invoice_code,
        i.donor_name_snapshot, i.donor_email, i.donor_phone,
        i.base_amount, i.admin_fee, i.total_amount,
        i.status, i.is_anonymous, i.doa,
        i.created_at, COALESCE(i.paid_at, i.created_at) AS payment_date,
        d.address AS donor_address,
        pm.name AS payment_method_name
      FROM "${invTable}" i
      LEFT JOIN donors          d  ON d.id  = i.donor_id
      LEFT JOIN payment_methods pm ON pm.id = i.payment_method_id
      WHERE i.invoice_code = $1
    `, [invoiceCode]),
    query(`
      SELECT ngo_name, logo_url, primary_color, address, whatsapp_number, legal_info, website
      FROM ngo_configs LIMIT 1
    `, []),
  ]);

  if (!invoices.length) return null;
  const invoice = invoices[0];

  const lineItems = await query(`
    SELECT t.qty, t.amount, c.title AS campaign_title, cv.name AS variant_name,
           cat.name AS category_name
    FROM "${txTable}" t
    JOIN campaigns c               ON c.id  = t.campaign_id
    LEFT JOIN campaign_variants cv ON cv.id = t.variant_id
    LEFT JOIN campaign_categories cat ON cat.id = c.category_id
    WHERE t.invoice_id = $1
  `, [invoice.id]);

  return { invoice, ngo: ngoRows[0] ?? {}, lineItems };
}

export type KwitansiData = NonNullable<Awaited<ReturnType<typeof getKwitansiData>>>;

async function fetchLogo(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ─── PDF builder — LAZ Darul Hikam Kwitansi Style ────────────────────────────

export async function buildKwitansiPdf(data: KwitansiData): Promise<Buffer> {
  const { invoice, ngo, lineItems } = data;

  const primary = safeHex(ngo.primary_color);
  const dark    = '#1e293b';
  const muted   = '#475569';
  const border  = '#94a3b8';

  const logoBuf = ngo.logo_url ? await fetchLogo(ngo.logo_url) : null;

  // A4
  const PW = 595.28, PH = 841.89;
  const M  = 36;
  const CW = PW - M * 2;

  const doc = new PDFDocument({
    size: 'A4', margin: M, compress: true,
    info: { Title: `Kwitansi ${invoice.invoice_code}` },
  });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const donorName = invoice.is_anonymous
    ? 'Hamba Allah'
    : invoice.donor_name_snapshot || '-';

  // ═══════════════════════════════════════════════════════
  // 1. OUTER BORDER
  // ═══════════════════════════════════════════════════════
  doc.rect(M - 6, M - 6, CW + 12, PH - M * 2 + 12)
    .lineWidth(1.2).strokeColor(border).stroke();

  // ═══════════════════════════════════════════════════════
  // 2. HEADER — Logo | NGO Info | LEMBAR box
  // ═══════════════════════════════════════════════════════
  const H_TOP = M + 4;
  const H_H   = 68;

  const LOGO_W = CW * 0.22;
  if (logoBuf) {
    try {
      doc.image(logoBuf, M + 2, H_TOP + 4, { fit: [LOGO_W - 6, H_H - 8] });
    } catch { /* skip */ }
  } else {
    doc.fillColor(primary).fontSize(11).font('Helvetica-Bold')
      .text(ngo.ngo_name || 'LAZ', M + 2, H_TOP + (H_H - 14) / 2, { width: LOGO_W - 4, align: 'center' });
  }

  const INFO_X = M + LOGO_W + 8;
  const INFO_W = CW * 0.50;
  doc.fillColor(dark).fontSize(10).font('Helvetica-Bold')
    .text(ngo.ngo_name || 'LAZ DARUL HIKAM', INFO_X, H_TOP + 4, { width: INFO_W });
  doc.fillColor(muted).fontSize(7).font('Helvetica')
    .text(
      ngo.address || 'Jl. Laswi No. 120, Kel. Samoja, Kec. Batununggal, Kota Bandung, Jawa Barat 40273',
      INFO_X, H_TOP + 18, { width: INFO_W }
    );
  const wa  = ngo.whatsapp_number ? `WhatsApp: ${ngo.whatsapp_number}` : '';
  const web = ngo.website         ? `  |  ${ngo.website}`              : '';
  doc.fillColor(muted).fontSize(7).font('Helvetica')
    .text(wa + web, INFO_X, H_TOP + 46, { width: INFO_W });
  if (ngo.legal_info) {
    doc.fillColor(muted).fontSize(6.5).font('Helvetica-Oblique')
      .text(ngo.legal_info, INFO_X, H_TOP + 56, { width: INFO_W });
  }

  // LEMBAR box (right)
  const LEM_X = M + LOGO_W + INFO_W + 12;
  const LEM_W = CW - LOGO_W - INFO_W - 16;
  doc.rect(LEM_X, H_TOP, LEM_W, H_H).lineWidth(0.8).strokeColor(border).stroke();
  doc.fillColor(dark).fontSize(9).font('Helvetica-Bold')
    .text('LEMBAR', LEM_X, H_TOP + 6, { width: LEM_W, align: 'center' });
  const SB_H = 24, SB_Y = H_TOP + 20, SB_M = 8;
  doc.rect(LEM_X + SB_M, SB_Y, LEM_W - SB_M * 2, SB_H).strokeColor(border).lineWidth(0.6).stroke();
  doc.fillColor(muted).fontSize(6.5).font('Helvetica')
    .text('Untuk Arsip Wajib Zakat', LEM_X, SB_Y + SB_H + 4, { width: LEM_W, align: 'center' });

  let y = H_TOP + H_H + 8;
  doc.moveTo(M - 6, y).lineTo(M + CW + 6, y).strokeColor(border).lineWidth(0.8).stroke();
  y += 8;

  // ═══════════════════════════════════════════════════════
  // 3. TITLE
  // ═══════════════════════════════════════════════════════
  doc.fillColor(dark).fontSize(14).font('Helvetica-Bold')
    .text('Bukti Setoran Infak/Sedekah', M, y, { width: CW, align: 'center' });
  y += 22;
  doc.moveTo(M + CW * 0.2, y).lineTo(M + CW * 0.8, y).strokeColor(border).lineWidth(0.5).stroke();
  y += 10;

  // ═══════════════════════════════════════════════════════
  // 4. FIELD ROWS
  // ═══════════════════════════════════════════════════════
  const LABEL_W = CW * 0.22;
  const VAL_X   = M + 4 + LABEL_W + 10;

  const fieldRow = (label: string, value: string, yy: number) => {
    doc.fillColor(dark).fontSize(8.5).font('Helvetica')
      .text(label, M + 4, yy, { width: LABEL_W, lineBreak: false });
    doc.text(':', M + 4 + LABEL_W, yy, { width: 8, lineBreak: false });
    doc.font('Helvetica').text(value, VAL_X, yy, { width: CW - LABEL_W - 20, lineBreak: false });
  };

  const underline = (yy: number) => {
    doc.moveTo(VAL_X, yy + 12).lineTo(M + CW, yy + 12).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
  };

  fieldRow('Nomor', invoice.invoice_code, y);   underline(y); y += 16;
  fieldRow('Periode', formatPeriode(invoice.payment_date), y); underline(y); y += 20;

  doc.moveTo(M, y).lineTo(M + CW, y).strokeColor('#e2e8f0').lineWidth(0.4).stroke();
  y += 10;

  fieldRow('Telah terima dari', donorName, y);  underline(y); y += 16;
  fieldRow('NPWZ', '-', y);                     underline(y); y += 16;
  fieldRow('NPWP/NIK', '-', y);                 underline(y); y += 16;
  fieldRow('Alamat', invoice.donor_address || '-', y); underline(y); y += 16;

  const contactStr = [invoice.donor_phone, invoice.donor_email].filter(Boolean).join('  /  ') || '-';
  fieldRow('Telepon/Email', contactStr, y);      underline(y); y += 20;

  // ═══════════════════════════════════════════════════════
  // 5. TABLE
  // ═══════════════════════════════════════════════════════
  const TC       = [CW * 0.20, CW * 0.38, CW * 0.18, CW * 0.24];
  const TX       = [M, M + TC[0], M + TC[0] + TC[1], M + TC[0] + TC[1] + TC[2]];
  const TH_LBLS  = ['Objek ZIS', 'Uraian', 'Via', 'Jumlah (Rp)'];
  const TH_ALN:  ('left' | 'center' | 'right')[] = ['left', 'left', 'center', 'right'];
  const TR_H     = 22;
  const T_PAD    = 5;

  doc.rect(M, y, CW, TR_H).fill(primary);
  TH_LBLS.forEach((h, i) => {
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
      .text(h, TX[i] + T_PAD, y + 7, { width: TC[i] - T_PAD * 2, align: TH_ALN[i], lineBreak: false });
  });
  [1, 2, 3].forEach(i => {
    doc.moveTo(TX[i], y).lineTo(TX[i], y + TR_H).strokeColor('#ffffff').lineWidth(0.4).stroke();
  });
  y += TR_H;

  const rows      = lineItems as any[];
  const rowCount  = Math.max(rows.length, 3);

  for (let idx = 0; idx < rowCount; idx++) {
    const item = rows[idx];
    const bg   = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc.rect(M, y, CW, TR_H).fill(bg);
    doc.rect(M, y, CW, TR_H).lineWidth(0.4).strokeColor('#e2e8f0').stroke();
    [1, 2, 3].forEach(i => {
      doc.moveTo(TX[i], y).lineTo(TX[i], y + TR_H).strokeColor('#e2e8f0').lineWidth(0.4).stroke();
    });

    if (item) {
      const cells: string[] = [
        item.category_name || 'Infak/Sedekah',
        item.variant_name ? `${item.campaign_title} (${item.variant_name})` : item.campaign_title,
        invoice.payment_method_name || '-',
        formatIDR(Number(item.amount || 0) * Number(item.qty || 1)),
      ];
      const alns: ('left' | 'right' | 'center')[] = ['left', 'left', 'center', 'right'];
      cells.forEach((v, i) => {
        doc.fillColor(dark).fontSize(8).font('Helvetica')
          .text(v, TX[i] + T_PAD, y + 7, { width: TC[i] - T_PAD * 2, align: alns[i], lineBreak: false });
      });
    }
    y += TR_H;
  }

  // Total row
  doc.rect(M, y, CW, TR_H).fill('#f1f5f9').stroke('#e2e8f0');
  doc.fillColor(dark).fontSize(8.5).font('Helvetica-Bold')
    .text('JUMLAH', M + T_PAD, y + 7, { width: CW * 0.76 - T_PAD });
  doc.text(formatIDR(Number(invoice.total_amount)), TX[3] + T_PAD, y + 7, {
    width: TC[3] - T_PAD * 2, align: 'right', lineBreak: false,
  });
  y += TR_H + 10;

  // ═══════════════════════════════════════════════════════
  // 6. TERBILANG & CATATAN
  // ═══════════════════════════════════════════════════════
  doc.fillColor(dark).fontSize(8.5).font('Helvetica-Bold').text('Terbilang:', M + 4, y);
  doc.font('Helvetica-Oblique').fillColor(muted)
    .text(terbilang(Number(invoice.total_amount)), M + 4, y + 12, { width: CW - 8 });
  y += 28;

  doc.fillColor(dark).fontSize(8.5).font('Helvetica-Bold').text('Catatan:', M + 4, y);
  doc.font('Helvetica').fillColor(muted)
    .text(invoice.doa || '-', M + 4, y + 12, { width: CW - 8 });
  y += 36;

  // ═══════════════════════════════════════════════════════
  // 7. BLESSING TEXT
  // ═══════════════════════════════════════════════════════
  doc.rect(M, y, CW, 28).fill('#f8fafc').stroke('#e2e8f0');
  doc.fillColor(muted).fontSize(7.5).font('Helvetica-Oblique')
    .text(
      'Semoga Allah SWT memberikan pahala kepada (penyetor) atas harta yang telah dikeluarkan dan menjadi berkah dan suci atas harta yang lainnya.',
      M + 8, y + 8, { width: CW - 16, align: 'center' }
    );
  y += 36;

  // ═══════════════════════════════════════════════════════
  // 8. SIGNATURES
  // ═══════════════════════════════════════════════════════
  const SIG_W = CW / 2 - 10;
  const SIG_H = 56;

  doc.rect(M, y, SIG_W, SIG_H).lineWidth(0.5).strokeColor(border).stroke();
  doc.fillColor(dark).fontSize(8).font('Helvetica')
    .text('Pengesahan Petugas Amil', M, y + 6, { width: SIG_W, align: 'center' });
  doc.text('Petugas:', M + 6, y + SIG_H - 14, { width: SIG_W - 12 });

  const SIG2_X = M + SIG_W + 20;
  doc.rect(SIG2_X, y, SIG_W, SIG_H).lineWidth(0.5).strokeColor(border).stroke();
  doc.fillColor(dark).fontSize(8).font('Helvetica')
    .text('Penyetor/Wajib Zakat', SIG2_X, y + 6, { width: SIG_W, align: 'center' });
  doc.text('Nama:', SIG2_X + 6, y + SIG_H - 14, { width: SIG_W - 12 });
  y += SIG_H + 10;

  // ═══════════════════════════════════════════════════════
  // 9. FOOTNOTES
  // ═══════════════════════════════════════════════════════
  doc.fillColor(muted).fontSize(6.5).font('Helvetica')
    .text('* Nilai donasi natura ditaksir dalam jumlah rupiah oleh petugas yang mengesahkan bukti setoran.', M + 2, y, { width: CW });
  doc.text(
    '** LAZ Darul Hikam hanya menerima donasi dari sumber yang halal, tidak bertentangan dengan peraturan yang berlaku, dan bukan merupakan pencucian uang.',
    M + 2, y + 10, { width: CW }
  );

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
