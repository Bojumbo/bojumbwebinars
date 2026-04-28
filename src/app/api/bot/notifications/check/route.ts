import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.BOT_SECRET || 'dev-secret'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const webinars = db.getWebinars();
  const users = db.getUsers();
  const sentNotifs = db.getNotifications();

  const reminders = [];
  const followups = [];
  const announcements = [];

  // Find nearest future webinar for announcements
  const futureWebinars = webinars
    .filter(w => new Date(w.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const nearest = futureWebinars[0];

  for (const w of webinars) {
    const startTime = new Date(w.startTime);
    const endTime = new Date(startTime.getTime() + (w.duration || 3600) * 1000);
    
    const diffToStart = (startTime.getTime() - now.getTime()) / 60000; // minutes
    const diffFromEnd = (now.getTime() - endTime.getTime()) / 60000; // minutes

    // 1. Check for reminders (approx 30 mins before start)
    if (diffToStart > 0 && diffToStart <= 35) {
      for (const u of users) {
        const alreadySent = sentNotifs.some(n => n.userId === u.id && n.webinarId === w.id && n.type === 'reminder');
        if (!alreadySent) {
          reminders.push({
            id: `rem_${w.id}_${u.id}`,
            chatId: u.id,
            webinarId: w.id,
            title: w.title,
            type: 'reminder'
          });
        }
      }
    }

    // 2. Check for follow-ups (approx 10 mins after end)
    if (diffFromEnd > 0 && diffFromEnd <= 40) {
      for (const u of users) {
        const alreadySent = sentNotifs.some(n => n.userId === u.id && n.webinarId === w.id && n.type === 'followup');
        if (!alreadySent) {
          followups.push({
            id: `foll_${w.id}_${u.id}`,
            chatId: u.id,
            webinarId: w.id,
            title: w.title,
            type: 'followup'
          });
        }
      }
    }
  }

  // 3. Check for announcements (if a user registered but hasn't heard about the nearest webinar yet)
  if (nearest) {
    for (const u of users) {
      const alreadyNotified = sentNotifs.some(n => n.userId === u.id && n.webinarId === nearest.id);
      if (!alreadyNotified) {
        announcements.push({
          id: `ann_${nearest.id}_${u.id}`,
          chatId: u.id,
          webinarId: nearest.id,
          title: nearest.title,
          startTime: nearest.startTime,
          type: 'announcement'
        });
      }
    }
  }

  return NextResponse.json({ reminders, followups, announcements });
}
