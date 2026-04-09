import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth-server';

function safe(value: string | null | undefined) {
  return value || '';
}

function trySimpleAnswer(question: string, clients: ClientRow[], callLogs: CallLogRow[]): string | null {
  const q = question.toLowerCase().trim();

  if (q.includes('колко клиента') || q.includes('how many clients')) {
    return `Имаш ${clients.length} клиента в CRM-а.`;
  }

  if (q.includes('активни') || q.includes('active clients')) {
    const active = clients.filter((c) => c.status === 'Active').length;
    return `Активни клиенти: ${active}.`;
  }

  if (q.includes('follow-up') || q.includes('follow up') || q.includes('фолоуъп')) {
    const followUps = clients
      .filter((c) => c.follow_up)
      .sort((a, b) => new Date(a.follow_up!).getTime() - new Date(b.follow_up!).getTime())
      .slice(0, 5);

    if (!followUps.length) return 'Няма насрочени follow-up-и в момента.';

    return `Най-близките follow-up-и:\n${followUps
      .map((c) => `- ${safe(c.client_name)} на ${new Date(c.follow_up!).toLocaleDateString('bg-BG')}`)
      .join('\n')}`;
  }

  return null;
}

interface ClientRow {
  id: number;
  client_name: string | null;
  phone_number: string | null;
  budget: string | null;
  notes: string | null;
  follow_up: string | null;
  status: string | null;
  broker_id: number | null;
}

interface CallLogRow {
  id: number;
  client_id: number | null;
  call_result: string | null;
  notes: string | null;
  created_at: string;
}

function buildContext(clients: ClientRow[], callLogs: CallLogRow[]): string {
  const callsByClient = new Map<number, CallLogRow[]>();
  for (const call of callLogs) {
    if (!call.client_id) continue;
    const existing = callsByClient.get(call.client_id) || [];
    existing.push(call);
    callsByClient.set(call.client_id, existing);
  }

  return clients
    .map((client) => {
      const calls = (callsByClient.get(client.id) || []).slice(0, 3);
      const callsText =
        calls.length > 0
          ? calls
              .map(
                (c, i) =>
                  `  Разговор ${i + 1} (${new Date(c.created_at).toLocaleDateString('bg-BG')}): ${safe(c.call_result)} ${safe(c.notes)}`,
              )
              .join('\n')
          : '  Няма записани разговори.';

      return `Клиент: ${safe(client.client_name)}
  Телефон: ${safe(client.phone_number)}
  Бюджет: ${safe(client.budget)}
  Интерес: ${safe(client.notes)}
  Follow-up: ${safe(client.follow_up)}
  Статус: ${safe(client.status)}
${callsText}`;
    })
    .join('\n\n');
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const question = (body?.question || '').toString().trim();

    if (!question) {
      return NextResponse.json({ success: false, error: 'Въпросът е задължителен.' }, { status: 400 });
    }

    // Scope data to the authenticated broker
    const { data: broker } = await supabaseAdmin
      .from('brokers')
      .select('id, agency_id')
      .or(`email.eq.${user.email},broker_email.eq.${user.email}`)
      .maybeSingle();

    let clientsQuery = supabaseAdmin
      .from('clients')
      .select('id, client_name, phone_number, budget, notes, follow_up, status, broker_id')
      .order('created_at', { ascending: false })
      .limit(100);

    if (broker?.id) {
      clientsQuery = clientsQuery.eq('broker_id', broker.id);
    }

    const { data: clients, error: clientsError } = await clientsQuery;
    if (clientsError) {
      return NextResponse.json({ success: false, error: 'Failed to load clients' }, { status: 500 });
    }

    const clientIds = (clients || []).map((c) => c.id);
    let callLogs: CallLogRow[] = [];

    if (clientIds.length > 0) {
      const { data, error: callsError } = await supabaseAdmin
        .from('call_logs')
        .select('id, client_id, call_result, notes, created_at')
        .in('client_id', clientIds)
        .order('created_at', { ascending: false })
        .limit(300);

      if (!callsError) {
        callLogs = (data as CallLogRow[]) || [];
      }
    }

    const clientList = (clients as ClientRow[]) || [];

    const simpleAnswer = trySimpleAnswer(question, clientList, callLogs);
    if (simpleAnswer) {
      return NextResponse.json({ success: true, answer: simpleAnswer });
    }

    const context = buildContext(clientList, callLogs);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `Ти си AI асистент за брокер на недвижими имоти.
Отговаряй кратко и конкретно на български език.
Използвай само информацията от CRM данните по-долу.
Ако нещо не е в данните — кажи го честно.

CRM данни:
${context}`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      return NextResponse.json({ success: false, error: 'OpenAI грешка' }, { status: 500 });
    }

    const openaiData = await openaiRes.json();
    const answer = openaiData.choices?.[0]?.message?.content || 'Няма отговор.';

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error('ASSISTANT ROUTE ERROR:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { success: false, error: 'Неизвестна грешка' },
      { status: 500 },
    );
  }
}
