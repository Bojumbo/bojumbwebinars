import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.BOT_SECRET || 'dev-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  // Parsing the generated ID: rem_WID_UID or foll_WID_UID
  const parts = id.split('_');
  const prefix = parts[0];
  let type: 'reminder' | 'followup' | 'announcement' = 'reminder';
  
  if (prefix === 'foll') type = 'followup';
  if (prefix === 'ann') type = 'announcement';
  if (prefix === 'reg') type = 'reminder';

  const webinarId = parts[1];
  const userId = parts[2];

  db.addNotification({
    id,
    type,
    userId,
    webinarId,
    sentAt: new Date().toISOString()
  });

  return NextResponse.json({ success: true });
}
