import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function normalizePhoneNumber(phone: string) {
  return phone.replace(/[^\d+]/g, '').trim();
}

function isValidPhoneNumber(phone: string) {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length >= 8;
}

function buildZadarmaAuth(
  methodPath: string,
  params: Record<string, string>,
  key: string,
  secret: string
) {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((acc, k) => {
      acc[k] = params[k];
      return acc;
    }, {});

  const queryString = new URLSearchParams(sortedParams).toString();
  const md5 = crypto.createHash('md5').update(queryString).digest('hex');

  const hexDigest = crypto
    .createHmac('sha1', secret)
    .update(methodPath + queryString + md5)
    .digest('hex');

  const signature = Buffer.from(hexDigest, 'utf8').toString('base64');

  return {
    queryString,
    authorization: `${key}:${signature}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phoneNumber = normalizePhoneNumber(body?.phoneNumber || '');

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number.' },
        { status: 400 }
      );
    }

    const zadarmaKey = process.env.ZADARMA_KEY?.trim();
    const zadarmaSecret = process.env.ZADARMA_SECRET?.trim();
    const zadarmaSip = process.env.ZADARMA_SIP?.trim() || '';
    const zadarmaCallerId = process.env.ZADARMA_CALLER_ID?.trim() || '';

    if (!zadarmaKey || !zadarmaSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Zadarma environment variables are missing.',
        },
        { status: 500 }
      );
    }

    if (!zadarmaSip) {
      return NextResponse.json(
        {
          success: false,
          error: 'ZADARMA_SIP is missing in env',
        },
        { status: 500 }
      );
    }

    const methodPath = '/v1/request/callback/';
    const params: Record<string, string> = {
      from: zadarmaSip,
      to: phoneNumber,
    };

    if (zadarmaCallerId) {
      params.caller_id = zadarmaCallerId;
    }

    const { queryString, authorization } = buildZadarmaAuth(
      methodPath,
      params,
      zadarmaKey,
      zadarmaSecret
    );

    const response = await fetch(
      `https://api.zadarma.com${methodPath}?${queryString}`,
      {
        method: 'GET',
        headers: {
          Authorization: authorization,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const rawText = await response.text();

    let parsedResponse: unknown = null;
    try {
      parsedResponse = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsedResponse = rawText;
    }

    if (!response.ok) {
      console.error('ZADARMA ERROR:', parsedResponse);

      return NextResponse.json(
        {
          success: false,
          error: parsedResponse,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Call request sent successfully.',
      providerResponse: parsedResponse,
    });
  } catch (error) {
    console.error('ZADARMA CALL ROUTE ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error while sending Zadarma call request.',
      },
      { status: 500 }
    );
  }
}