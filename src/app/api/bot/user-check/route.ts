import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.BOT_SECRET || 'dev-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
  }

  const user = db.getUser(chatId);
  const webinars = db.getWebinars();
  const now = new Date();
  
  const nearest = webinars
    .filter(w => {
      const startTime = new Date(w.startTime);
      const duration = (w.duration || 3600) * 1000;
      const endTime = new Date(startTime.getTime() + duration);
      return endTime > now;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  if (user && nearest) {
    const registrations = user.registrations || [];
    if (!registrations.some(r => r.webinarId === nearest.id)) {
      registrations.push({ webinarId: nearest.id, date: new Date().toISOString() });
      db.addUser({ ...user, registrations });
    }
  }

  return NextResponse.json({ 
    exists: !!user, 
    user: user || null,
    webinar: nearest || null
  });
}
