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

  // 2. Find nearest upcoming or live webinar
  const webinars = db.getWebinars();
  const now = new Date();
  
  const activeWebinars = webinars.filter(w => {
    const startTime = new Date(w.startTime);
    const duration = (w.duration || 3600) * 1000;
    const endTime = new Date(startTime.getTime() + duration);
    
    // Webinar is active if it hasn't finished yet
    return endTime > now;
  });

  // Sort: prioritize webinars that are closer to the current time (future or live)
  const nearest = activeWebinars.sort((a, b) => {
    const startA = new Date(a.startTime).getTime();
    const startB = new Date(b.startTime).getTime();
    return startA - startB;
  })[0];

  if (nearest) {
    db.addNotification({
      id: `reg_${nearest.id}_${chatId}`,
      type: 'reminder', // Using reminder type as a proxy for "already has info"
      userId: chatId.toString(),
      webinarId: nearest.id,
      sentAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ 
    success: true, 
    webinar: nearest || null 
  });
}
