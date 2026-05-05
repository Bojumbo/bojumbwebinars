import { NextRequest, NextResponse } from 'next/server';
import { sendPulse } from '@/lib/sendpulse';

export async function GET(req: NextRequest) {
  // Simple check for cookies/auth (assuming admin session is handled via some mechanism, 
  // but here we just check if credentials work)
  
  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;
  const pipelineId = process.env.SENDPULSE_PIPELINE_ID;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Кредити (Client ID/Secret) не встановлені в змінних оточення.' 
    });
  }

  try {
    // Attempt to get token (internal method in sendPulse lib)
    // I need to add a checkStatus method to sendPulse
    const result = await sendPulse.checkConnection();
    
    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      message: result.message,
      details: {
        clientId: clientId.substring(0, 5) + '...',
        pipelineId: pipelineId || 'Не вказано'
      }
    });
  } catch (e) {
    return NextResponse.json({ status: 'error', message: 'Виникла помилка при перевірці.' });
  }
}
