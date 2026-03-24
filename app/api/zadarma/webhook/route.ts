import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// ✅ GET (verification)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const echo = searchParams.get('zd_echo');

  if (echo) {
    return new Response(echo);
  }

  return new Response('OK');
}

// ✅ POST (webhook)
export async function POST(req: NextRequest) {
  try {
    // Zadarma праща x-www-form-urlencoded (НЕ JSON)
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

    // 📦 записваме raw събитие
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

    // 📞 основна call логика
    if (externalCallId) {
      const updateData: any = {
        external_call_id: externalCallId,
        call_status: eventType,
      };

      // direction
      if (eventType?.includes('OUT')) updateData.direction = 'outbound';
      if (eventType?.includes('IN')) updateData.direction = 'inbound';

      // номера
      if (payload.from) updateData.from_number = payload.from;
      if (payload.to) updateData.to_number = payload.to;

      // старт
      if (eventType === 'NOTIFY_OUT_START' || eventType === 'NOTIFY_START') {
        updateData.started_at = new Date().toISOString();
      }

      // край
      if (eventType === 'NOTIFY_OUT_END' || eventType === 'NOTIFY_END') {
        updateData.ended_at = new Date().toISOString();
      }

      // 🎯 RECORDING ЛОГИКА
      if (eventType === 'NOTIFY_RECORD' && payload.call_id_with_rec) {
        console.log('➡️ RECORD EVENT TRIGGERED');

        const callIdWithRec = payload.call_id_with_rec;
        const key = process.env.ZADARMA_KEY!;
        const secret = process.env.ZADARMA_SECRET!;

        const method = '/v1/pbx/record/request/';
        const query = `call_id_with_rec=${callIdWithRec}`;

        const signature = crypto
          .createHmac('sha1', secret)
          .update(method + query)
          .digest('base64');

        const auth = Buffer.from(`${key}:${signature}`).toString('base64');

        console.log('➡️ REQUESTING RECORD LINK:', query);

        const response = await fetch(
          `https://api.zadarma.com${method}?${query}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
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

        // 🧠 различни варианти на response
        if (data?.link) {
          updateData.recording_url = data.link;
        } else if (data?.data?.link) {
          updateData.recording_url = data.data.link;
        } else if (data?.record_link) {
          updateData.recording_url = data.record_link;
        }
      }

      // 💾 запис в calls таблица
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