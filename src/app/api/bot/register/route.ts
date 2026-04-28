import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.BOT_SECRET || 'dev-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId, name, phone, username } = await req.json();

  if (!chatId || !name || !phone) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  // 1. Register user
  db.addUser({
    id: chatId,
    name,
    phone,
    username,
    registeredAt: new Date().toISOString()
  });

  // 2. Find nearest upcoming webinar
  const webinars = db.getWebinars();
  const now = new Date();
  
  const nearest = webinars
    .filter(w => new Date(w.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  return NextResponse.json({ 
    success: true, 
    webinar: nearest || null 
  });
}
