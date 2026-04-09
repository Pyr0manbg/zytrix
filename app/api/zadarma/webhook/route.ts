import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function buildZadarmaAuth(method: string, params: Record<string, string>) {
  const key = process.env.ZADARMA_KEY!;
  const secret = process.env.ZADARMA_SECRET!;

  const sortedEntries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
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

/**
 * Verify that this POST genuinely came from Zadarma.
 * Zadarma signs webhook payloads the same way as API responses:
 * sort all params (excluding `sign`), build query string, MD5 it,
 * HMAC-SHA1 with secret, base64-encode, compare against `sign` field.
 */
function verifyZadarmaSignature(
  payload: Record<string, string>,
  secret: string,
): boolean {
  const receivedSign = payload.sign;
  if (!receivedSign) return false;

  const paramsWithoutSign = Object.entries(payload)
    .filter(([k]) => k !== 'sign')
    .sort(([a], [b]) => a.localeCompare(b));

  const paramsStr = new URLSearchParams(paramsWithoutSign).toString();
  const md5 = crypto.createHash('md5').update(paramsStr).digest('hex');

  const computedHex = crypto
    .createHmac('sha1', secret)
    .update(paramsStr + md5)
    .digest('hex');

  const computedSign = Buffer.from(computedHex, 'utf8').toString('base64');

  return crypto.timingSafeEqual(
    Buffer.from(receivedSign),
    Buffer.from(computedSign),
  );
}

// GET (echo verification for Zadarma)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const echo = searchParams.get('zd_echo');

  if (echo) {
    return new Response(echo);
  }

  return new Response('OK');
}

// POST (webhook events from Zadarma)
export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const formParams = new URLSearchParams(bodyText);
    const payload = Object.fromEntries(formParams.entries());

    // Verify signature if secret is configured
    const zadarmaSecret = process.env.ZADARMA_SECRET;
    if (zadarmaSecret) {
      const isValid = verifyZadarmaSignature(payload, zadarmaSecret);
      if (!isValid) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const externalCallId =
      payload.call_id?.toString() ||
      payload.pbx_call_id?.toString() ||
      payload.id?.toString() ||
      null;

    const eventType = payload.event || payload.event_type || payload.status || 'unknown';

    const { error: callEventsError } = await supabaseAdmin.from('call_events').insert({
      provider: 'zadarma',
      event_type: String(eventType),
      external_call_id: externalCallId,
      payload,
      processed: false,
    });

    if (callEventsError) {
      return new Response(JSON.stringify({ success: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (externalCallId) {
      const updateData: Record<string, unknown> = {
        external_call_id: externalCallId,
        call_status: eventType,
      };

      if (eventType.includes('OUT')) updateData.direction = 'outbound';
      if (eventType.includes('IN')) updateData.direction = 'inbound';

      let fromNumber =
        payload.destination ||
        payload.from ||
        payload.caller ||
        payload.src ||
        payload.number ||
        null;

      // Ignore internal short numbers (e.g. PBX extensions)
      if (fromNumber && fromNumber.length <= 4) {
        fromNumber = null;
      }

      const toNumber =
        payload.internal ||
        payload.to ||
        payload.called_did ||
        payload.dst ||
        null;

      if (fromNumber) updateData.from_number = fromNumber;
      if (toNumber) updateData.to_number = toNumber;

      if (toNumber) {
        const { data: broker } = await supabaseAdmin
          .from('brokers')
          .select('id, agency_id')
          .eq('zadarma_number', toNumber)
          .maybeSingle();

        if (broker) {
          updateData.broker_id = broker.id;
          updateData.agency_id = broker.agency_id;
        }
      }

      if (payload.duration && !Number.isNaN(Number(payload.duration))) {
        updateData.duration_seconds = Number(payload.duration);
      }

      if (eventType === 'NOTIFY_OUT_START' || eventType === 'NOTIFY_START') {
        updateData.started_at = new Date().toISOString();
      }

      if (eventType === 'NOTIFY_OUT_END' || eventType === 'NOTIFY_END') {
        updateData.ended_at = new Date().toISOString();
      }

      if (eventType === 'NOTIFY_RECORD') {
        const pbxCallId = payload.pbx_call_id?.toString() || null;
        const callIdWithRec = payload.call_id_with_rec?.toString() || null;

        const method = '/v1/pbx/record/request/';
        const requestParams: Record<string, string> = callIdWithRec
          ? { call_id: callIdWithRec }
          : pbxCallId
            ? { pbx_call_id: pbxCallId }
            : {};

        if (Object.keys(requestParams).length > 0) {
          const { authorizationHeader, paramsStr } = buildZadarmaAuth(method, requestParams);

          const response = await fetch(`https://api.zadarma.com${method}?${paramsStr}`, {
            method: 'GET',
            headers: {
              Authorization: authorizationHeader,
              Accept: 'application/json',
            },
            cache: 'no-store',
          });

          const rawText = await response.text();

          let data: Record<string, unknown> | null = null;
          try {
            data = JSON.parse(rawText);
          } catch {
            // non-JSON response — skip
          }

          type WithLinks = { link?: string; record_link?: string; links?: string[] };
          const d = data as (WithLinks & { data?: WithLinks }) | null;
          const recordingUrl =
            d?.link ||
            d?.data?.link ||
            d?.record_link ||
            d?.data?.record_link ||
            d?.links?.[0] ||
            d?.data?.links?.[0] ||
            null;

          if (recordingUrl) {
            updateData.recording_url = recordingUrl;
          }
        }
      }

      const { data: upsertedCall, error: callsError } = await supabaseAdmin
        .from('calls')
        .upsert(updateData, { onConflict: 'external_call_id' })
        .select('id, external_call_id, recording_url')
        .single();

      if (callsError) {
        return new Response(JSON.stringify({ success: false }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (upsertedCall?.recording_url) {
        await supabaseAdmin.from('call_processing_queue').insert({
          call_id: upsertedCall.id,
          external_call_id: upsertedCall.external_call_id,
          recording_url: upsertedCall.recording_url,
          status: 'pending',
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ZADARMA WEBHOOK ERROR:', err instanceof Error ? err.message : 'Unknown');
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
