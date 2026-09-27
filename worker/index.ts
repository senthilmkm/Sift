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
      const profileId = body.profileId || 'school';

      if (!base64Image) {
        return new Response(JSON.stringify({ error: 'Missing base64Image parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = `
Analyze this document, paper notice, flyer, form, receipt, or letter image for profile '${profileId}'.
Current Date today is: ${todayStr}.

CRITICAL EXTRACTION & TAX CATEGORIZATION RULES:
1. "actionable" (High Priority):
   - Only extract items requiring explicit user action: deadline date, order link/website URL, fee payment, permission slip return date, or return window expiration.
   - For RECEIPTS / INVOICES: If there is a return window (e.g. "Returns accepted within 30 days"), extract the return expiration date as due_date.

2. "informational" (Selective Reference Only):
   - For paper receipts without active return deadlines, categorize as "informational".

3. TAX CATEGORIZATION (FOR RECEIPTS & INVOICES):
   Identify the appropriate IRS tax category:
   - "Materials & Supplies" (building materials, hardware, parts, tools, grocery/food supplies)
   - "Vehicle & Fuel" (gas receipts, auto parts, parking)
   - "Utilities & Repairs" (utility bills, equipment repair)
   - "Office & Admin" (paper, ink, software, postage)
   - "Professional Fees" (permits, licensing, subcontractor fees)
   - DEFAULT FALLBACK: "Uncategorized Expense" (if type cannot be identified with high confidence).

4. Keep titles short, clean, and actionable (e.g. "Food Lion — $42.50 (Groceries/Supplies)").
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
                due_date: { type: 'STRING', description: 'ISO YYYY-MM-DD string or null' },
                due_time: { type: 'STRING', description: 'HH:MM or null' },
                source_snippet: { type: 'STRING' },
                confidence: { type: 'STRING', enum: ['high', 'check_date'] },
                is_urgent: { type: 'BOOLEAN' },
                tax_category: {
                  type: 'STRING',
                  enum: [
                    'Materials & Supplies',
                    'Vehicle & Fuel',
                    'Utilities & Repairs',
                    'Office & Admin',
                    'Professional Fees',
                    'Uncategorized Expense'
                  ],
                  description: 'Default to Uncategorized Expense if unknown'
                },
                total_amount: { type: 'STRING', description: 'Total dollar amount or 0.00' },
                vendor_name: { type: 'STRING', description: 'Merchant / Vendor name' }
              },
              required: ['title', 'tab', 'source_snippet', 'confidence'],
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