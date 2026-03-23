import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ClientRow = {
  id: number;
  client_name: string | null;
  phone_number: string | null;
  budget: string | null;
  notes: string | null;
  follow_up: string | null;
  status: string | null;
};

type CallLogRow = {
  id: number;
  client_id: number | null;
  call_result: string | null;
  notes: string | null;
  created_at: string;
};

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function safe(value: string | null | undefined) {
  return value || '';
}

function buildClientSummary(client: ClientRow, calls: CallLogRow[]) {
  const latestCalls = calls.slice(0, 3);

  const callsText =
    latestCalls.length > 0
      ? latestCalls
          .map(
            (call, index) =>
              `Call ${index + 1} (${new Date(call.created_at).toLocaleDateString('en-GB')}): ` +
              `${safe(call.call_result)} ${safe(call.notes)}`
          )
          .join('\n')
      : 'No call history yet.';

  return `
Client: ${safe(client.client_name)}
Phone: ${safe(client.phone_number)}
Budget: ${safe(client.budget)}
Interest/Notes: ${safe(client.notes)}
Follow-up: ${safe(client.follow_up)}
Status: ${safe(client.status)}
Recent calls:
${callsText}
`.trim();
}

function answerQuestion(question: string, clients: ClientRow[], callLogs: CallLogRow[]) {
  const q = normalize(question);

  if (!clients.length) {
    return 'No clients were found in the database yet.';
  }

  const callsByClientId = new Map<number, CallLogRow[]>();

  for (const call of callLogs) {
    if (!call.client_id) continue;
    const existing = callsByClientId.get(call.client_id) || [];
    existing.push(call);
    callsByClientId.set(call.client_id, existing);
  }

  for (const [clientId, calls] of callsByClientId.entries()) {
    calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    callsByClientId.set(clientId, calls);
  }

  const matchedClient =
    clients.find((client) => {
      const name = safe(client.client_name).toLowerCase();
      const phone = safe(client.phone_number).toLowerCase();
      return q.includes(name) || (phone && q.includes(phone));
    }) || null;

  if (matchedClient) {
    const clientCalls = callsByClientId.get(matchedClient.id) || [];
    const latestCall = clientCalls[0];

    if (q.includes('yesterday') || q.includes('last call') || q.includes('what did')) {
      if (!latestCall) {
        return `${safe(matchedClient.client_name)} has no call history yet.`;
      }

      return `${safe(matchedClient.client_name)} is currently in the CRM with budget ${
        safe(matchedClient.budget) || 'not specified'
      }, interest "${safe(matchedClient.notes) || 'not specified'}", and follow-up ${
        safe(matchedClient.follow_up) || 'not scheduled'
      }. Latest call summary: ${safe(latestCall.call_result) || 'No summary available'}. Coaching notes: ${
        safe(latestCall.notes) || 'No coaching notes available'
      }.`;
    }

    return buildClientSummary(matchedClient, clientCalls);
  }

  if (q.includes('follow-up') || q.includes('follow up')) {
    const followUps = clients
      .filter((c) => c.follow_up)
      .sort((a, b) => new Date(a.follow_up!).getTime() - new Date(b.follow_up!).getTime())
      .slice(0, 5);

    if (!followUps.length) {
      return 'There are no scheduled follow-ups right now.';
    }

    return `Here are the closest follow-ups:\n${followUps
      .map(
        (client) =>
          `- ${safe(client.client_name)} on ${new Date(client.follow_up!).toLocaleDateString('en-GB')}`
      )
      .join('\n')}`;
  }

  if (q.includes('serious') || q.includes('best lead') || q.includes('hot lead')) {
    const ranked = clients
      .map((client) => {
        const calls = callsByClientId.get(client.id) || [];
        let score = 0;

        if (safe(client.budget)) score += 1;
        if (safe(client.notes)) score += 1;
        if (safe(client.follow_up)) score += 1;
        if (calls.length > 0) score += 2;
        if (calls.some((c) => normalize(safe(c.call_result)).includes('viewing'))) score += 2;
        if (calls.some((c) => normalize(safe(c.call_result)).includes('strong'))) score += 2;

        return { client, score, calls };
      })
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];

    if (!best) {
      return 'No strong lead could be identified yet.';
    }

    return `Current strongest lead: ${safe(best.client.client_name)}. Budget: ${
      safe(best.client.budget) || 'not specified'
    }. Interest: ${safe(best.client.notes) || 'not specified'}. Calls on record: ${
      best.calls.length
    }. Suggested next step: ${
      best.client.follow_up
        ? `follow up on ${new Date(best.client.follow_up).toLocaleDateString('en-GB')}`
        : 'schedule a concrete next step'
    }.`;
  }

  if (q.includes('improve') || q.includes('coaching')) {
    const recentCalls = [...callLogs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    if (!recentCalls.length) {
      return 'There are no recent calls to analyze for coaching yet.';
    }

    const coachingText = recentCalls
      .map((call) => safe(call.notes))
      .filter(Boolean)
      .join(' ');

    if (!coachingText) {
      return 'There are recent calls, but no coaching notes were found yet.';
    }

    return `Main coaching pattern from recent calls: ${coachingText}`;
  }

  const latestClients = clients.slice(0, 5);

  return `I found ${clients.length} clients and ${callLogs.length} call logs in the CRM. Recent clients: ${latestClients
    .map((c) => safe(c.client_name))
    .filter(Boolean)
    .join(', ')}. Ask me about a specific client, follow-ups, strongest leads, or coaching notes.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question is required.' },
        { status: 400 }
      );
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, client_name, phone_number, budget, notes, follow_up, status')
      .order('created_at', { ascending: false })
      .limit(100);

    if (clientsError) {
      return NextResponse.json(
        { success: false, error: `Clients query failed: ${clientsError.message}` },
        { status: 500 }
      );
    }

    const { data: callLogs, error: callsError } = await supabase
      .from('call_logs')
      .select('id, client_id, call_result, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(300);

    if (callsError) {
      return NextResponse.json(
        { success: false, error: `Call logs query failed: ${callsError.message}` },
        { status: 500 }
      );
    }

    const answer = answerQuestion(question, (clients as ClientRow[]) || [], (callLogs as CallLogRow[]) || []);

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error('ASSISTANT ROUTE ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown assistant route error',
      },
      { status: 500 }
    );
  }
}