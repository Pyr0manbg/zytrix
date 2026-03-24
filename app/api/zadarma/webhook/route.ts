import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function buildZadarmaAuth(method: string, params: Record<string, string>) {
  const key = process.env.ZADARMA_KEY!;
  const secret = process.env.ZADARMA_SECRET!;

  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const paramsStr = new URLSearchParams(sortedEntries).toString();
  const md5 = crypto.createHash('md5').update(paramsStr).digest('hex');

  const hexDigest = crypto
    .createHmac('sha1', secret)
    .update(method + paramsStr + md5)
    .digest('hex');

  const signature = Buffer.from(hexDigest, 'utf8').toString('base64');

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
    const formParams = new URLSearchParams(bodyText);
    const payload = Object.fromEntries(formParams.entries());

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

    // 1) Save raw event
    const { error: callEventsError } = await supabaseAdmin
      .from('call_events')
      .insert({
        provider: 'zadarma',
        event_type: String(eventType),
        external_call_id: externalCallId,
        payload,
        processed: false,
      });

    if (callEventsError) {
      console.error('ZADARMA WEBHOOK INSERT ERROR:', callEventsError);

      return new Response(JSON.stringify({ success: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2) Build/update main call row
    if (externalCallId) {
      const updateData: any = {
        external_call_id: externalCallId,
        call_status: eventType,
      };

      if (eventType.includes('OUT')) updateData.direction = 'outbound';
      if (eventType.includes('IN')) updateData.direction = 'inbound';

      if (payload.from) updateData.from_number = payload.from;
      if (payload.to) updateData.to_number = payload.to;

      if (payload.duration && !Number.isNaN(Number(payload.duration))) {
        updateData.duration_seconds = Number(payload.duration);
      }

      if (eventType === 'NOTIFY_OUT_START' || eventType === 'NOTIFY_START') {
        updateData.started_at = new Date().toISOString();
      }

      if (eventType === 'NOTIFY_OUT_END' || eventType === 'NOTIFY_END') {
        updateData.ended_at = new Date().toISOString();
      }

      // 3) Try to fetch recording link when recording event arrives
      if (eventType === 'NOTIFY_RECORD') {
        const pbxCallId = payload.pbx_call_id?.toString() || null;
        const callIdWithRec = payload.call_id_with_rec?.toString() || null;

        console.log('➡️ RECORD EVENT TRIGGERED');
        console.log('ZADARMA KEY EXISTS:', !!process.env.ZADARMA_KEY);
        console.log('ZADARMA SECRET EXISTS:', !!process.env.ZADARMA_SECRET);
        console.log('pbx_call_id:', pbxCallId);
        console.log('call_id_with_rec:', callIdWithRec);

        const method = '/v1/pbx/record/request/';

        // Първо пробваме с call_id, защото идва директно от NOTIFY_RECORD.
        // Ако го няма, падаме към pbx_call_id.
        const requestParams: Record<string, string> = callIdWithRec
          ? { call_id: callIdWithRec }
          : pbxCallId
          ? { pbx_call_id: pbxCallId }
          : {};

        if (Object.keys(requestParams).length > 0) {
          const { authorizationHeader, paramsStr } = buildZadarmaAuth(
            method,
            requestParams
          );

          console.log('➡️ REQUESTING RECORD LINK:', paramsStr);
          console.log(
            '➡️ AUTH HEADER PREFIX:',
            authorizationHeader.split(':')[0]
          );

          const response = await fetch(
            `https://api.zadarma.com${method}?${paramsStr}`,
            {
              method: 'GET',
              headers: {
                Authorization: authorizationHeader,
                Accept: 'application/json',
              },
              cache: 'no-store',
            }
          );

          const rawText = await response.text();

          console.log('RECORD STATUS:', response.status);
          console.log('RECORD RAW:', rawText);

          let data: any = null;
          try {
            data = JSON.parse(rawText);
          } catch (e) {
            console.error('RECORD JSON PARSE ERROR:', e);
          }

          console.log('RECORD RESPONSE FULL:', JSON.stringify(data));

          const recordingUrl =
            data?.link ||
            data?.data?.link ||
            data?.record_link ||
            data?.data?.record_link ||
            data?.links?.[0] ||
            data?.data?.links?.[0] ||
            null;

          if (recordingUrl) {
            updateData.recording_url = recordingUrl;
            console.log('✅ RECORDING URL SAVED:', recordingUrl);
          } else {
            console.log('⚠️ NO RECORDING URL FOUND IN RESPONSE');
          }
        } else {
          console.log('⚠️ NOTIFY_RECORD received without usable IDs');
        }
      }

            const { data: upsertedCall, error: callsError } = await supabaseAdmin
        .from('calls')
        .upsert(updateData, {
          onConflict: 'external_call_id',
        })
        .select('id, external_call_id, recording_url')
        .single();

      if (callsError) {
        console.error('CALLS UPSERT ERROR:', callsError);

        return new Response(JSON.stringify({ success: false }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (upsertedCall?.recording_url) {
        const { error: queueError } = await supabaseAdmin
          .from('call_processing_queue')
          .insert({
            call_id: upsertedCall.id,
            external_call_id: upsertedCall.external_call_id,
            recording_url: upsertedCall.recording_url,
            status: 'pending',
          });

        if (queueError) {
          console.error('QUEUE INSERT ERROR:', queueError);
        } else {
          console.log('✅ QUEUE ITEM CREATED FOR CALL:', upsertedCall.id);
        }
      }
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