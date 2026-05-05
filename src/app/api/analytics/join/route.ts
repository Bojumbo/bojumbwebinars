import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';
import { sendPulse } from '@/lib/sendpulse';

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

    // 2. Update SendPulse CRM
    const user = db.getUser(userId);
    const webinar = db.getWebinars().find(w => w.id === webinarId);
    
    if (user && webinar) {
      // Fire and forget SendPulse update to not slow down response
      sendPulse.createOrUpdateDeal(
        user.id,
        user.name,
        user.phone,
        webinar.title,
        true // isAttended = true
      ).catch(e => console.error('SendPulse Sync Error:', e));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
