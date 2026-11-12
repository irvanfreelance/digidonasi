import Image from "next/image";
import Link from "next/link";

export type CampaignCardData = {
  slug: string;
  title: string;
  image_url?: string | null;
  image_alt?: string | null;
  category?: string | null;
  collected_amount?: string | number | null;
  donor_count?: string | number | null;
  target_amount?: string | number | null;
  end_date?: string | Date | null;
  has_no_target?: boolean | null;
  has_no_time_limit?: boolean | null;
};

export function rupiah(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number.isFinite(amount) ? amount : 0,
  );
}

export function progressPercent(collected: number, target: number | null, noTarget: boolean) {
  if (noTarget || !target || target <= 0) return null;
  return Math.min(100, Math.round((collected / target) * 100));
}

export function daysRemaining(end: string | Date | null | undefined, noLimit: boolean, now = Date.now()) {
  if (noLimit || !end) return null;
  const endMs = new Date(end).getTime();
  if (Number.isNaN(endMs)) return null;
  return Math.max(0, Math.ceil((endMs - now) / 86_400_000));
}

function asCard(row: Record<string, unknown>): CampaignCardData {
  return row as CampaignCardData;
}

export function CampaignArt({ row, className }: { row: CampaignCardData; className: string }) {
  const src = row.image_url || "";
  if (src.startsWith("/")) {
    return (
      <span className={`${className} relative block overflow-hidden`}>
        <Image src={src} alt={row.image_alt || ""} fill className="object-cover" sizes="(max-width: 768px) 90vw, 320px" />
      </span>
    );
  }
  if (/^https?:\/\//.test(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={row.image_alt || ""} className={`${className} object-cover`} />
    );
  }
  const letter = (row.category || row.title || "D").slice(0, 1).toUpperCase();
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800 text-2xl font-bold text-white`} aria-hidden>
      {letter}
    </div>
  );
}

export function CampaignListCard({ row }: { row: Record<string, unknown> }) {
  const card = asCard(row);
  const collected = Number(card.collected_amount ?? 0);
  const target = card.target_amount == null ? null : Number(card.target_amount);
  const percent = progressPercent(collected, target, Boolean(card.has_no_target));
  const days = daysRemaining(card.end_date, Boolean(card.has_no_time_limit));
  return (
    <Link href={`/donasi/${card.slug}`} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm active:scale-[0.98]">
      <CampaignArt row={card} className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wide text-teal-600">{card.category}</div>
        <div className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-gray-900">{card.title}</div>
        <div className="mt-1 text-xs text-gray-500">
          {rupiah(collected)}
          {Number(card.donor_count) > 0 ? ` · ${Number(card.donor_count).toLocaleString("id-ID")} donatur` : ""}
        </div>
        {percent == null ? (
          <div className="mt-2 text-[10px] font-semibold text-teal-700">Tanpa target</div>
        ) : (
          <div className="mt-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-bold text-teal-700">
              <span>{days == null ? "Tanpa batas" : `Sisa ${days} hari`}</span>
              <span>{percent}%</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

const MARKDOWN_IMAGE = /!\[([^\]]*)\]\(([^)]+)\)/g;

export function RichCopy({ text }: { text: string }) {
  const images: { alt: string; src: string }[] = [];
  const plain = text.replace(MARKDOWN_IMAGE, (_match, alt: string, src: string) => {
    if (src.startsWith("/")) images.push({ alt, src });
    return "";
  });
  return (
    <>
      {images.map((image) => (
        <Image key={image.src} src={image.src} alt={image.alt} width={1200} height={800} className="mt-2 h-36 w-full rounded-xl object-cover" />
      ))}
      <p className="mb-0 whitespace-pre-line">{plain.trim()}</p>
    </>
  );
}

export function UrgentCard({ row }: { row: Record<string, unknown> }) {
  const card = asCard(row);
  const collected = Number(card.collected_amount ?? 0);
  const target = card.target_amount == null ? null : Number(card.target_amount);
  const percent = progressPercent(collected, target, Boolean(card.has_no_target));
  const days = daysRemaining(card.end_date, Boolean(card.has_no_time_limit));
  return (
    <Link href={`/donasi/${card.slug}`} className="w-[75%] shrink-0 snap-center overflow-hidden rounded-2xl border border-rose-50 bg-white shadow-sm active:scale-95">
      <CampaignArt row={card} className="h-24 w-full" />
      <div className="p-3">
        <div className="text-[10px] font-bold uppercase text-rose-500">{days == null ? "Tanpa batas" : `Sisa ${days} hari`}</div>
        <div className="mt-1 line-clamp-2 text-sm font-bold leading-tight">{card.title}</div>
        <div className="mt-1 text-xs text-gray-500">{rupiah(collected)}</div>
        {percent != null ? <div className="mt-1 text-right text-[10px] font-bold text-teal-700">{percent}%</div> : null}
      </div>
    </Link>
  );
}
