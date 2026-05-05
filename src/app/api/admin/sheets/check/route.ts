import { NextRequest, NextResponse } from 'next/server';
import { googleSheets } from '@/lib/googleSheets';

export async function GET(req: NextRequest) {
  const result = await googleSheets.checkConnection();
  
  return NextResponse.json({
    status: result.success ? 'success' : 'error',
    message: result.message,
    details: {
      sheetId: process.env.GOOGLE_SHEET_ID || 'Не вказано'
    }
  });
}
