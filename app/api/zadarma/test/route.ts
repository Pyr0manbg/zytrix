import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function buildZadarmaAuth(method: string, params: Record<string, string>) {
  const key = process.env.ZADARMA_KEY!;
  const secret = process.env.ZADARMA_SECRET!;

  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const paramsStr = new URLSearchParams(sortedEntries).toString();
  const md5 = crypto.createHash('md5').update(paramsStr).digest('hex');

  const signature = crypto
    .createHmac('sha1', secret)
    .update(method + paramsStr + md5)
    .digest('base64');

  return {
    authHeader: `${key}:${signature}`,
    paramsStr,
  };
}

export async function GET(_req: NextRequest) {
  const method = '/v1/info/balance/';
  const params = {};

  const { authHeader, paramsStr } = buildZadarmaAuth(method, params);

  const url = `https://api.zadarma.com${method}${
    paramsStr ? `?${paramsStr}` : ''
  }`;

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
    },
  });

  const text = await res.text();

  return new Response(
    JSON.stringify(
      {
        status: res.status,
        authHeaderPrefix: authHeader.split(':')[0],
        body: text,
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json' } }
  );
}