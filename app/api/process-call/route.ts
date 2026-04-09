import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyInternalSecret } from '@/lib/auth-server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpegPath from 'ffmpeg-static';

const MAX_RECORDING_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_RECORDING_HOSTS = [
  'api.zadarma.com',
  'recordings.zadarma.com',
  'storage.googleapis.com',
];

function isAllowedRecordingUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_RECORDING_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!verifyInternalSecret(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const body = await req.json();

    if (body.type !== 'INSERT') {
      return NextResponse.json({ skipped: true });
    }

    const record = body.record;
    const recording_url: string = record?.recording_url;
    const external_call_id: string = record?.external_call_id;
    const queue_id: string | number = record?.id;

    if (!recording_url) {
      return NextResponse.json({ error: 'No recording_url' }, { status: 400 });
    }

    if (!isAllowedRecordingUrl(recording_url)) {
      return NextResponse.json({ error: 'Recording URL not allowed' }, { status: 400 });
    }

    // Download with size limit to prevent disk exhaustion
    const res = await fetch(recording_url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to download recording' }, { status: 502 });
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RECORDING_BYTES) {
      return NextResponse.json({ error: 'Recording file too large' }, { status: 413 });
    }

    const chunks: Buffer[] = [];
    let totalSize = 0;
    const reader = res.body?.getReader();

    if (!reader) {
      return NextResponse.json({ error: 'Failed to read recording stream' }, { status: 500 });
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > MAX_RECORDING_BYTES) {
        reader.cancel();
        return NextResponse.json({ error: 'Recording file too large' }, { status: 413 });
      }
      chunks.push(Buffer.from(value));
    }

    const buffer = Buffer.concat(chunks);

    const tmpDir = os.tmpdir();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    inputPath = path.join(tmpDir, `zytrix-${uniqueId}.mp3`);
    outputPath = path.join(tmpDir, `zytrix-${uniqueId}.wav`);

    fs.writeFileSync(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn(ffmpegPath as string, [
        '-i', inputPath!,
        '-ar', '16000',
        '-ac', '1',
        outputPath!,
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });

    const fileBuffer = fs.readFileSync(outputPath);

    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'audio.wav');
    formData.append('model', 'gpt-4o-mini-transcribe');
    formData.append('language', 'bg');

    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!openaiRes.ok) {
      throw new Error('OpenAI transcription failed');
    }

    const transcription = await openaiRes.json();
    const text: string = transcription.text || '';

    await supabaseAdmin
      .from('calls')
      .update({ transcript_text: text, processing_status: 'processed' })
      .eq('external_call_id', external_call_id);

    if (queue_id) {
      await supabaseAdmin
        .from('call_processing_queue')
        .update({ processed: true, status: 'done' })
        .eq('id', queue_id);
    }

    return NextResponse.json({ success: true, text });
  } catch (err) {
    console.error('PROCESS CALL ERROR:', err instanceof Error ? err.message : 'Unknown');
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  } finally {
    // Always clean up temp files
    if (inputPath) {
      try { fs.unlinkSync(inputPath); } catch { /* ignore */ }
    }
    if (outputPath) {
      try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
    }
  }
}
