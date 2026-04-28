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

  try {
    db.deleteWebinar(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
