import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { userId, webinarId, senderName, text, timestamp } = await req.json();

    if (!userId || !webinarId || !text) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    db.addMessage({
      id: Math.random().toString(36).substr(2, 9),
      webinarId,
      userId,
      senderName,
      text,
      timestamp,
      isFake: false,
      sentAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
