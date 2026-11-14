export function websiteEnabled(): boolean {
  return process.env.WEBSITE_ENABLED === "true";
}

