import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL wajib untuk db:seed");

  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. ngo_configs (identitas lembaga white-label default)
    const { rows: ngoRows } = await client.query("SELECT id FROM ngo_configs LIMIT 1");
    if (ngoRows.length === 0) {
      await client.query(
        `INSERT INTO ngo_configs (
          ngo_name, short_description, address, legal_info, primary_color,
          whatsapp_number, email, office_hours, jejak_kebaikan_title, jejak_kebaikan_subtitle
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          "Platform Donasi & Kebaikan",
          "Lembaga filantropi digital yang menghimpun dan menyalurkan dana zakat, infak, sedekah, wakaf, dan kemanusiaan secara transparan.",
          "Jl. Kebaikan Raya No. 18, Bandung",
          "Terdaftar resmi & diaudit berkala.",
          "#1086b1",
          "6281234567890",
          "halo@platformdonasi.example",
          "Senin - Jumat, 08.00 - 17.00 WIB",
          "Jejak Kebaikan",
          "Dampak nyata dari setiap donasi yang Anda titipkan",
        ]
      );
    }

    // 2. pixel_events
    await client.query(`
      INSERT INTO pixel_events (screen_name, meta_event, tiktok_event, google_event, is_active)
      VALUES
        ('page_view', 'PageView', 'PageView', 'page_view', true),
        ('checkout_amount', 'ViewContent', 'ViewContent', 'view_item', true),
        ('checkout_profile', 'InitiateCheckout', 'InitiateCheckout', 'begin_checkout', true),
        ('checkout_payment', 'AddPaymentInfo', 'AddPaymentInfo', 'add_payment_info', true),
        ('purchase_success', 'Purchase', 'CompletePayment', 'purchase', true)
      ON CONFLICT (screen_name) DO NOTHING
    `);

    // 3. categories
    const { rows: catRows } = await client.query("SELECT id, name FROM categories ORDER BY id ASC");
    let catMap: Record<string, number> = {};
    if (catRows.length === 0) {
      const inserted = await client.query(`
        INSERT INTO categories (name, color_theme, icon_name, is_active, display_order)
        VALUES
          ('Zakat', 'emerald', 'Coins', true, 1),
          ('Infaq', 'indigo', 'HeartHandshake', true, 2),
          ('Sedekah', 'teal', 'Heart', true, 3),
          ('Pendidikan', 'blue', 'GraduationCap', true, 4),
          ('Kemanusiaan', 'orange', 'LifeBuoy', true, 5),
          ('Kesehatan', 'rose', 'Stethoscope', true, 6),
          ('Qurban', 'amber', 'Gift', true, 7),
          ('Wakaf', 'cyan', 'Building2', true, 8)
        RETURNING id, name
      `);
      for (const r of inserted.rows) catMap[r.name] = r.id;
    } else {
      for (const r of catRows) catMap[r.name] = r.id;
    }

    // 4. payment_methods
    const { rows: pmRows } = await client.query("SELECT id FROM payment_methods LIMIT 1");
    if (pmRows.length === 0) {
      await client.query(`
        INSERT INTO payment_methods (code, name, type, provider, admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order, sort)
        VALUES
          ('QR_CODE', 'QRIS (Semua E-Wallet & Mobile Banking)', 'qr_code', 'Xendit', 0, 0.70, true, false, 1, 1),
          ('BSI', 'BSI Virtual Account', 'va', 'Xendit', 4000, 0, true, false, 2, 2),
          ('BCA', 'BCA Virtual Account', 'va', 'Xendit', 4000, 0, true, false, 3, 3),
          ('MANDIRI', 'Mandiri Virtual Account', 'va', 'Xendit', 4000, 0, true, false, 4, 4),
          ('GOPAY', 'GoPay', 'E-Wallet', 'Midtrans', 0, 2.00, true, true, 5, 5),
          ('DANA', 'DANA', 'E-Wallet', 'Xendit', 0, 1.50, true, true, 6, 6)
      `);
    }

    // 5. notification_templates
    await client.query(`
      INSERT INTO notification_templates (event_trigger, channel, subject, message_content, is_active)
      VALUES
        ('DONATION_SUCCESS', 'WHATSAPP', 'Terima Kasih atas Donasi Anda', 'Terima kasih {nama}, donasi Rp {nominal} via {metode} berhasil kami terima. Semoga membawa keberkahan.', true),
        ('INVOICE_PENDING', 'WHATSAPP', 'Menunggu Pembayaran Donasi', 'Halo {nama}, tagihan donasi Rp {nominal} menunggu pembayaran. Silakan selesaikan pembayaran melalui {metode} ({va_number}).', true)
      ON CONFLICT (event_trigger) DO NOTHING
    `);

    // 6. campaigns + campaign_stats + campaign_variants + campaign_updates
    const { rows: campCount } = await client.query("SELECT id FROM campaigns LIMIT 1");
    if (campCount.length === 0) {
      const campaignsData = [
        {
          slug: "beasiswa-santri-yatim-berprestasi",
          title: "Beasiswa Pendidikan Santri Yatim & Dhuafa",
          cat: "Pendidikan",
          banner: "/seed/kampanye/pendidikan.webp",
          target: 150000000,
          collected: 87500000,
          donors: 312,
          featured: true,
          urgent: false,
          desc: "<p>Bantu wujudkan mimpi anak-anak yatim dan dhuafa untuk tetap bersekolah dan menghafal Al-Qur'an tanpa terbebani biaya pendidikan.</p>",
        },
        {
          slug: "bantuan-pangan-keluarga-prasejahtera",
          title: "Paket Pangan Bergizi untuk Keluarga Prasejahtera",
          cat: "Sedekah",
          banner: "/seed/kampanye/pangan.webp",
          target: 100000000,
          collected: 64200000,
          donors: 245,
          featured: true,
          urgent: true,
          desc: "<p>Setiap paket pangan berisi beras, minyak goreng, telur, dan bahan pokok lainnya untuk mencukupi kebutuhan keluarga selama satu bulan.</p>",
        },
        {
          slug: "layanan-kesehatan-keliling-gratis",
          title: "Klinik & Layanan Kesehatan Keliling Gratis",
          cat: "Kesehatan",
          banner: "/seed/kampanye/kesehatan.webp",
          target: 200000000,
          collected: 112000000,
          donors: 198,
          featured: true,
          urgent: true,
          desc: "<p>Menghadirkan pemeriksaan kesehatan, obat-obatan, dan ambulans gratis bagi warga pelosok yang sulit mengakses fasilitas kesehatan.</p>",
        },
        {
          slug: "tanggap-darurat-bencana-alam",
          title: "Tanggap Darurat & Pemulihan Bencana Alam",
          cat: "Kemanusiaan",
          banner: "/seed/kampanye/bencana.webp",
          target: 250000000,
          collected: 145000000,
          donors: 420,
          featured: true,
          urgent: true,
          desc: "<p>Penyaluran logistik cepat, tenda darurat, air bersih, dan dapur umum bagi penyintas bencana di wilayah terdampak.</p>",
        },
        {
          slug: "tunaikan-zakat-maal-profesi",
          title: "Tunaikan Zakat Maal & Zakat Profesi",
          cat: "Zakat",
          banner: "/seed/kampanye/zakat.webp",
          target: 500000000,
          collected: 325000000,
          donors: 180,
          featured: false,
          urgent: false,
          desc: "<p>Sucikan harta dan raih keberkahan dengan menunaikan zakat maal & profesi yang disalurkan tepat sasaran kepada 8 asnaf.</p>",
        },
        {
          slug: "wakaf-sumur-air-bersih-pelosok",
          title: "Wakaf Sumur Air Bersih untuk Daerah Kekeringan",
          cat: "Wakaf",
          banner: "/seed/kampanye/wakaf.webp",
          target: 180000000,
          collected: 95000000,
          donors: 154,
          featured: false,
          urgent: false,
          desc: "<p>Alirkan pahala jariyah tanpa henti melalui pembangunan sumur bor dan instalasi air bersih bagi desa yang mengalami krisis air.</p>",
        },
      ];

      for (let i = 0; i < campaignsData.length; i++) {
        const c = campaignsData[i];
        const catId = catMap[c.cat] ?? Object.values(catMap)[0] ?? null;
        const { rows: ins } = await client.query(
          `INSERT INTO campaigns (slug, title, category_id, image_url, target_amount, description, status, is_carousel, is_urgent, sort)
           VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8, $9)
           RETURNING id`,
          [c.slug, c.title, catId, c.banner, c.target, c.desc, c.featured, c.urgent, i + 1]
        );
        const campaignId = ins[0].id;
        await client.query(
          `INSERT INTO campaign_stats (campaign_id, collected_amount, donor_count)
           VALUES ($1, $2, $3)
           ON CONFLICT (campaign_id) DO NOTHING`,
          [campaignId, c.collected, c.donors]
        );
        await client.query(
          `INSERT INTO campaign_variants (campaign_id, name, price)
           VALUES ($1, 'Paket Kebaikan', 50000), ($1, 'Paket Berkah', 100000), ($1, 'Paket Mulia', 250000)`,
          [campaignId]
        );
        await client.query(
          `INSERT INTO campaign_updates (campaign_id, title, content, image_url)
           VALUES ($1, $2, $3, $4)`,
          [
            campaignId,
            "Penyaluran Tahap Awal Telah Dilaksanakan",
            "<p>Alhamdulillah, amanah dari para donatur telah kami salurkan kepada penerima manfaat yang berhak. Terima kasih atas kepercayaan Anda.</p>",
            "/seed/kabar/pangan.webp",
          ]
        );
      }
    }

    // 7. Contoh afiliasi untuk uji portal /afiliasi
    await client.query(`
      INSERT INTO affiliates (affiliate_code, name, email, phone, balance, status)
      VALUES ('BERKAH01', 'Budi Marketer', 'budi.affiliate@example.com', '081234567890', 1250000, 'ACTIVE')
      ON CONFLICT (affiliate_code) DO NOTHING
    `);

    // 8. Website CMS data (web_*)
    const { rows: aboutRows } = await client.query("SELECT id FROM web_about_content LIMIT 1");
    if (aboutRows.length === 0) {
      await client.query(
        `INSERT INTO web_about_content (hero_title, hero_subtitle, sejarah_heading, sejarah_paragraph_1, sejarah_paragraph_2, visi_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          "Mengalirkan Kebaikan, Memberdayakan Umat",
          "Platform penghimpunan dan penyaluran dana sosial yang amanah, profesional, dan transparan.",
          "Perjalanan Kami",
          "Berawal dari kepedulian terhadap kesenjangan akses pendidikan dan kesehatan, kami membangun ekosistem kebaikan yang mempertemukan para dermawan dengan penerima manfaat.",
          "Dengan dukungan teknologi dan tata kelola yang akuntabel, setiap rupiah donasi dapat dipantau dampaknya secara nyata.",
          "Menjadi lembaga filantropi terpercaya yang menghadirkan kemandirian dan keberkahan bagi masyarakat luas.",
        ]
      );
    }

    const { rows: artCatRows } = await client.query("SELECT id FROM web_article_categories LIMIT 1");
    let artCatId: number;
    if (artCatRows.length === 0) {
      const ins = await client.query(
        `INSERT INTO web_article_categories (name, slug, description, is_active)
         VALUES ('Kabar Penyaluran', 'kabar-penyaluran', 'Laporan penyaluran program kebaikan', true)
         RETURNING id`
      );
      artCatId = ins.rows[0].id;
    } else {
      artCatId = artCatRows[0].id;
    }

    // Pastikan ada 1 admin untuk author artikel
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || "admin@platformdonasi.example";
    const adminName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Super Admin";
    await client.query(
      `INSERT INTO admins (name, email, role, status)
       VALUES ($1, $2, 'SUPERADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [adminName, adminEmail]
    );
    const { rows: adminRows } = await client.query("SELECT id FROM admins ORDER BY id ASC LIMIT 1");
    const authorId = adminRows[0].id;

    const { rows: artRows } = await client.query("SELECT id FROM web_articles LIMIT 1");
    if (artRows.length === 0) {
      await client.query(
        `INSERT INTO web_articles (slug, title, title_long, excerpt, body, category_id, author_id, status, featured_image_url, featured_image_alt, published_at)
         VALUES
           ('penyaluran-beasiswa-buku-pelosok', 'Penyaluran Ratusan Paket Buku & Alat Tulis untuk Pelajar Pelosok', 'Penyaluran Ratusan Paket Buku & Alat Tulis untuk Pelajar Pelosok', 'Sebanyak 350 paket buku dan perlengkapan sekolah telah diterima oleh siswa di wilayah terpencil.', '<p>Alhamdulillah, program pendidikan kembali menyalurkan ratusan paket buku dan perlengkapan belajar bagi siswa yang membutuhkan.</p>', $1, $2, 'published', '/seed/artikel/buku.webp', 'Penyaluran paket buku belajar', NOW()),
           ('layanan-kesehatan-gratis-warga', 'Layanan Pemeriksaan Kesehatan Gratis Menjangkau 500 Warga', 'Layanan Pemeriksaan Kesehatan Gratis Menjangkau 500 Warga', 'Tim medis bergerak memberikan pemeriksaan tekanan darah, gula darah, dan obat-obatan gratis.', '<p>Kegiatan bakti sosial kesehatan berjalan lancar dengan antusiasme tinggi dari masyarakat setempat.</p>', $1, $2, 'published', '/seed/kabar/kesehatan.webp', 'Layanan kesehatan gratis', NOW()),
           ('perpustakaan-ramah-anak-desa', 'Membangun Sudut Baca & Perpustakaan Ramah Anak di Desa Binaan', 'Membangun Sudut Baca & Perpustakaan Ramah Anak di Desa Binaan', 'Rak buku baru dan koleksi bacaan edukatif kini tersedia untuk meningkatkan literasi anak.', '<p>Dukungan para donatur menghadirkan ruang baca yang nyaman bagi anak-anak desa.</p>', $1, $2, 'published', '/seed/artikel/rak.webp', 'Perpustakaan ramah anak', NOW())`,
        [artCatId, authorId]
      );
    }

    const { rows: metricRows } = await client.query("SELECT id FROM web_impact_metrics LIMIT 1");
    if (metricRows.length === 0) {
      await client.query(`
        INSERT INTO web_impact_metrics (metric_key, label, value, suffix, display_order, is_active)
        VALUES
          ('penerima_manfaat', 'Penerima Manfaat', 24500, '+', 1, true),
          ('program_terlaksana', 'Program Terlaksana', 142, '+', 2, true),
          ('donatur_aktif', 'Donatur Aktif', 8900, '+', 3, true),
          ('wilayah_jangkauan', 'Wilayah Jangkauan', 28, ' Kota/Kab', 4, true)
      `);
    }

    const { rows: faqRows } = await client.query("SELECT id FROM web_faqs LIMIT 1");
    if (faqRows.length === 0) {
      await client.query(`
        INSERT INTO web_faqs (question, answer, category, display_order, is_active)
        VALUES
          ('Bagaimana cara berdonasi di platform ini?', 'Pilih program kebaikan yang ingin didukung, tentukan nominal donasi, isi data singkat, lalu selesaikan pembayaran melalui QRIS, Virtual Account, atau E-Wallet.', 'donation', 1, true),
          ('Apakah donasi saya mendapatkan bukti setor / kwitansi?', 'Ya, setelah pembayaran terverifikasi, Anda dapat mengunduh kwitansi dan invoice langsung dari halaman status transaksi atau riwayat donasi.', 'general', 2, true)
      `);
    }

    await client.query("COMMIT");
    console.log("Seed realistis crowdfunding & web selesai.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
