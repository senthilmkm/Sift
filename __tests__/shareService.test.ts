import { exportItemsToJSON, exportItemsToCSV, exportAllTasksToExcel } from '../src/services/shareService';
import { SiftItem } from '../src/models/types';
import * as db from '../src/database/db';

jest.mock('../src/database/db', () => ({
  getItems: jest.fn(),
}));

describe('Share Service & Data Export Tests', () => {
  const mockItems: SiftItem[] = [
    {
      id: 'item_123',
      document_id: 'doc_1',
      doc_filename: 'Yearbook_Flyer.jpg',
      tab: 'actionable',
      title: 'Pay $5 for Pizza Day "Special"',
      due_at: '2026-10-12',
      source_snippet: 'due 10/12\nwith text',
      status: 'open',
      is_urgent: true,
      reminder_at: '2026-10-11T19:00:00',
      created_at: '2026-09-26T08:00:00Z',
      updated_at: '2026-09-26T08:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports items to valid JSON string', () => {
    const jsonStr = exportItemsToJSON(mockItems);
    expect(jsonStr).toContain('Pay $5 for Pizza Day');
    const parsed = JSON.parse(jsonStr);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('item_123');
  });

  it('exports items to valid CSV format with sanitized quotes & newlines', () => {
    const csvStr = exportItemsToCSV(mockItems);
    expect(csvStr).toContain('ID,Tab,Title');
    expect(csvStr).toContain('"item_123"');
    expect(csvStr).toContain('"Pay $5 for Pizza Day ""Special"""');
  });

  it('handles exportAllTasksToExcel with items', async () => {
    (db.getItems as jest.Mock).mockResolvedValue(mockItems);
    await expect(exportAllTasksToExcel()).resolves.not.toThrow();
  });

  it('handles exportAllTasksToExcel with 0 items safely', async () => {
    (db.getItems as jest.Mock).mockResolvedValue([]);
    await expect(exportAllTasksToExcel()).resolves.not.toThrow();
  });
});