import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(db.getUsers());
}
