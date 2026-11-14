type Partner = {
  name: string;
  logo_url: string | null;
  website_url: string | null;
};

export default function PartnersCarousel({ partners }: { partners: Partner[] }) {
  const logos = partners.filter((p) => p.logo_url);
  if (logos.length === 0) return null;

  const track = [...logos, ...logos];

  return (
    <div
      className="relative overflow-hidden"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
    >
      <div className="flex w-max items-center gap-14 animate-marquee hover:[animation-play-state:paused]">
        {track.map((p, i) => {
          const img = (
            <img
              src={p.logo_url as string}
              alt={p.name}
              title={p.name}
              className="h-20 w-20 md:h-24 md:w-24 scale-125 object-contain opacity-90 transition hover:opacity-100 hover:scale-150"
            />
          );
          return (
            <div key={`${p.name}-${i}`} className="shrink-0">
              {p.website_url ? (
                <a href={p.website_url} target="_blank" rel="noopener noreferrer">
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
