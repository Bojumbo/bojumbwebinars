import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage';

export async function GET() {
  return NextResponse.json(db.getCodes());
}
