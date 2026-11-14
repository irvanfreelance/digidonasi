import { query } from './db';
import { redis } from './redis';

// --- Home Page ---

export async function getWebHeroConfig() {
  const cacheKey = `web:hero_config`;
  let data: any = await redis.get(cacheKey);
  if (!data) {
    const rows = await query(`SELECT ngo_name, video_url, primary_color FROM ngo_configs LIMIT 1`);
    data = rows[0] || null;
    await redis.set(cacheKey, JSON.stringify(data), { ex: 60 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebImpactMetrics() {
  const cacheKey = `web:impact_metrics`;
  let data = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT metric_key, label, value, suffix
      FROM web_impact_metrics
      WHERE is_active = true
      ORDER BY display_order ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 300 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebImpactCategories() {
  const cacheKey = `web:impact_categories`;
  let data = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT icon_url, label, value, suffix
      FROM web_impact_categories
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 300 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebDistributionPoints() {
  const cacheKey = `web:distribution_points`;
  let data = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT id, name, type, latitude, longitude, description
      FROM web_distribution_points
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 300 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebTestimonials() {
  const cacheKey = `web:testimonials`;
  let data = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT person_name, person_role, person_type, initials, quote, avatar_url
      FROM web_testimonials
      WHERE is_active = true
      ORDER BY display_order ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 300 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebPartners() {
  const cacheKey = `web:partners`;
  let data = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT name, logo_url, website_url, partner_type
      FROM web_partners
      WHERE is_active = true
      ORDER BY display_order ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebCareCategories() {
  const cacheKey = `web:care_categories`;
  let data = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT icon_name, icon_url, label, quote_text, quote_source, description, photo_url
      FROM web_care_categories
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getLatestArticles(limit = 24) {
  const data = await query(`
    SELECT a.slug, a.title, a.title_long, a.excerpt, a.featured_image_url, a.published_at, a.created_at, a.category_id,
           c.name as category_name, c.slug as category_slug
    FROM web_articles a
    LEFT JOIN web_article_categories c ON a.category_id = c.id
    WHERE a.status = 'published' AND a.deleted_at IS NULL
    ORDER BY COALESCE(a.published_at, a.created_at) DESC
    LIMIT $1
  `, [limit]);
  return data;
}

export async function getWebArticleCategories() {
  try {
    const data = await query(`
      SELECT id, name, slug
      FROM web_article_categories
      ORDER BY id ASC
    `);
    return data;
  } catch (e) {
    return [];
  }
}

// --- Tentang Kami ---

export async function getWebTeamMembers() {
  const data = await query(`
    SELECT name, title, department, initials, avatar_url, bio, accent_color
    FROM web_team_members
    WHERE is_active = true
    ORDER BY display_order ASC
  `);
  return data;
}

export async function getWebBankAccounts() {
  const cacheKey = `web:bank_accounts`;
  let data: any = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT bank_name, account_number, account_name, bank_code, logo_url
      FROM web_bank_accounts
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 300 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebLegality() {
  // Can be hardcoded or retrieved from ngo_configs if applicable
  const data = await query(`SELECT * FROM ngo_configs LIMIT 1`);
  return data[0];
}

export async function getWebAboutContent() {
  const cacheKey = `web:about_content`;
  let data: any = await redis.get(cacheKey);
  if (!data) {
    const rows = await query(`SELECT * FROM web_about_content LIMIT 1`);
    data = rows[0] || null;
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebHistoryTimeline() {
  const cacheKey = `web:history_timeline`;
  let data: any = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT year, description
      FROM web_history_timeline
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebMissionPoints() {
  const cacheKey = `web:mission_points`;
  let data: any = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT content
      FROM web_mission_points
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

export async function getWebLegalDocuments() {
  const cacheKey = `web:legality`;
  let data: any = await redis.get(cacheKey);
  if (!data) {
    data = await query(`
      SELECT title, document_number, issued_by
      FROM web_legality
      WHERE is_active = true
      ORDER BY display_order ASC, id ASC
    `);
    await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });
  } else if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  return data;
}

// --- Transparansi ---

export async function getWebFinancialReports() {
  const data = await query(`
    SELECT id, title, report_type, period_label, period_year, audit_status, file_url, file_size_kb
    FROM web_financial_reports
    WHERE is_published = true
    ORDER BY period_year DESC, period_quarter DESC NULLS LAST, created_at DESC
  `);
  return data;
}

export async function getWebFundAllocations(year: number) {
  const data = await query(`
    SELECT wfa.period_month, wfa.allocated_amount, wfa.disbursed_amount, c.title as program_name, cat.color_theme
    FROM web_fund_allocations wfa
    JOIN campaigns c ON wfa.program_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE wfa.period_year = $1
    ORDER BY wfa.period_month ASC
  `, [year]);
  return data;
}

// --- Kontak & FAQs ---

export async function getWebFaqs() {
  const data = await query(`
    SELECT question, answer, category
    FROM web_faqs
    WHERE is_active = true
    ORDER BY display_order ASC
  `);
  return data;
}

export async function getArticleBySlug(slug: string) {
  const data = await query(`
    SELECT a.slug, a.title, a.title_long, a.body, a.excerpt, a.featured_image_url, a.published_at, a.created_at, a.category_id, a.seo_title, a.seo_description,
           c.name as category_name, c.slug as category_slug
    FROM web_articles a
    LEFT JOIN web_article_categories c ON a.category_id = c.id
    WHERE a.slug = $1 AND a.status = 'published' AND a.deleted_at IS NULL
    LIMIT 1
  `, [slug]);
  return data[0];
}

export async function getRelatedArticles(categoryId: number | null, excludeSlug: string, limit = 3) {
  const data = await query(`
    SELECT a.slug, a.title, a.title_long, a.excerpt, a.featured_image_url, a.published_at, a.created_at, a.category_id,
           c.name as category_name, c.slug as category_slug
    FROM web_articles a
    LEFT JOIN web_article_categories c ON a.category_id = c.id
    WHERE a.status = 'published' AND a.deleted_at IS NULL AND a.slug != $1
    ORDER BY (a.category_id = $2) DESC, COALESCE(a.published_at, a.created_at) DESC
    LIMIT $3
  `, [excludeSlug, categoryId, limit]);
  return data;
}
