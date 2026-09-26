export interface Env {
  GEMINI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    try {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration: GEMINI_API_KEY missing' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const body: any = await request.json();
      const base64Image = body.base64Image;
      const mimeType = body.mimeType || 'image/jpeg';

      if (!base64Image) {
        return new Response(JSON.stringify({ error: 'Missing base64Image parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = `
Analyze this document, paper notice, flyer, form, or letter image. Be EXTREMELY SELECTIVE and HIGHLY CONCISE.
Do NOT convert every line or sentence into an item. Sift down the document to at most 3 to 5 critical takeaways.
Current Date today is: ${todayStr}.

CRITICAL FILTERING & DUE DATE RULES:
1. "actionable" (High Priority):
   - Only extract items requiring explicit user action: deadline date, order link/website URL, fee payment, permission slip return date, yearbook orders, or specific items to bring.
   - Example (Yearbook Flyer): "Order Yearbook ($25) at yearbookordercenter.com by May 15" -> Title: "Order Yearbook ($25)", Due Date: "2026-05-15".
   - CONTEXT-BASED DUE DATES: Carefully examine the ENTIRE image/flyer context. Look for dates, deadlines, days of week, order end dates, event dates, or month references anywhere on the page (e.g. "Order by Friday", "End of May", "Due Oct 15", "Sale ends 12/01").
   - YEAR INFERENCE: If the document omits the year (e.g. "Due May 15"), infer the correct current or upcoming calendar year relative to Today (${todayStr}).
   - SOONEST FLYER DATE INHERITANCE: Every actionable item MUST have a valid due_date. If an actionable item lacks a specific deadline printed right beside it, inspect all dates present on the flyer and assign the SOONEST (earliest upcoming) date found on the document. Only if NO date exists anywhere on the entire page, default due_date to 7 days from Today (${todayStr}) so an alert can be scheduled.
2. "informational" (Selective Reference Only):
   - Only extract major key events, theme days (e.g. Spirit Week themes, Picture Day dress code), or critical schedules.
   - IGNORE boilerplate text, header greetings, organization addresses, generic rules, and newsletter fluff.
3. Keep titles short, clean, and actionable (5-10 words max).
`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const responseSchema = {
        type: 'OBJECT',
        properties: {
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                tab: { type: 'STRING', enum: ['actionable', 'informational'] },
                due_date: { type: 'STRING', description: 'ISO YYYY-MM-DD string' },
                due_time: { type: 'STRING', description: 'HH:MM or null' },
                source_snippet: { type: 'STRING' },
                confidence: { type: 'STRING', enum: ['high', 'check_date'] },
                is_urgent: { type: 'BOOLEAN' },
              },
              required: ['title', 'tab', 'due_date', 'source_snippet', 'confidence'],
            },
          },
        },
      };

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Image,
                  mimeType: mimeType,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      };

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!geminiResponse.ok) {
        const errText = await geminiResponse.text();
        return new Response(JSON.stringify({ error: 'Gemini API call failed', details: errText }), {
          status: geminiResponse.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const geminiData: any = await geminiResponse.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsedJSON = JSON.parse(rawText);

      return new Response(JSON.stringify(parsedJSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};