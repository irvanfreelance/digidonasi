import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getPanelSession } from "../lib/auth/panel-session";
import { panelAllows } from "../lib/auth/rbac";
import { isWebsitePath, readEnv, websiteEnabled } from "../lib/env";
import { navForRole } from "../lib/nav";

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

test("website hanya hidup pada string true", () => {
  assert.equal(websiteEnabled({ WEBSITE_ENABLED: "true" }), true);
  assert.equal(websiteEnabled({ WEBSITE_ENABLED: "TRUE" }), false);
  assert.equal(websiteEnabled({ WEBSITE_ENABLED: "1" }), false);
  assert.equal(websiteEnabled({}), false);
  assert.equal(isWebsitePath("/news"), true);
  assert.equal(isWebsitePath("/donasi"), false);
});

test("env menolak nama basis terlarang", () => {
  assert.throws(() => readEnv({ DATABASE_URL: "postgresql://localhost/darulhikam" }));
  assert.doesNotThrow(() => readEnv({ WEBSITE_ENABLED: "false", ORG_PRIMARY_COLOR: "#01665e" }));
});

test("sesi panel hari 1 kosong", async () => {
  assert.equal(await getPanelSession(), null);
});

test("editor tidak membuka transaksi dan mati bersama website", () => {
  assert.equal(panelAllows("WEBSITE_EDITOR", "website"), false);
  assert.equal(panelAllows("SUPERADMIN", "transaksi"), true);
  assert.equal(navForRole("WEBSITE_EDITOR", false).length, 0);
  assert.equal(navForRole("WEBSITE_EDITOR", true)[0]?.items[0]?.href, "/website");
  assert.equal(navForRole("SUPERADMIN", false).some((group) => group.group === "Website"), false);
});

test("kode tidak memulihkan cookie sesi CRM", () => {
  const root = join(import.meta.dirname, "..");
  const needle = ["crm", "ui", "session"].join("_");
  const hits = walk(root).filter((path) => !path.includes(`${root}/tests/`) && readFileSync(path, "utf8").includes(needle));
  assert.deepEqual(hits, []);
});
