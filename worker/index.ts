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
      const activeProfileId = body.profileId || 'school';

      if (!base64Image) {
        return new Response(JSON.stringify({ error: 'Missing base64Image parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = `
You are Sift's Universal Document & Receipt Extraction Engine.
Analyze this image (which could be a paper receipt, bill, flyer, medical form, HOA notice, school slip, permit, or legal letter).
Current Date today is: ${todayStr}. User's current view profile is '${activeProfileId}'.

UNIVERSAL EXTRACTION & AUTO-PROFILE RULES:
1. ALWAYS EXTRACT RECEIPTS & EXPENSES (FOOD LION, HOME DEPOT, GAS, STORES, PHARMACY):
   If the image is ANY paper receipt, invoice, bill, or proof of purchase:
   - YOU MUST ALWAYS EXTRACT IT! NEVER return 0 items for a receipt.
   - Title Format: "[Merchant Name] — $[Total Amount]" (e.g. "Food Lion — $42.50"). If amount is unclear, use "$0.00".
   - Tab: If there is a return window (e.g. "Returns accepted within 30 days"), extract return expiration date as due_date and set tab="actionable". Otherwise set tab="informational".
   - Tax Category: Identify IRS tax category: "Materials & Supplies" (groceries, hardware, tools, supplies), "Vehicle & Fuel" (gas), "Utilities & Repairs", "Office & Admin", "Professional Fees", or "Uncategorized Expense".
   - Set detected_profile_id = "smallBiz".

2. FOR SCHOOL, MEDICAL, HOA, LEGAL NOTICES:
   - Extract actionable deadlines, forms, permission slips, court dates, or medical preps.
   - Set detected_profile_id to matching profile: "school", "elderCare", "property", or "legalImmigration".

3. ZERO EMPTY RESULT GUARANTEE:
   - If the image contains ANY readable text or document layout, ALWAYS generate at least 1 extracted item card. Never return an empty items list.
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
                vendor_name: { type: 'STRING', description: 'Merchant / Vendor name' },
                detected_profile_id: {
                  type: 'STRING',
                  enum: ['school', 'elderCare', 'smallBiz', 'property', 'legalImmigration'],
                  description: 'Detected profile for auto-categorization'
                }
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