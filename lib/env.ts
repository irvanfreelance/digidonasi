import { z } from "zod";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  WEBSITE_ENABLED: z.string().optional(),
  ORG_NAME: z.string().min(1).optional(),
  ORG_SHORT_NAME: z.string().min(1).max(40).optional(),
  ORG_TAGLINE: z.string().max(200).optional(),
  ORG_PRIMARY_COLOR: hex.optional(),
  ORG_SIDEBAR_COLOR: hex.optional(),
  ORG_ACCENT_COLOR: hex.optional(),
  PUBLIC_DOMAIN: z.string().min(1).optional(),
  BOOTSTRAP_ADMIN_OPT_IN: z.enum(["true", "false"]).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error("ENV tidak valid. Periksa .env.example.");
  }
  if (parsed.data.DATABASE_URL && /darul|hikam/i.test(parsed.data.DATABASE_URL)) {
    throw new Error("DATABASE_URL ditolak.");
  }
  return parsed.data;
}

/** Hanya persis "true". Bukan toggle basis dan bukan "1" atau "TRUE". */
export function websiteEnabled(source: Record<string, string | undefined> = process.env) {
  return source.WEBSITE_ENABLED === "true";
}

export const WEBSITE_PATHS = [
  "/tentang-kami",
  "/layanan-ziswaf",
  "/transparansi",
  "/kabar-kebaikan",
  "/news",
  "/kontak",
  "/program",
] as const;

export function isWebsitePath(pathname: string) {
  return WEBSITE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
