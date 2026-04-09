import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyInternalSecret } from '@/lib/auth-server';

function unwrap(value: unknown) {
  if (value && typeof value === 'object' && 'type' in value) {
    return (value as { type: unknown }).type;
  }
  return value;
}

export async function POST(req: NextRequest) {
  if (!verifyInternalSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await req.text();

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const props = (body?.properties ?? {}) as Record<string, unknown>;

    const queue_id = body?.queue_id ?? props?.queue_id ?? null;
    const external_call_id = unwrap(body?.external_call_id ?? props?.external_call_id)
      ?.toString()
      ?.trim();

    if (!external_call_id) {
      return NextResponse.json(
        { success: false, error: 'external_call_id is required' },
        { status: 400 },
      );
    }

    const payload: Record<string, unknown> = {
      external_call_id,
      phone_number: unwrap(body?.phone_number ?? props?.phone_number) ?? null,
      recording_url: unwrap(body?.recording_url ?? props?.recording_url) ?? null,
      transcript_text: unwrap(body?.transcript_text ?? props?.transcript_text) ?? null,
      summary: unwrap(body?.summary ?? props?.summary) ?? null,
      conversation_type: unwrap(body?.conversation_type ?? props?.conversation_type) ?? null,
      sentiment: unwrap(body?.sentiment ?? props?.sentiment) ?? null,
      motivation_score: unwrap(body?.motivation_score ?? props?.motivation_score) ?? null,
      deal_probability: unwrap(body?.deal_probability ?? props?.deal_probability) ?? null,
      next_step: unwrap(body?.next_step ?? props?.next_step) ?? null,
      follow_up_date: unwrap(body?.follow_up_date ?? props?.follow_up_date) ?? null,
      coaching: unwrap(body?.coaching ?? props?.coaching) ?? null,
      processing_status: unwrap(body?.processing_status ?? props?.processing_status) ?? 'completed',
      updated_at: new Date().toISOString(),
    };

    for (const key of Object.keys(payload)) {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    }

    const { data: existingCall, error: findError } = await supabaseAdmin
      .from('calls')
      .select('id')
      .eq('external_call_id', external_call_id)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ success: false, error: 'Failed to check existing call' }, { status: 500 });
    }

    let result;
    let dbError;

    if (existingCall?.id) {
      ({ data: result, error: dbError } = await supabaseAdmin
        .from('calls')
        .update(payload)
        .eq('id', existingCall.id)
        .select()
        .single());
    } else {
      ({ data: result, error: dbError } = await supabaseAdmin
        .from('calls')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single());
    }

    if (dbError) {
      return NextResponse.json({ success: false, error: 'Failed to save call' }, { status: 500 });
    }

    if (queue_id) {
      await supabaseAdmin
        .from('call_processing_queue')
        .update({
          status: 'done',
          processed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', queue_id);
    }

    return NextResponse.json({ success: true, call: result });
  } catch (error) {
    console.error('FINALIZE CALL ROUTE ERROR:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 500 });
  }
}
