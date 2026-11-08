import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import pg from "pg";
import { GET as startAuth } from "../app/api/auth/[audience]/route";
import { GET as history } from "../app/api/donasi/history/route";
import { GET as panelApi } from "../app/api/panel/[...path]/route";
import { POST as promo } from "../app/api/afiliasi/promosi/route";
import { GET as websiteApi } from "../app/api/website/[...path]/route";
import { gate } from "../lib/auth/access";
import { applySqlFile } from "../lib/db/run-sql";
import { STATE_COOKIE, safeNext } from "../lib/auth/doors";
import { AuthError, signInAffiliate, signInDonor, signInPanel, type Sql } from "../lib/auth/identity";
import { beginAuth, finishAuth } from "../lib/auth/flow";
import { openState, sealMock, sealSession, type Claims } from "../lib/auth/token";

const secret = "test-secret-value-32bytes-min";
const admin = { host: "127.0.0.1", port: 5433, user: "postgres", database: "postgres" };

function claims(partial: Partial<Claims> & Pick<Claims, "aud">): Claims {
  return {
    sub: "sub",
    email: "orang@example.com",
    name: "Orang Contoh",
    id: "1",
    exp: Date.now() + 60_000,
    ...partial,
  };
}

function jarOf(aud: Claims["aud"], extra: Record<string, string> = {}) {
  const token = sealSession(claims({ aud, role: aud === "panel" ? "SUPERADMIN" : undefined, status: aud === "affiliate" ? "ACTIVE" : undefined }), secret);
  const name = aud === "panel" ? "digidonasi.panel" : aud === "donor" ? "digidonasi.donor" : "digidonasi.affiliate";
  return { [name]: token, ...extra };
}

test("next, state, dan nonce yang tidak sah ditolak", async () => {
  const previous = { provider: process.env.AUTH_PROVIDER, secret: process.env.AUTH_SECRET };
  process.env.AUTH_PROVIDER = "mock";
  process.env.AUTH_SECRET = secret;
  try {
    assert.equal(safeNext("donor", "https://evil.example/masuk"), "/profil");
    assert.equal(safeNext("donor", "//panel"), "/profil");
    assert.equal(safeNext("donor", "/dashboard"), "/profil");
    assert.equal(safeNext("panel", "/profil"), "/dashboard");
    assert.equal(safeNext("affiliate", "/panel"), "/afiliasi");
    const started = beginAuth("donor", "/dashboard", "http://localhost:3000");
    assert.ok(!("error" in started));
    if ("error" in started) return;
    const saved = openState(started.stateToken, "donor", secret);
    assert.equal(saved?.next, "/profil");
    await assert.rejects(
      finishAuth({ aud: "donor", origin: "http://localhost:3000", state: "lain", code: "mock.x", stateToken: started.stateToken, sql: async () => [] }),
      (error: unknown) => error instanceof AuthError && error.code === "state_tidak_sah",
    );
    const code = sealMock({ aud: "donor", sub: "s", email: "a@example.com", name: "A", emailVerified: true, nonce: "bukan" }, secret);
    await assert.rejects(
      finishAuth({ aud: "donor", origin: "http://localhost:3000", state: saved?.state ?? "", code, stateToken: started.stateToken, sql: async () => [] }),
      (error: unknown) => error instanceof AuthError && error.code === "mock_tidak_sah",
    );
  } finally {
    process.env.AUTH_PROVIDER = previous.provider;
    process.env.AUTH_SECRET = previous.secret;
  }
});

test("matriks akses tidak saling membaca cookie", () => {
  const previous = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = secret;
  try {
    const donor = jarOf("donor");
    const editor = { "digidonasi.panel": sealSession(claims({ aud: "panel", role: "WEBSITE_EDITOR" }), secret) };
    const adminJar = jarOf("panel");
    assert.equal(gate("/dashboard", donor, false).kind, "redirect");
    assert.equal(gate("/api/panel/transaksi", donor, false).kind, "deny");
    assert.equal(gate("/affiliates", adminJar, false).kind, "allow");
    assert.equal(gate("/afiliasi", adminJar, false).kind, "redirect");
    assert.equal(gate("/api/afiliasi/promosi", jarOf("affiliate"), false).kind, "allow");
    const pending = { "digidonasi.affiliate": sealSession(claims({ aud: "affiliate", status: "PENDING" }), secret) };
    assert.equal((gate("/api/afiliasi/promosi", pending, false) as { status?: number }).status, 403);
    assert.equal(gate("/afiliasi", pending, false).kind, "allow");
    assert.equal((gate("/transactions", editor, true) as { status?: number }).status, 403);
    assert.equal((gate("/users", editor, true) as { status?: number }).status, 403);
    assert.equal((gate("/affiliates", editor, true) as { status?: number }).status, 403);
    assert.equal((gate("/website", editor, false) as { status?: number }).status, 404);
    assert.equal(gate("/website", editor, true).kind, "allow");
    assert.equal((gate("/api/website/pages", editor, false) as { status?: number }).status, 404);
    assert.equal(gate("/api/website/pages", editor, true).kind, "allow");
    assert.equal(gate("/dashboard", { crm_ui_session: "1" }, true).kind, "redirect");
    assert.equal(gate("/profil", adminJar, true).kind, "redirect");
  } finally {
    process.env.AUTH_SECRET = previous;
  }
});

test("handler menolak lintas pintu dan cookie lawas", async () => {
  const previous = { provider: process.env.AUTH_PROVIDER, secret: process.env.AUTH_SECRET, id: process.env.GOOGLE_CLIENT_ID, googleSecret: process.env.GOOGLE_CLIENT_SECRET };
  process.env.AUTH_PROVIDER = "mock";
  process.env.AUTH_SECRET = secret;
  try {
    const started = await startAuth(new Request("http://localhost/api/auth/donor?next=/dashboard"), { params: Promise.resolve({ audience: "donor" }) });
    assert.equal(started.status, 307);
    const setCookie = started.headers.get("set-cookie") || "";
    assert.match(setCookie, new RegExp(STATE_COOKIE.donor));
    assert.match(started.headers.get("location") || "", /\/masuk\?/);
    const donorCookie = `digidonasi.donor=${sealSession(claims({ aud: "donor" }), secret)}`;
    assert.equal((await history(new Request("http://localhost/api/donasi/history", { headers: { cookie: donorCookie } }))).status, 200);
    assert.equal((await panelApi(new Request("http://localhost/api/panel/transaksi", { headers: { cookie: donorCookie } }))).status, 401);
    assert.equal((await panelApi(new Request("http://localhost/api/panel/transaksi", { headers: { cookie: "crm_ui_session=1" } }))).status, 401);
    delete process.env.AUTH_PROVIDER;
    process.env.GOOGLE_CLIENT_ID = "client-contoh";
    process.env.GOOGLE_CLIENT_SECRET = "secret-contoh";
    const google = beginAuth("panel", "/profil", "http://localhost:3000");
    assert.ok(!("error" in google));
    if (!("error" in google)) {
      assert.match(google.location, /accounts\.google\.com/);
      assert.match(google.location, /nonce=/);
      assert.match(decodeURIComponent(google.location), /\/api\/auth\/admin\/callback/);
      const saved = openState(google.stateToken, "panel", secret);
      await assert.rejects(
        finishAuth({
          aud: "panel",
          origin: "http://localhost:3000",
          state: saved?.state ?? "",
          code: "kode-sampah",
          stateToken: google.stateToken,
          sql: async () => [],
          fetchImpl: async () => new Response("tidak", { status: 400 }),
        }),
        (error: unknown) => error instanceof AuthError && error.code === "google_token_ditolak",
      );
    }
  } finally {
    process.env.AUTH_PROVIDER = previous.provider;
    process.env.AUTH_SECRET = previous.secret;
    process.env.GOOGLE_CLIENT_ID = previous.id;
    process.env.GOOGLE_CLIENT_SECRET = previous.googleSecret;
  }
});

test("website dan promosi mengikuti env serta status", async () => {
  const previous = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = secret;
  try {
    const editor = `digidonasi.panel=${sealSession(claims({ aud: "panel", role: "WEBSITE_EDITOR" }), secret)}`;
    const off = await websiteApi(new Request("http://localhost/api/website/pages", { headers: { cookie: editor } }));
    assert.equal(off.status, 404);
    process.env.WEBSITE_ENABLED = "true";
    const on = await websiteApi(new Request("http://localhost/api/website/pages", { headers: { cookie: editor } }));
    assert.equal(on.status, 501);
    const pending = `digidonasi.affiliate=${sealSession(claims({ aud: "affiliate", status: "PENDING" }), secret)}`;
    const blocked = await promo(new Request("http://localhost/api/afiliasi/promosi", { method: "POST", headers: { cookie: pending } }));
    assert.equal(blocked.status, 403);
    const active = `digidonasi.affiliate=${sealSession(claims({ aud: "affiliate", status: "ACTIVE" }), secret)}`;
    const opened = await promo(new Request("http://localhost/api/afiliasi/promosi", { method: "POST", headers: { cookie: active } }));
    assert.equal(opened.status, 501);
  } finally {
    delete process.env.WEBSITE_ENABLED;
    process.env.AUTH_SECRET = previous;
  }
});

test("identitas tiga audiens tidak saling membuat baris", async () => {
  const client = new pg.Client(admin);
  await client.connect();
  await client.query("DROP DATABASE IF EXISTS digidonasi_auth");
  await client.query("CREATE DATABASE digidonasi_auth");
  await client.end();
  const db = new pg.Client({ ...admin, database: "digidonasi_auth" });
  await db.connect();
  await db.query("BEGIN");
  await applySqlFile(db, join(process.cwd(), "lib/db/migrations/0000_foundation.sql"));
  await applySqlFile(db, join(process.cwd(), "drizzle/seed.sql"));
  await db.query("COMMIT");
  const sql: Sql = async (text, params) => (await db.query(text, params)).rows;
  const profile = { sub: "sub-sama", email: "sama@example.com", name: "Sama Contoh", emailVerified: true };
  await db.query(
    `INSERT INTO users (nama, email, role, is_active) VALUES ('Admin Contoh', 'sama@example.com', 'SUPERADMIN', true)`,
  );
  await signInPanel(sql, profile, false);
  await signInDonor(sql, profile);
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM users")).rows[0].n), 1);
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM donors")).rows[0].n), 1);
  assert.equal(Number((await db.query("SELECT count(*)::int AS n FROM affiliates")).rows[0].n), 0);
  await signInAffiliate(sql, { ...profile, sub: "sub-afiliasi", email: "afiliasi@example.com" });
  const affiliate = await db.query("SELECT status, google_sub FROM affiliates WHERE email = 'afiliasi@example.com'");
  assert.equal(affiliate.rows[0].status, "PENDING");
  await db.query("UPDATE affiliates SET status = 'SUSPENDED' WHERE email = 'afiliasi@example.com'");
  const again = await signInAffiliate(sql, { ...profile, sub: "sub-afiliasi", email: "afiliasi@example.com" });
  assert.equal(again.status, "SUSPENDED");
  assert.equal((await db.query("SELECT google_sub FROM affiliates WHERE email = 'afiliasi@example.com'")).rows[0].google_sub, "sub-afiliasi");
  await assert.rejects(signInPanel(sql, { ...profile, sub: "editor", email: "editor@example.com" }, false));
  await db.query(
    `INSERT INTO users (nama, email, role, is_active) VALUES ('Editor Contoh', 'editor@example.com', 'WEBSITE_EDITOR', true)`,
  );
  await assert.rejects(signInPanel(sql, { sub: "editor", email: "editor@example.com", name: "Editor", emailVerified: true }, false), (error: unknown) => error instanceof AuthError && error.code === "editor_website_mati");
  const method = await db.query("SELECT id FROM payment_methods LIMIT 1");
  await db.query("BEGIN");
  const invoice = await db.query(
    `INSERT INTO invoices (invoice_code, payment_method_id, donor_name_snapshot, donor_email, base_amount, admin_fee, total_amount)
     VALUES ('T-GUEST', $1, 'Tamu', 'tamu@example.com', 1000, 0, 1000) RETURNING id`,
    [method.rows[0].id],
  );
  const campaign = await db.query("SELECT id FROM campaigns LIMIT 1");
  await db.query("INSERT INTO transactions (invoice_id, campaign_id, amount) VALUES ($1, $2, 1000)", [invoice.rows[0].id, campaign.rows[0].id]);
  await db.query("COMMIT");
  await signInDonor(sql, { sub: "sub-tamu", email: "tamu@example.com", name: "Tamu", emailVerified: true });
  const claimed = await db.query("SELECT donor_id FROM invoices WHERE invoice_code = 'T-GUEST'");
  assert.equal(claimed.rows[0].donor_id, null);
  await db.end();
});
