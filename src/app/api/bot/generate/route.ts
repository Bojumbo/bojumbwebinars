import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    // Simple "secret" check for the bot
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.BOT_SECRET || 'dev-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { code, name, contact } = body;
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    db.addCode(code, name, contact);
    return NextResponse.json({ success: true, code });
  } catch (error: any) {
    const kyivTime = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
    console.error(`[${kyivTime}] Error in /api/bot/generate:`, error.message);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
