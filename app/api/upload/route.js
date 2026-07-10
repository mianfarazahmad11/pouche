import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function sanitizeFileName(fileName) {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure the directory exists
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (e) {
      // Ignore if directory exists
    }

    const filename = `${Date.now()}-${sanitizeFileName(file.name)}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
