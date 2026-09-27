import {
  getMockCandidateItems,
  generateContextualDocumentName,
  extractItemsFromDocument,
} from '../src/services/geminiExtractor';
import { ALL_PROFILES } from '../src/config/profiles';

describe('Gemini Extractor & Contextual Naming Engine', () => {
  test('returns mock candidate items for all 5 smart profiles', () => {
    for (const profileId of ALL_PROFILES) {
      const items = getMockCandidateItems(profileId);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].profile_id).toBe(profileId);
    }
  });

  test('generates contextual document names accurately', () => {
    expect(generateContextualDocumentName([])).toBe('Scanned Notice');

    const yearbookItems = getMockCandidateItems('school');
    expect(generateContextualDocumentName(yearbookItems)).toBe('Yearbook Notice');

    const medicalItems = getMockCandidateItems('elderCare');
    expect(generateContextualDocumentName(medicalItems)).toBe('Medical Directive');

    const bizItems = getMockCandidateItems('smallBiz');
    expect(generateContextualDocumentName(bizItems)).toBe('Business Permit Notice');

    const legalItems = getMockCandidateItems('legalImmigration');
    expect(generateContextualDocumentName(legalItems)).toBe('Legal Notice');
  });

  test('extractItemsFromDocument falls back to mock items on network error', async () => {
    const items = await extractItemsFromDocument('fake_base64', 'image/png', 'elderCare', true, true);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].profile_id).toBe('elderCare');
  });

  test('scans and processes Food Lion receipt accurately with actionable tab and tax categorization', async () => {
    const originalFetch = global.fetch;
    const mockFoodLionResponse = {
      items: [
        {
          title: 'Food Lion — $42.50',
          tab: 'actionable',
          due_date: '2026-09-27',
          source_snippet: 'Food Lion Store #1422. Total: $42.50. Tax: $2.10. Visa ending in 4122.',
          confidence: 'high',
          is_urgent: false,
          tax_category: 'Materials & Supplies',
          total_amount: '42.50',
          vendor_name: 'Food Lion',
          detected_profile_id: 'smallBiz',
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockFoodLionResponse,
    }) as any;

    try {
      const items = await extractItemsFromDocument('valid_food_lion_base64', 'image/jpeg', 'smallBiz', false, true);

      expect(items.length).toBe(1);
      expect(items[0].title).toBe('Food Lion — $42.50');
      expect(items[0].tab).toBe('actionable');
      expect(items[0].profile_id).toBe('smallBiz');

      const docName = generateContextualDocumentName(items);
      expect(docName).toBe('Store Receipt');

      const metadata = JSON.parse(items[0].metadata_json || '{}');
      expect(metadata.vendor_name).toBe('Food Lion');
      expect(metadata.total_amount).toBe('42.50');
      expect(metadata.tax_category).toBe('Materials & Supplies');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
