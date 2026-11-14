import { NextResponse } from 'next/server';

const MAX_BYTES = 4 * 1024 * 1024; // Vercel serverless request body limit is ~4.5MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar (JPG/PNG).' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Ukuran foto terlalu besar (maksimal 4 MB).' }, { status: 413 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      console.error('Upload Error: BLOB_READ_WRITE_TOKEN is not configured');
      return NextResponse.json({ error: 'Layanan penyimpanan belum dikonfigurasi (BLOB_READ_WRITE_TOKEN).' }, { status: 500 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'bukti.jpg';
    const filename = `proofs/${Date.now()}-${safeName}`;

    // Upload via direct Vercel Blob REST API
    const response = await fetch(`https://blob.vercel-storage.com/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-version': '7',
        'x-content-type': file.type,
      },
      body: file,
      // @ts-ignore - allow streaming the file natively
      duplex: 'half'
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Vercel Blob raw error:', response.status, err);
      return NextResponse.json({ error: 'Gagal menyimpan foto ke penyimpanan.' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Upload gagal.' }, { status: 500 });
  }
}
