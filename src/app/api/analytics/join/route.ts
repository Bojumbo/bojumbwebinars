import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { webinarId, userId } = await req.json();

    if (!webinarId || !userId) {
      return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
    }

    db.recordAttendance({
      webinarId,
      userId,
      joinTime: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
