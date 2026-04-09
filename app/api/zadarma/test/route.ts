import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function buildZadarmaAuth(method: string, params: Record<string, string>) {
  const key = process.env.ZADARMA_KEY!;
  const secret = process.env.ZADARMA_SECRET!;

  const sortedEntries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const paramsStr = new URLSearchParams(sortedEntries).toString();
  const md5 = crypto.createHash('md5').update(paramsStr).digest('hex');

  const signature = crypto
    .createHmac('sha1', secret)
    .update(method + paramsStr + md5)
    .digest('base64');

  return { authHeader: `${key}:${signature}`, paramsStr };
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const method = '/v1/info/balance/';
  const { authHeader, paramsStr } = buildZadarmaAuth(method, {});

  const url = `https://api.zadarma.com${method}${paramsStr ? `?${paramsStr}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  const text = await res.text();

  return NextResponse.json({ status: res.status, body: text });
}
