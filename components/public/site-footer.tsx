import type { OrgProfile } from "@/types/org";

export function SiteFooter({ org }: { org: OrgProfile }) {
  return (
    <footer className="mt-8 border-t border-gray-100 px-5 py-6 text-[12px] leading-relaxed text-gray-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={org.logo_url || "/brand/logo.svg"} alt="" className="h-8 w-auto" />
      <div className="mt-2 font-bold text-[#0A3F34]">{org.nama}</div>
      <p className="mt-1 mb-0">{org.tagline}</p>
      {org.address ? <p className="mt-2 mb-0">{org.address}</p> : null}
      {org.public_email ? <p className="mt-1 mb-0">{org.public_email}</p> : null}
      <div className="mt-2 flex gap-3 font-semibold text-[#0E6B56]">
        {org.instagram_url ? <a href={org.instagram_url}>Instagram</a> : null}
        {org.facebook_url ? <a href={org.facebook_url}>Facebook</a> : null}
      </div>
      <p className="mt-3 mb-0">© {new Date().getFullYear()} {org.nama}</p>
    </footer>
  );
}
