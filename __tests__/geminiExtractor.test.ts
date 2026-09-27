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
});
