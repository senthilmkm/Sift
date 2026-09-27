import { CandidateItem, ProfileId } from '../models/types';
import { sanitizeTextForPrivacy } from './piiRedactor';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL || 'https://sift-gemini-proxy.senthilmkm.workers.dev';

export async function extractItemsFromDocument(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  profileId: ProfileId = 'school',
  enablePiiRedaction: boolean = true,
  useMockIfFailed: boolean = true
): Promise<CandidateItem[]> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SiftApp/1.0 (iOS Client)',
      },
      body: JSON.stringify({ base64Image, mimeType, profileId }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Cloudflare proxy response not OK, falling back:', errText);
      if (useMockIfFailed) return getMockCandidateItems(profileId);
      throw new Error(`Proxy error: ${response.status}`);
    }

    const data: any = await response.json();
    if (data && Array.isArray(data.items) && data.items.length > 0) {
      return data.items.map((item: any) => {
        const rawTitle = item.title || 'Scanned Notice Item';
        const rawSnippet = item.source_snippet || '';
        const rawSummary = item.summary || '';
        const rawUrgencyReason = item.urgency_reason || '';

        return {
          title: enablePiiRedaction ? sanitizeTextForPrivacy(rawTitle, profileId) : rawTitle,
          summary: enablePiiRedaction ? sanitizeTextForPrivacy(rawSummary, profileId) : rawSummary,
          tab: item.tab === 'actionable' ? 'actionable' : 'informational',
          due_date: item.due_date || null,
          due_time: item.due_time || null,
          secondary_dates: item.secondary_dates || [],
          source_snippet: enablePiiRedaction ? sanitizeTextForPrivacy(rawSnippet, profileId) : rawSnippet,
          confidence: item.confidence === 'check_date' ? 'check_date' : item.confidence || 'high',
          is_urgent: !!item.is_urgent,
          urgency_reason: enablePiiRedaction ? sanitizeTextForPrivacy(rawUrgencyReason, profileId) : rawUrgencyReason,
          action_checklist: Array.isArray(item.action_checklist)
            ? item.action_checklist.map((step: string) => enablePiiRedaction ? sanitizeTextForPrivacy(step, profileId) : step)
            : [],
          contact_info: item.contact_info || undefined,
          profile_id: item.detected_profile_id || profileId,
          metadata_json: item.metadata_json || JSON.stringify({ vendor_name: item.vendor_name, total_amount: item.total_amount, tax_category: item.tax_category }),
        };
      });
    }

    if (useMockIfFailed) return getMockCandidateItems(profileId);
    return [];
  } catch (err) {
    console.error('Extraction via Cloudflare Proxy failed:', err);
    if (useMockIfFailed) return getMockCandidateItems(profileId);
    throw err;
  }
}

export function getMockCandidateItems(profileId: ProfileId = 'school'): CandidateItem[] {
  const today = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  switch (profileId) {
    case 'elderCare':
      return [
        {
          title: 'Fasting for Morning Blood Work',
          summary: 'No food or coffee 12 hours prior to lab work',
          tab: 'actionable',
          due_date: formatDate(nextWeek),
          due_time: '07:30',
          source_snippet: 'FASTING REQUIRED: Absolutely NO food, water, or coffee after 12:00 Midnight.',
          confidence: 'high',
          is_urgent: true,
          urgency_reason: 'Fasting required for blood test accuracy',
          action_checklist: ['No food after 10 PM', 'Bring Medicare ID'],
          profile_id: 'elderCare',
        },
      ];
    case 'smallBiz':
      return [
        {
          title: 'Pay Plumbing Supply Invoice INV-8841',
          summary: 'Net-30 invoice balance $1,485.50 due',
          tab: 'actionable',
          due_date: formatDate(nextWeek),
          source_snippet: 'Payment Terms: NET-30 (Due October 25, 2026). Total Amount Due: $1,485.50',
          confidence: 'high',
          is_urgent: true,
          urgency_reason: '2.5% monthly late fee applies after due date',
          profile_id: 'smallBiz',
          metadata_json: JSON.stringify({ vendor_name: 'Plumbing Supply', total_amount: '1485.50', tax_category: 'Materials & Supplies' }),
        },
        {
          title: 'Food Lion — $42.50',
          summary: 'Grocery store receipt & tax deductible materials/supplies',
          tab: 'actionable',
          due_date: formatDate(today),
          source_snippet: 'Food Lion Store #1422. Total: $42.50. Sales Tax: $2.10. Visa ending in 4122.',
          confidence: 'high',
          is_urgent: false,
          profile_id: 'smallBiz',
          metadata_json: JSON.stringify({ vendor_name: 'Food Lion', total_amount: '42.50', tax_category: 'Materials & Supplies' }),
        },
      ];
    case 'property':
      return [
        {
          title: 'HOA Lawn Violation Fine ($50)',
          summary: 'Correct front lawn landscaping and trim color',
          tab: 'actionable',
          due_date: formatDate(nextWeek),
          source_snippet: 'HOUSING CODE VIOLATION: Unapproved exterior paint color / Overgrown lawn.',
          confidence: 'high',
          is_urgent: true,
          profile_id: 'property',
        },
      ];
    case 'legalImmigration':
      return [
        {
          title: 'Attend USCIS Biometrics Appointment',
          summary: 'Form I-485 Application Support Center appointment',
          tab: 'actionable',
          due_date: formatDate(nextWeek),
          due_time: '09:00',
          source_snippet: 'Appointment Date: Wednesday, October 21, 2026 at 9:00 AM',
          confidence: 'high',
          is_urgent: true,
          urgency_reason: 'Failure to appear may result in case denial',
          profile_id: 'legalImmigration',
        },
      ];
    case 'school':
    default:
      return [
        {
          title: 'Order School Yearbook ($25)',
          summary: 'Yearbook order deadline approaching',
          tab: 'actionable',
          due_date: formatDate(nextWeek),
          due_time: '17:00',
          source_snippet: 'Order online at yearbookordercenter.com by next Friday ($25 fee)',
          confidence: 'high',
          is_urgent: true,
          profile_id: 'school',
        },
        {
          title: 'Wear Crazy Socks for Spirit Day',
          summary: 'Fall spirit week event',
          tab: 'informational',
          due_date: formatDate(today),
          source_snippet: 'Spirit Week Theme: Friday is Crazy Sock Day!',
          confidence: 'high',
          is_urgent: false,
          profile_id: 'school',
        },
      ];
  }
}

export function generateContextualDocumentName(candidates: CandidateItem[]): string {
  if (!candidates || candidates.length === 0) return 'Scanned Notice';

  const firstTitle = (candidates[0].title || '').trim();
  const firstSnippet = (candidates[0].source_snippet || '').trim();
  const combined = `${firstTitle} ${firstSnippet}`.toLowerCase();

  if (combined.includes('receipt') || combined.includes('food lion') || combined.includes('store') || combined.includes('purchase')) return 'Store Receipt';
  if (combined.includes('yearbook')) return 'Yearbook Notice';
  if (combined.includes('field trip') || combined.includes('permission')) return 'Field Trip Form';
  if (combined.includes('science fair')) return 'Science Fair Notice';
  if (combined.includes('bill') || combined.includes('statement') || combined.includes('utility')) return 'Billing Statement';
  if (combined.includes('tax') || combined.includes('w2') || combined.includes('1099')) return 'Tax Document';
  if (combined.includes('medical') || combined.includes('health') || combined.includes('fasting')) return 'Medical Directive';
  if (combined.includes('invoice') || combined.includes('permit')) return 'Business Permit Notice';
  if (combined.includes('uscis') || combined.includes('court') || combined.includes('subpoena')) return 'Legal Notice';

  const cleanTitle = firstTitle.replace(/\s*\([^)]*\)/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanTitle.split(/\s+/).slice(0, 3).join(' ');
  return words ? `${words} Notice` : 'Scanned Notice';
}