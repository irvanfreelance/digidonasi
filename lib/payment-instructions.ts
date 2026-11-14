const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Manual-transfer account lives in payment_methods.code as "<rekening>|<atas nama>"
 * (or in invoices.va_number with the same format). Instructions can reference it with
 * {rekening} / {atas_nama} so the account is edited in exactly one place.
 */
export function parseManualAccount(...sources: Array<string | null | undefined>) {
  const src = sources.find((s) => s && s.includes('|'));
  if (!src) return null;
  const [rekening, ...rest] = src.split('|');
  return { rekening: rekening.trim(), atasNama: rest.join('|').trim() };
}

export function fillInstructionPlaceholders<T extends { content: string }>(
  instructions: T[],
  account: { rekening: string; atasNama: string } | null,
): T[] {
  if (!account) return instructions;
  return instructions.map((inst) => ({
    ...inst,
    content: inst.content
      .replace(/\{rekening\}/g, esc(account.rekening))
      .replace(/\{atas_nama\}/g, esc(account.atasNama)),
  }));
}
