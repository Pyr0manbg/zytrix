import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const external_call_id = body?.external_call_id?.toString()?.trim();

    if (!external_call_id) {
      return NextResponse.json(
        { success: false, error: 'external_call_id is required' },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {
      external_call_id,
      phone_number: body?.phone_number ?? null,
      recording_url: body?.recording_url ?? null,
      transcript_text: body?.transcript_text ?? null,
      summary: body?.summary ?? null,
      conversation_type: body?.conversation_type ?? null,
      sentiment: body?.sentiment ?? null,
      motivation_score: body?.motivation_score ?? null,
      deal_probability: body?.deal_probability ?? null,
      next_step: body?.next_step ?? null,
      follow_up_date: body?.follow_up_date ?? null,
      coaching: body?.coaching ?? null,
      processing_status: body?.processing_status ?? 'completed',
      updated_at: new Date().toISOString(),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const { data: existingCall, error: findError } = await supabaseAdmin
      .from('calls')
      .select('id')
      .eq('external_call_id', external_call_id)
      .maybeSingle();

    if (findError) {
      console.error('FINALIZE CALL FIND ERROR:', findError);

      return NextResponse.json(
        { success: false, error: 'Failed to check existing call' },
        { status: 500 }
      );
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
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single());
    }

    if (dbError) {
      console.error('FINALIZE CALL UPSERT ERROR:', dbError);

      return NextResponse.json(
        { success: false, error: 'Failed to save call' },
        { status: 500 }
      );
    }

    if (body?.queue_id) {
      const { error: queueError } = await supabaseAdmin
        .from('call_processing_queue')
        .update({
          status: 'done',
          processed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.queue_id);

      if (queueError) {
        console.error('QUEUE UPDATE ERROR:', queueError);
      }
    }

    return NextResponse.json({
      success: true,
      call: result,
    });
  } catch (error) {
    console.error('FINALIZE CALL ROUTE ERROR:', error);

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 500 }
    );
  }
}