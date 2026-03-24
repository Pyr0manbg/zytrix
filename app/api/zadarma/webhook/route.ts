import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper for Zadarma API signature
function buildZadarmaAuth(method: string, params: Record<string, string>) {
  const key = process.env.ZADARMA_KEY!;
  const secret = process.env.ZADARMA_SECRET!;

  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const paramsStr = new URLSearchParams(sortedEntries).toString();
  const signature = crypto
    .createHmac('sha1', secret)
    .update(method + paramsStr + crypto.createHash('md5').update(paramsStr).digest('hex'))
    .digest('base64');

  return {
    authorizationHeader: `${key}:${signature}`,
    paramsStr,
  };
}

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

    if (error) {
      console.error('ZADARMA WEBHOOK INSERT ERROR:', error);

      return new Response(JSON.stringify({ success: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (externalCallId) {
      const updateData: any = {
        external_call_id: externalCallId,
        call_status: eventType,
      };

      if (eventType?.includes('OUT')) updateData.direction = 'outbound';
      if (eventType?.includes('IN')) updateData.direction = 'inbound';

      if (payload.from) updateData.from_number = payload.from;
      if (payload.to) updateData.to_number = payload.to;

      if (payload.duration) {
        const parsedDuration = Number(payload.duration);
        if (!Number.isNaN(parsedDuration)) {
          updateData.duration_seconds = parsedDuration;
        }
      }

      if (eventType === 'NOTIFY_OUT_START' || eventType === 'NOTIFY_START') {
        updateData.started_at = new Date().toISOString();
      }

      if (eventType === 'NOTIFY_OUT_END' || eventType === 'NOTIFY_END') {
        updateData.ended_at = new Date().toISOString();
      }

      if (eventType === 'NOTIFY_RECORD' && payload.call_id_with_rec) {
        console.log('➡️ RECORD EVENT TRIGGERED');

        const method = '/v1/pbx/record/request/';
        const requestParams = {
          call_id_with_rec: payload.call_id_with_rec,
        };

        const { authorizationHeader, paramsStr } = buildZadarmaAuth(
          method,
          requestParams
        );

        console.log('➡️ REQUESTING RECORD LINK:', paramsStr);

        const response = await fetch(
          `https://api.zadarma.com${method}?${paramsStr}`,
          {
            method: 'GET',
            headers: {
              Authorization: authorizationHeader,
            },
          }
        );

        const rawText = await response.text();

        console.log('RECORD STATUS:', response.status);
        console.log('RECORD RAW:', rawText);

        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          console.error('JSON PARSE ERROR:', e);
        }

        console.log('RECORD RESPONSE FULL:', JSON.stringify(data));

        // Zadarma often nests payload data
        if (data?.link) {
          updateData.recording_url = data.link;
        } else if (data?.data?.link) {
          updateData.recording_url = data.data.link;
        } else if (data?.record_link) {
          updateData.recording_url = data.record_link;
        } else if (data?.data?.record_link) {
          updateData.recording_url = data.data.record_link;
        }
      }

      await supabaseAdmin.from('calls').upsert(updateData, {
        onConflict: 'external_call_id',
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