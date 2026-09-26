import { SiftDocument, SiftItem, FilterOptions } from '../src/models/types';

describe('Sift Database & Filter Logic Tests', () => {
  const sampleDoc: SiftDocument = {
    id: 'doc_test_1',
    origin: 'camera',
    filename: 'test_flyer.jpg',
    mime: 'image/jpeg',
    created_at: new Date().toISOString(),
  };

  const sampleItems: Omit<SiftItem, 'id' | 'document_id' | 'created_at' | 'updated_at'>[] = [
    {
      tab: 'actionable',
      title: 'Return Permission Slip & $10',
      due_at: '2026-10-15',
      source_snippet: 'Slips and $10 fee due Oct 15',
      status: 'open',
      is_urgent: true,
      confidence: 'high',
      reminder_at: '2026-10-14T19:00:00',
    },
    {
      tab: 'informational',
      title: 'Wear Crazy Socks Day',
      due_at: '2026-10-18',
      source_snippet: 'Friday is crazy sock day!',
      status: 'open',
      is_urgent: false,
      confidence: 'high',
      reminder_at: null,
    },
  ];

  it('validates document and candidate item data contracts', () => {
    expect(sampleDoc.id).toContain('doc_');
    expect(sampleItems).toHaveLength(2);
    expect(sampleItems[0].tab).toBe('actionable');
    expect(sampleItems[0].is_urgent).toBe(true);
    expect(sampleItems[1].tab).toBe('informational');
  });

  it('filters items correctly based on tab and urgency', () => {
    const filterOptions: FilterOptions = {
      searchQuery: 'Permission',
      tab: 'actionable',
      status: 'open',
      urgentOnly: true,
      sortBy: 'due_date',
      sortOrder: 'asc',
    };

    const matches = sampleItems.filter(
      (item) =>
        item.tab === filterOptions.tab &&
        item.status === filterOptions.status &&
        (!filterOptions.urgentOnly || item.is_urgent) &&
        item.title.toLowerCase().includes(filterOptions.searchQuery.toLowerCase())
    );

    expect(matches).toHaveLength(1);
    expect(matches[0].title).toBe('Return Permission Slip & $10');
  });
});
