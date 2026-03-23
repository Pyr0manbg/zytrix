import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const echo = searchParams.get('zd_echo');

  if (echo) {
    return new Response(echo);
  }

  return new Response('OK');
}

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

    const fromNumber =
  payload?.from?.toString() ||
  payload?.caller_id?.toString() ||
  payload?.from_number?.toString() ||
  null;

const toNumber =
  payload?.to?.toString() ||
  payload?.called_did?.toString() ||
  payload?.to_number?.toString() ||
  null;

const durationSeconds =
  Number(payload?.duration || payload?.billsec || 0) || 0;

const callStatus =
  payload?.status?.toString() ||
  payload?.call_status?.toString() ||
  String(eventType);

const recordingUrl =
  payload?.recordlink?.toString() ||
  payload?.recording_url?.toString() ||
  payload?.link?.toString() ||
  null;

    const { error } = await supabaseAdmin.from('call_events').insert({
      provider: 'zadarma',
      event_type: String(eventType),
      external_call_id: externalCallId,
      payload,
      processed: false,
    });

    if (externalCallId) {
  const { error: upsertCallError } = await supabaseAdmin.from('calls').upsert(
    {
      provider: 'zadarma',
      external_call_id: externalCallId,
      from_number: fromNumber,
      to_number: toNumber,
      duration_seconds: durationSeconds,
      call_status: callStatus,
      recording_url: recordingUrl,
      source: 'zadarma_webhook',
    },
    {
      onConflict: 'external_call_id',
    }
  );

  if (upsertCallError) {
    console.error('ZADARMA CALL UPSERT ERROR:', upsertCallError);

    return NextResponse.json(
      { success: false, error: 'Failed to upsert call.' },
      { status: 500 }
    );
  }
}

    if (error) {
      console.error('ZADARMA WEBHOOK INSERT ERROR:', error);

      return NextResponse.json(
        { success: false, error: 'Failed to store webhook event.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ZADARMA WEBHOOK ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Invalid webhook payload.' },
      { status: 400 }
    );
  }
}