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
Analyze this image (which could be a paper receipt, bill, flyer, medical form, hospital bill, pharmacy slip, dental receipt or appointment notice, HOA notice, school slip, permit, or legal letter).
Current Date today is: ${todayStr}. User's current view profile is '${activeProfileId}'.

GLOBAL RECEIPT & TRANSACTION EXTRACTION RULES (ANY STORE, ANY COUNTRY, ANY CURRENCY, ANY DOMAIN):
1. ALWAYS EXTRACT ANY STORE RECEIPT, INVOICE, BILL, OR PROOF OF PURCHASE WORLDWIDE:
   - APPLIES TO: Any retail store, supermarket, restaurant, gas station, online merchant, wholesale vendor, service provider, repair shop, pharmacy (CVS, Walgreens, Rite Aid, local pharmacy), hospital, dental clinic, medical practice, hardware store, utility bill, or contractor invoice across ANY country, currency ($, €, £, ¥, ₹, etc.), language, or domain.
   - MANDATORY ACTION: YOU MUST ALWAYS EXTRACT IT! NEVER return 0 items for any receipt or transaction document.
   - Title Format: "[Merchant/Provider Name] — [Currency Symbol][Total Amount]" (e.g. "CVS Pharmacy — $18.50", "City Hospital — $150.00", "Bright Smile Dental — $45.00", "Food Lion — $42.50"). If amount is unclear, use "$0.00".
   - Tab: If there is an active payment deadline, appointment time, or return window, set due_date and tab="actionable". Otherwise set tab="informational".
   - Tax Category (IRS & Global Business/Personal Expense Standard):
     - "Materials & Supplies" (groceries, retail items, raw materials, hardware, equipment <$2,500)
     - "Vehicle & Fuel" (fuel, auto repairs, parking, tolls, transportation)
     - "Utilities & Repairs" (electricity, water, internet, building/machine maintenance)
     - "Office & Admin" (stationery, software subscriptions, shipping, postage, office supplies)
     - "Professional Fees" (licensing, municipal permits, legal fees, sub-contractor B2B invoices)
     - "Uncategorized Expense" (Default fallback if transaction type is ambiguous or non-business)
   - Set detected_profile_id = "smallBiz" for general store/business receipts, OR "elderCare" for medical, hospital, pharmacy, and dental receipts/bills/appointments.

2. FOR MEDICAL, HOSPITAL, PHARMACY & DENTAL SERVICES:
   - APPLIES TO: Doctor appointments, hospital discharge notices, dental checkup reminders, pharmacy prescriptions/refills, health insurance Explanation of Benefits (EOB), lab test instructions, dental bills, and co-pay receipts.
   - MANDATORY ACTION: Extract appointment dates, fasting/prep instructions, payment due dates, prescription refill deadlines, and provider contact numbers.
   - Set detected_profile_id = "elderCare" (Family Health & Medical Care).

3. FOR SCHOOL, HOA, LEGAL NOTICES:
   - Extract actionable deadlines, forms, permission slips, court dates, or HOA violations.
   - Set detected_profile_id to matching profile: "school", "property", or "legalImmigration".

4. ZERO EMPTY RESULT GUARANTEE:
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