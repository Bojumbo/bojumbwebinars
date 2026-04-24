import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json([]);
    }

    // Читаємо реальні файли з папки
    const files = await readdir(uploadDir);
    
    // Фільтруємо тільки відео-файли
    const videoFiles = files
      .filter(file => /\.(mp4|webm|mov|avi)$/i.test(file))
      .map(file => ({
        name: file,
        url: `/uploads/${file}`
      }));

    return NextResponse.json(videoFiles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read library' }, { status: 500 });
  }
}
