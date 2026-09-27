import { processOfflineQueue } from '../src/services/backgroundSync';
import * as db from '../src/database/db';

jest.mock('../src/database/db', () => ({
  getDB: jest.fn().mockResolvedValue({
    getAllAsync: jest.fn().mockResolvedValue([
      { id: 'item_1', profile_id: 'smallBiz', image_path: 'local_receipt.png' },
      { id: 'item_2', profile_id: 'property', image_path: undefined }
    ])
  }),
  updateItemStatus: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/services/geminiExtractor', () => ({
  extractItemsFromDocument: jest.fn().mockResolvedValue([
    { title: 'Processed Offline Item', due_date: '2026-10-01', is_urgent: false }
  ])
}));

describe('Offline Background Queue Sync', () => {
  it('processes pending offline queue items successfully', async () => {
    const result = await processOfflineQueue();
    expect(result.processedCount).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(db.updateItemStatus).toHaveBeenCalledTimes(2);
  });
});
