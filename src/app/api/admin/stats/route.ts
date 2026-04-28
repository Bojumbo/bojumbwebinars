import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const webinarId = searchParams.get('webinarId');

  if (!webinarId) {
    return NextResponse.json({ error: 'webinarId is required' }, { status: 400 });
  }

  const attendance = db.getAttendance(webinarId);
  return NextResponse.json(attendance);
}
