import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(db.getUsers());
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, name, phone } = await req.json();
    const user = db.getUser(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    db.addUser({
      ...user,
      name,
      phone
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    
    db.deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
