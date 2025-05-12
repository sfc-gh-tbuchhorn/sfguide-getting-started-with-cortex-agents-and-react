import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const resp = await fetch('http://localhost:3001/statements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return new Response(resp.body, { status: resp.status });
}
