import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker query parameter is required' }, { status: 400 });
    }

    if (!process.env.ANAKIN_API_KEY) {
      return NextResponse.json({ error: 'ANAKIN_API_KEY is not configured in .env' }, { status: 400 });
    }

    const responseSubmit = await fetch('https://api.anakin.io/v1/agentic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.ANAKIN_API_KEY },
      body: JSON.stringify({
        prompt: `Explain why stock ticker $${ticker} has divergence between retail social chatter on Reddit and real market volume or price metrics. What are the current catalysts? Summarize in 3 concise bullet points.`,
      }),
    });

    const submitData = await responseSubmit.json();
    if (!responseSubmit.ok) throw new Error(submitData.message || 'Failed to initialize agentic search');

    const { job_id } = submitData;
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const responsePoll = await fetch(`https://api.anakin.io/v1/agentic-search/${job_id}`, {
        headers: { 'X-API-Key': process.env.ANAKIN_API_KEY },
      });
      const pollData = await responsePoll.json();
      if (!responsePoll.ok) throw new Error(pollData.message || 'Polling failed');

      if (pollData.status === 'completed') {
        const answer = pollData.generatedJson?.summary || pollData.summary || 'No summary report returned.';
        return NextResponse.json({ ticker, summary: typeof answer === 'object' ? JSON.stringify(answer) : answer });
      }

      if (pollData.status === 'failed') throw new Error(pollData.message || 'Agentic search execution failed');
    }

    throw new Error('Agentic search timed out after 60 seconds');
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
