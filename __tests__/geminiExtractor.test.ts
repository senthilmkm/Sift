import { getMockCandidateItems } from '../src/services/geminiExtractor';

describe('Gemini Extractor & Candidate Extraction Tests', () => {
  it('returns high-fidelity candidate items from mock extractor', () => {
    const items = getMockCandidateItems();
    expect(items).toBeDefined();
    expect(items.length).toBeGreaterThan(0);

    const actionable = items.find((i) => i.tab === 'actionable');
    expect(actionable).toBeDefined();
    expect(actionable?.title).toContain('Yearbook');
    expect(actionable?.due_date).toBeDefined();
    expect(actionable?.source_snippet).toBeDefined();
  });
});
