import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Upload limits configuration
const UPLOAD_LIMITS = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2 MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
  postImage: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    maxCount: 6,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },
  postVideo: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    maxCount: 1,
    allowedTypes: ['video/mp4', 'video/webm'],
  },
  postGif: {
    maxSize: 15 * 1024 * 1024, // 15 MB
    maxCount: 2,
    allowedTypes: ['image/gif'],
  },
  commentMedia: {
    maxSize: 8 * 1024 * 1024, // 8 MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  },
};

function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'image/gif') return 'gif';
  return 'image';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string; // avatar, postImage, postVideo, postGif, commentMedia

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate upload type
    if (!uploadType || !UPLOAD_LIMITS[uploadType as keyof typeof UPLOAD_LIMITS]) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    const limits = UPLOAD_LIMITS[uploadType as keyof typeof UPLOAD_LIMITS];

    // Validate file size
    if (file.size > limits.maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(limits.maxSize / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!limits.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${limits.allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}-${randomString}.${extension}`;

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadType);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/${uploadType}/${fileName}`;

    // Determine media type
    const mediaType = getMediaType(file.type);

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      fileSize: file.size,
      mimeType: file.type,
      mediaType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
