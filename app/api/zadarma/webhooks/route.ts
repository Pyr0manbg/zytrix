import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET (verification)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const echo = searchParams.get('zd_echo');

  if (echo) {
    return new Response(echo);
  }

  return new Response('OK');
}

// POST (webhook)
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
        JSON.stringify({ success: false }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    console.error('ZADARMA ERROR:', err);

    return new Response(
      JSON.stringify({ success: false }),
      { status: 400 }
    );
  }
}