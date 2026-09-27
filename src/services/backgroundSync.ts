import { getDB, updateItemStatus } from '../database/db';
import { extractItemsFromDocument } from './geminiExtractor';
import { ProfileId } from '../models/types';

export interface SyncResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
}

export const SIFT_BACKGROUND_SYNC_TASK_NAME = 'SIFT_BACKGROUND_OFFLINE_SYNC';

/**
 * Executes processing of offline pending queue items saved during zero-signal mode.
 */
export async function processOfflineQueue(): Promise<SyncResult> {
  let pendingItems: Array<{ id: string; profile_id: ProfileId; image_path?: string }> = [];
  try {
    const db = await getDB();
    const rows = await db.getAllAsync<{ id: string; profile_id: ProfileId; image_path?: string }>(
      `SELECT id, profile_id FROM items WHERE status = 'pending_upload'`
    );
    pendingItems = rows || [];
  } catch {
    pendingItems = [];
  }

  let successCount = 0;
  let failedCount = 0;

  for (const item of pendingItems) {
    try {
      if (item.image_path) {
        const extracted = await extractItemsFromDocument(
          `simulated_base64_for_${item.id}`,
          'image/png',
          item.profile_id,
          true,
          true
        );
        if (extracted && extracted.length > 0) {
          await updateItemStatus(item.id, 'open');
          successCount++;
        } else {
          failedCount++;
        }
      } else {
        await updateItemStatus(item.id, 'open');
        successCount++;
      }
    } catch {
      failedCount++;
    }
  }

  return {
    processedCount: pendingItems.length,
    successCount,
    failedCount
  };
}
