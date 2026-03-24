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
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    const payload = Object.fromEntries(params.entries());

    console.log('ZADARMA PAYLOAD:', payload);

    const externalCallId =
      payload.call_id?.toString() ||
      payload.pbx_call_id?.toString() ||
      payload.id?.toString() ||
      null;

    const eventType =
      payload.event ||
      payload.event_type ||
      payload.status ||
      'unknown';

    const { error } = await supabaseAdmin.from('call_events').insert({
      provider: 'zadarma',
      event_type: String(eventType),
      external_call_id: externalCallId,
      payload,
      processed: false,
    });

    if (externalCallId) {
      const updateData: any = {
        external_call_id: externalCallId,
        call_status: eventType,
      };

      // direction
      if (eventType?.includes('OUT')) {
        updateData.direction = 'outbound';
      }

      if (eventType?.includes('IN')) {
        updateData.direction = 'inbound';
      }

      // phone numbers
      if (payload.from) updateData.from_number = payload.from;
      if (payload.to) updateData.to_number = payload.to;

      // timestamps
      if (eventType === 'NOTIFY_OUT_START' || eventType === 'NOTIFY_START') {
        updateData.started_at = new Date().toISOString();
      }

      if (eventType === 'NOTIFY_OUT_END' || eventType === 'NOTIFY_END') {
        updateData.ended_at = new Date().toISOString();
      }

      // recording
      if (eventType === 'NOTIFY_RECORD') {
        updateData.recording_url =
          payload.record_link ||
          payload.link ||
          payload.record ||
          null;
      }

      await supabaseAdmin.from('calls').upsert(updateData, {
        onConflict: 'external_call_id',
      });
    }

    if (error) {
      console.error('ZADARMA WEBHOOK INSERT ERROR:', error);

      return new Response(JSON.stringify({ success: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ZADARMA ERROR:', err);

    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}