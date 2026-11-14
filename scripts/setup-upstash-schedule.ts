/**
 * Setup Upstash QStash Schedule for notification retry cron.
 * Idempotent: checks existing schedules before creating.
 * Run once after deploy: npm run setup:schedule
 */
import { Client } from '@upstash/qstash';
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const CRON_EXPR = '*/15 * * * *';
const TARGET_PATH = '/api/cron/retry-notifications';

async function main() {
  if (!QSTASH_TOKEN) {
    console.error('❌ QSTASH_TOKEN is not set.');
    process.exit(1);
  }
  if (!BASE_URL) {
    console.error('❌ NEXT_PUBLIC_BASE_URL is not set.');
    process.exit(1);
  }

  const targetUrl = `${BASE_URL}${TARGET_PATH}`;
  console.log(`⏳ Setting up Upstash QStash Schedule for: ${targetUrl}`);

  const client = new Client({ token: QSTASH_TOKEN });

  // List existing schedules to check idempotency
  const schedules = await client.schedules.list();
  const existing = schedules.find((s: any) => s.destination === targetUrl);

  if (existing) {
    console.log(`✅ Schedule already exists (id: ${existing.scheduleId}). No action needed.`);
    console.log(`   Cron: ${existing.cron}`);
    console.log(`   Destination: ${existing.destination}`);
    return;
  }

  const result = await client.schedules.create({
    destination: targetUrl,
    cron: CRON_EXPR,
  });

  console.log(`✅ Schedule created successfully!`);
  console.log(`   Schedule ID: ${result.scheduleId}`);
  console.log(`   Cron: ${CRON_EXPR} (every 15 minutes)`);
  console.log(`   Target: ${targetUrl}`);
}

main().catch((err) => {
  console.error('❌ Setup failed:', err.message || err);
  process.exit(1);
});
