import { formatIDR } from './utils';

/**
 * Replace {variable} placeholders in a template string.
 * Unknown placeholders are left as-is.
 */
export function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-z_]+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match
  );
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface PaidEmailData {
  ngoName: string;
  donorName: string;
  invoiceCode: string;
  amount: number;
  paymentMethod: string;
  paidAt: Date;
  campaignTitles: string[];
  invoiceUrl: string;
  brandColor?: string;
}

export function buildDonationPaidEmail(d: PaidEmailData) {
  const color = /^#[0-9a-f]{6}$/i.test(d.brandColor || '') ? d.brandColor! : '#83b64e';
  const date = d.paidAt.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' });
  const nominal = formatIDR(d.amount);
  const campaigns = d.campaignTitles.map((t) => `<li style="margin:2px 0">${esc(t)}</li>`).join('');

  const subject = `Terima kasih, donasi ${nominal} berhasil diterima`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden" cellpadding="0" cellspacing="0">
<tr><td style="background:${color};padding:24px;color:#fff;font-size:18px;font-weight:bold">${esc(d.ngoName)}</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;font-size:16px">Assalamu'alaikum <b>${esc(d.donorName)}</b>,</p>
<p style="margin:0 0 16px;line-height:1.6">Alhamdulillah, donasi Anda telah kami terima. Jazakumullahu khairan, semoga menjadi amal jariyah dan keberkahan untuk Anda dan keluarga.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:16px;font-size:14px">
<tr><td style="padding:4px 0;color:#6b7280">Nominal</td><td align="right" style="font-weight:bold">${nominal}</td></tr>
<tr><td style="padding:4px 0;color:#6b7280">Kode Invoice</td><td align="right">${esc(d.invoiceCode)}</td></tr>
<tr><td style="padding:4px 0;color:#6b7280">Metode</td><td align="right">${esc(d.paymentMethod)}</td></tr>
<tr><td style="padding:4px 0;color:#6b7280">Waktu</td><td align="right">${date} WIB</td></tr>
</table>
${campaigns ? `<p style="margin:16px 0 4px;font-size:14px;color:#6b7280">Program:</p><ul style="margin:0;padding-left:18px;font-size:14px">${campaigns}</ul>` : ''}
<p style="text-align:center;margin:24px 0 8px"><a href="${esc(d.invoiceUrl)}" style="background:${color};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;display:inline-block">Lihat Bukti Donasi</a></p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center">Email ini dikirim otomatis, mohon tidak membalas.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `Assalamu'alaikum ${d.donorName},\n\nDonasi ${nominal} (${d.invoiceCode}) via ${d.paymentMethod} telah kami terima pada ${date} WIB. Jazakumullahu khairan.\n\nBukti donasi: ${d.invoiceUrl}`;
  return { subject, html, text };
}
