import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email });

  if (error) {
    if (error.code === '23505') { // duplicate
      return NextResponse.json({ success: true }); // вече записан, пак показваме успех
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}