import { NextRequest, NextResponse } from 'next/server';
import { db, Webinar } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(db.getWebinars());
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  
  const newWebinar: Webinar = {
    id: Math.random().toString(36).substring(7),
    title: data.title,
    videoUrl: data.videoUrl,
    startTime: data.startTime,
    repeatDays: data.repeatDays || [],
    fakeViewersBase: parseInt(data.fakeViewersBase) || 0,
    duration: parseInt(data.duration) || 3600,
    chatPresets: data.chatPresets || [],
  };

  db.addWebinar(newWebinar);
  return NextResponse.json({ success: true, webinar: newWebinar });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const data = db.getWebinars();
  const filtered = data.filter((w: any) => w.id !== id);
  
  // Update DB
  const path = require('path');
  const fs = require('fs');
  const DB_PATH = path.join(process.cwd(), 'data.json');
  const fullDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  fullDB.webinars = filtered;
  fs.writeFileSync(DB_PATH, JSON.stringify(fullDB, null, 2));

  return NextResponse.json({ success: true });
}
