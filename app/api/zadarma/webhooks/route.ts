import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ✅ GET - за verification от Zadarma (zd_echo)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const echo = searchParams.get('zd_echo');

  if (echo) {
    return new Response(echo);
  }

  return new Response('OK');
}

// ✅ POST - реалните webhook-и от Zadarma
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const externalCallId =
      payload?.call_id?.toString() ||
      payload?.pbx_call_id?.toString() ||
      payload?.id?.toString() ||
      null;

    const eventType =
      payload?.event ||
      payload?.event_type ||
      payload?.status ||
      'unknown';

    const { error } = await supabaseAdmin.from('call_events').insert({
      provider: 'zadarma',
      event_type: String(eventType),
      external_call_id: externalCallId,
      payload,
      processed: false,
    });

    if (error) {
      console.error('ZADARMA WEBHOOK INSERT ERROR:', error);

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to store webhook' }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('ZADARMA WEBHOOK ERROR:', err);

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid payload' }),
      { status: 400 }
    );
  }
}