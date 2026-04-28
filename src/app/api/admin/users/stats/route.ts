import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const users = db.getUsers();
  const allAttendance = db.getWebinars().map(w => ({
    webinarId: w.id,
    webinarTitle: w.title,
    attendees: db.getAttendance(w.id)
  }));

  const stats = users.map(u => {
    // Find if they attended their initial webinar or any other
    const attendedWebinars = allAttendance
      .filter(w => w.attendees.some(a => a.userId === u.id))
      .map(w => w.webinarTitle);

    return {
      ...u,
      attendedCount: attendedWebinars.length,
      attendedWebinars
    };
  });

  return NextResponse.json(stats);
}
