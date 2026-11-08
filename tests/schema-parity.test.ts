import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(import.meta.dirname, "..");
const migration = readFileSync(join(root, "lib/db/migrations/0000_foundation.sql"), "utf8");
const mirror = readFileSync(join(root, "drizzle/schema.ts"), "utf8");

function sqlTables(sql: string) {
  const tables = new Map<string, string[]>();
  const blocks = sql.matchAll(/CREATE TABLE IF NOT EXISTS ([a-z_]+) \(([\s\S]*?)\n\);/g);
  for (const match of blocks) {
    const columns: string[] = [];
    for (const raw of match[2].split("\n")) {
      const line = raw.trim().replace(/,$/, "");
      if (!line || /^(CHECK|UNIQUE|PRIMARY|CONSTRAINT|OR |AND |\()/.test(line)) continue;
      const found = line.match(/^([a-z_][a-z0-9_]*)\s+[A-Za-z]/);
      if (found) columns.push(found[1]);
    }
    tables.set(match[1], columns);
  }
  return tables;
}

function mirrorTables(source: string) {
  const tables = new Map<string, string[]>();
  const blocks = source.matchAll(/pgTable\("([a-z_]+)", \{([\s\S]*?)\n\}/g);
  for (const match of blocks) {
    const columns = [...match[2].matchAll(/^\s+\w+:\s+\w+\("([a-z0-9_]+)"/gm)].map((item) => item[1]);
    tables.set(match[1], columns);
  }
  return tables;
}

test("cermin Drizzle memuat setiap tabel dan kolom migrasi", () => {
  const sql = sqlTables(migration);
  const drizzle = mirrorTables(mirror);
  assert.equal(sql.size, 50);
  assert.deepEqual([...drizzle.keys()].sort(), [...sql.keys()].sort());
  for (const [table, columns] of sql) {
    assert.deepEqual(drizzle.get(table), columns, table);
  }
});

test("konfigurasi Drizzle tidak menimpa berkas migrasi", () => {
  const config = readFileSync(join(root, "drizzle.config.ts"), "utf8");
  assert.match(config, /out:\s*"\.\/drizzle\/kit"/);
  assert.doesNotMatch(config, /lib\/db\/migrations/);
  const pkg = readFileSync(join(root, "package.json"), "utf8");
  assert.equal(pkg.includes("drizzle-kit push"), false);
  assert.equal(pkg.includes("drizzle-kit generate"), false);
});
