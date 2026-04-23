import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(req: NextRequest) {
  // Simple "secret" check for the bot
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.BOT_SECRET || 'dev-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { code, name, contact } = await req.json();
  
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  db.addCode(code, name, contact);
  return NextResponse.json({ success: true, code });
}
