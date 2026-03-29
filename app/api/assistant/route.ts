import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(value: string | null | undefined) {
  return value || '';
}

// Прости въпроси — отговаря директно от DB без OpenAI
function trySimpleAnswer(question: string, clients: any[], callLogs: any[]): string | null {
  const q = question.toLowerCase().trim();

  if (q.includes('колко клиента') || q.includes('how many clients')) {
    return `Имаш ${clients.length} клиента в CRM-а.`;
  }

  if (q.includes('активни') || q.includes('active clients')) {
    const active = clients.filter(c => c.status === 'Active').length;
    return `Активни клиенти: ${active}.`;
  }

  if (q.includes('follow-up') || q.includes('follow up') || q.includes('фолоуъп')) {
    const followUps = clients
      .filter(c => c.follow_up)
      .sort((a, b) => new Date(a.follow_up).getTime() - new Date(b.follow_up).getTime())
      .slice(0, 5);

    if (!followUps.length) return 'Няма насрочени follow-up-и в момента.';

    return `Най-близките follow-up-и:\n${followUps
      .map(c => `- ${safe(c.client_name)} на ${new Date(c.follow_up).toLocaleDateString('bg-BG')}`)
      .join('\n')}`;
  }

  return null; // не е прост въпрос → праща към OpenAI
}

function buildContext(clients: any[], callLogs: any[]): string {
  const callsByClient = new Map<number, any[]>();
  for (const call of callLogs) {
    if (!call.client_id) continue;
    const existing = callsByClient.get(call.client_id) || [];
    existing.push(call);
    callsByClient.set(call.client_id, existing);
  }

  const clientsText = clients.map(client => {
    const calls = (callsByClient.get(client.id) || []).slice(0, 3);
    const callsText = calls.length > 0
      ? calls.map((c, i) =>
          `  Разговор ${i + 1} (${new Date(c.created_at).toLocaleDateString('bg-BG')}): ${safe(c.call_result)} ${safe(c.notes)}`
        ).join('\n')
      : '  Няма записани разговори.';

    return `Клиент: ${safe(client.client_name)}
  Телефон: ${safe(client.phone_number)}
  Бюджет: ${safe(client.budget)}
  Интерес: ${safe(client.notes)}
  Follow-up: ${safe(client.follow_up)}
  Статус: ${safe(client.status)}
${callsText}`;
  }).join('\n\n');

  return clientsText;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json({ success: false, error: 'Въпросът е задължителен.' }, { status: 400 });
    }

    // 1. Вземи данните от DB
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, client_name, phone_number, budget, notes, follow_up, status')
      .order('created_at', { ascending: false })
      .limit(100);

    if (clientsError) {
      return NextResponse.json({ success: false, error: clientsError.message }, { status: 500 });
    }

    const { data: callLogs, error: callsError } = await supabase
      .from('call_logs')
      .select('id, client_id, call_result, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (callsError) {
      return NextResponse.json({ success: false, error: callsError.message }, { status: 500 });
    }

    const clientList = (clients as any[]) || [];
    const callList = (callLogs as any[]) || [];

    // 2. Провери дали е прост въпрос
    const simpleAnswer = trySimpleAnswer(question, clientList, callList);
    if (simpleAnswer) {
      return NextResponse.json({ success: true, answer: simpleAnswer });
    }

    // 3. Сложен въпрос → OpenAI
    const context = buildContext(clientList, callList);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
      const err = await openaiRes.json();
      return NextResponse.json({ success: false, error: `OpenAI грешка: ${err.error?.message}` }, { status: 500 });
    }

    const openaiData = await openaiRes.json();
    const answer = openaiData.choices?.[0]?.message?.content || 'Няма отговор.';

    return NextResponse.json({ success: true, answer });

  } catch (error) {
    console.error('ASSISTANT ROUTE ERROR:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Неизвестна грешка' },
      { status: 500 }
    );
  }
}