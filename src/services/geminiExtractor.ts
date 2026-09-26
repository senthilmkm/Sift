import { CandidateItem } from '../models/types';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL || 'https://sift-gemini-proxy.senthilmkm.workers.dev';

export async function extractItemsFromDocument(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  useMockIfFailed: boolean = true
): Promise<CandidateItem[]> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Cloudflare proxy response not OK, falling back:', errText);
      if (useMockIfFailed) return getMockCandidateItems();
      throw new Error(`Proxy error: ${response.status}`);
    }

    const data: any = await response.json();
    if (data && Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        title: item.title,
        tab: item.tab === 'actionable' ? 'actionable' : 'informational',
        due_date: item.due_date || null,
        due_time: item.due_time || null,
        source_snippet: item.source_snippet || '',
        confidence: item.confidence === 'check_date' ? 'check_date' : 'high',
        is_urgent: !!item.is_urgent,
      }));
    }

    return getMockCandidateItems();
  } catch (err) {
    console.error('Extraction via Cloudflare Proxy failed:', err);
    if (useMockIfFailed) return getMockCandidateItems();
    throw err;
  }
}

export function getMockCandidateItems(): CandidateItem[] {
  const today = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  return [
    {
      title: 'Order School Yearbook ($25)',
      tab: 'actionable',
      due_date: formatDate(nextWeek),
      due_time: '17:00',
      source_snippet: 'Order online at yearbookordercenter.com by next Friday ($25 fee)',
      confidence: 'high',
      is_urgent: true,
    },
    {
      title: 'Wear Crazy Socks for Spirit Day',
      tab: 'informational',
      due_date: formatDate(today),
      source_snippet: 'Spirit Week Theme: Friday is Crazy Sock Day!',
      confidence: 'high',
      is_urgent: false,
    },
  ];
}


export function generateContextualDocumentName(candidates: CandidateItem[]): string {
  if (!candidates || candidates.length === 0) return 'Scanned Notice';

  const firstTitle = (candidates[0].title || '').trim();
  const firstSnippet = (candidates[0].source_snippet || '').trim();
  const combined = `${firstTitle} ${firstSnippet}`.toLowerCase();

  if (combined.includes('yearbook')) return 'Yearbook Notice';
  if (combined.includes('field trip') || combined.includes('permission')) return 'Field Trip Form';
  if (combined.includes('science fair')) return 'Science Fair Notice';
  if (combined.includes('bill') || combined.includes('statement') || combined.includes('utility')) return 'Billing Statement';
  if (combined.includes('tax') || combined.includes('w2') || combined.includes('1099')) return 'Tax Document';
  if (combined.includes('medical') || combined.includes('health') || combined.includes('vaccine')) return 'Health Record';
  if (combined.includes('schedule') || combined.includes('calendar')) return 'Event Schedule';
  if (combined.includes('menu') || combined.includes('lunch') || combined.includes('pizza')) return 'Food Notice';

  const cleanTitle = firstTitle.replace(/\s*\([^)]*\)/g, '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = cleanTitle.split(/\s+/).slice(0, 3).join(' ');
  return words ? `${words} Notice` : 'Scanned Notice';
}