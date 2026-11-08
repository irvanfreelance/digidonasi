import { defineConfig } from "drizzle-kit";

/**
 * Bukan jalan pemasangan. npm run db:migrate menjalankan SQL.
 * Keluaran kit terpisah supaya generate tidak menimpa atau menghapus tabel domain.
 */
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/kit",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:1/unused",
  },
});
