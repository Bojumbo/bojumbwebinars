import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { googleSheets } from '@/lib/googleSheets';

export async function POST(req: NextRequest) {
  try {
    const { webinarId, userId } = await req.json();

    if (!webinarId || !userId) {
      return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
    }

    // 1. Record local attendance
    db.recordAttendance({
      webinarId,
      userId,
      joinTime: new Date().toISOString()
    });

    // 2. Sync with Google Sheets
    const user = db.getUser(userId);
    const webinar = db.getWebinars().find(w => w.id === webinarId);
    
    if (user && webinar) {
      googleSheets.updateAttendance(user.phone, webinar.title)
        .catch(e => console.error('Google Sheets Update Error:', e));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
