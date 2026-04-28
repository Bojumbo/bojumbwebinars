import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const webinars = db.getWebinars();
  const allAttendance = webinars.map(w => ({
    webinarId: w.id,
    webinarTitle: w.title,
    webinarTime: w.startTime,
    attendees: db.getAttendance(w.id)
  }));

  const stats = users.map(u => {
    // Map registrations to actual webinar data
    const registrationHistory = (u.registrations || []).map(r => {
      const w = webinars.find(wb => wb.id === r.webinarId);
      return {
        webinarId: r.webinarId,
        title: w?.title || 'Unknown',
        time: w?.startTime || r.date,
        registeredAt: r.date
      };
    });

    // Map attendance
    const attendanceHistory = allAttendance
      .filter(w => w.attendees.some(a => a.userId === u.id))
      .map(w => ({
        webinarId: w.webinarId,
        title: w.webinarTitle,
        time: w.webinarTime,
        joinedAt: w.attendees.find(a => a.userId === u.id)?.joinTime
      }));

    // Map comments
    const comments = db.getMessagesByUser(u.id).map(c => {
      const w = webinars.find(wb => wb.id === c.webinarId);
      return {
        webinarTitle: w?.title || 'Unknown',
        text: c.text,
        videoTime: c.timestamp,
        sentAt: c.sentAt
      };
    });

    return {
      ...u,
      registrationHistory,
      attendanceHistory,
      comments,
      attendedCount: attendanceHistory.length
    };
  });

  return NextResponse.json(stats);
}
