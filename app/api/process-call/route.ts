import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('WEBHOOK BODY:', body);

    if (body.type !== 'INSERT') {
      return NextResponse.json({ skipped: true });
    }

    const record = body.record;

    const recording_url = record?.recording_url;
    const external_call_id = record?.external_call_id;
    const queue_id = record?.id;

    if (!recording_url) {
      return NextResponse.json({ error: 'No recording_url' }, { status: 400 });
    }

    // 1. download file
    const res = await fetch(recording_url);
    const buffer = Buffer.from(await res.arrayBuffer());

    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `${Date.now()}.mp3`);
    const outputPath = path.join(tmpDir, `${Date.now()}.wav`);

    fs.writeFileSync(inputPath, buffer);

    // 2. convert with ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-ar', '16000',
        '-ac', '1',
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error('ffmpeg failed'));
      });
    });

    // 3. send to OpenAI
const fileBuffer = fs.readFileSync(outputPath);

const formData = new FormData();
formData.append(
  'file',
  new Blob([fileBuffer]),
  'audio.wav'
);
formData.append('model', 'gpt-4o-mini-transcribe');
formData.append('language', 'bg');

    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const transcription = await openaiRes.json();

    const text = transcription.text || '';

    // 4. save result
    await supabaseAdmin
      .from('calls')
      .update({
        transcript_text: text,
        processing_status: 'processed',
      })
      .eq('external_call_id', external_call_id);

    // 5. mark queue done
    if (queue_id) {
      await supabaseAdmin
        .from('call_processing_queue')
        .update({
          processed: true,
          status: 'done'
        })
        .eq('id', queue_id);
    }

    return NextResponse.json({ success: true, text });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'fail' }, { status: 500 });
  }
}