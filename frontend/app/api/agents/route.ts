// frontend/app/api/agents/route.ts
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('--- /api/agents hit ---');
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers)));

    const raw = await req.text();
    console.log('Raw body:', raw);

    // (optional) basic JSON validation
    let bodyJson: unknown;
    try {
      bodyJson = JSON.parse(raw);
    } catch (e) {
      console.error('Bad JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Body is not valid JSON' }),
        { status: 400 }
      );
    }

    // forward to backend
    const resp = await fetch('http://localhost:3001/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyJson),
    });

    console.log('Backend status', resp.status);
    return new Response(resp.body, {
      status: resp.status,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (err: unknown) {
    const error =
    err instanceof Error ? err : new Error(String(err));
    console.error('Unhandled error in /api/agents:', err);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

