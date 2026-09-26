import * as SQLite from 'expo-sqlite';
import { SiftItem, SiftDocument, FilterOptions, UserPreferences, AutoDeletePeriod, ItemTab } from '../models/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync('sift_v1.db');
  await initTables(dbInstance);
  return dbInstance;
}

async function initTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY NOT NULL,
      origin TEXT NOT NULL,
      filename TEXT NOT NULL,
      mime TEXT NOT NULL,
      image_path TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      document_id TEXT NOT NULL,
      tab TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      due_at TEXT,
      source_snippet TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      is_urgent INTEGER NOT NULL DEFAULT 0,
      reminder_at TEXT,
      notification_id TEXT,
      confidence TEXT NOT NULL DEFAULT 'high',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enable_notifications INTEGER NOT NULL DEFAULT 1,
      default_reminder_time TEXT NOT NULL DEFAULT '19:00_nightbefore',
      reminder_sound TEXT NOT NULL DEFAULT 'default',
      auto_delete_period TEXT NOT NULL DEFAULT 'never',
      free_scans_used INTEGER NOT NULL DEFAULT 0,
      is_subscribed INTEGER NOT NULL DEFAULT 0,
      active_plan_id TEXT
    );
  `);

  try {
    await database.execAsync(`ALTER TABLE user_preferences ADD COLUMN enable_notifications INTEGER NOT NULL DEFAULT 1;`);
  } catch (err) {
    // Column already exists
  }

  await database.execAsync(`
    INSERT OR IGNORE INTO user_preferences (id, enable_notifications, default_reminder_time, reminder_sound, auto_delete_period, free_scans_used, is_subscribed)
    VALUES (1, 1, '19:00_nightbefore', 'default', 'never', 0, 0);
  `);
}

export async function saveDocumentAndItems(
  doc: SiftDocument,
  items: Omit<SiftItem, 'id' | 'document_id' | 'created_at' | 'updated_at'>[]
): Promise<SiftItem[]> {
  const database = await getDB();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO documents (id, origin, filename, mime, image_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [doc.id, doc.origin, doc.filename, doc.mime, doc.image_path || null, doc.created_at || now]
  );

  const savedItems: SiftItem[] = [];

  for (const item of items) {
    const id = 'item_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const newItem: SiftItem = {
      ...item,
      id,
      document_id: doc.id,
      doc_filename: doc.filename,
      created_at: now,
      updated_at: now,
    };

    await database.runAsync(
      `INSERT INTO items (id, document_id, tab, title, notes, due_at, source_snippet, status, is_urgent, reminder_at, notification_id, confidence, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newItem.id,
        newItem.document_id,
        newItem.tab,
        newItem.title,
        newItem.notes || null,
        newItem.due_at,
        newItem.source_snippet,
        newItem.status,
        newItem.is_urgent ? 1 : 0,
        newItem.reminder_at,
        newItem.notification_id || null,
        newItem.confidence || 'high',
        newItem.created_at,
        newItem.updated_at,
      ]
    );

    savedItems.push(newItem);
  }

  return savedItems;
}

export async function getItems(options: FilterOptions): Promise<SiftItem[]> {
  const database = await getDB();
  let query = `SELECT items.*, documents.filename as doc_filename, documents.image_path as image_path FROM items LEFT JOIN documents ON items.document_id = documents.id WHERE items.status != 'archived'`;
  const params: any[] = [];

  if (options.tab) {
    query += ` AND items.tab = ?`;
    params.push(options.tab);
  }

  if (options.status && options.status !== 'all') {
    query += ` AND items.status = ?`;
    params.push(options.status);
  }

  if (options.urgentOnly) {
    query += ` AND items.is_urgent = 1`;
  }

  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    query += ` AND (items.title LIKE ? OR items.source_snippet LIKE ? OR items.notes LIKE ? OR documents.filename LIKE ?)`;
    const searchParam = `%${options.searchQuery.trim()}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  switch (options.sortBy) {
    case 'due_date':
      query += ` ORDER BY items.due_at ${options.sortOrder.toUpperCase()} NULLS LAST`;
      break;
    case 'urgency':
      query += ` ORDER BY items.due_at ASC NULLS LAST`;
      break;
    case 'title':
      query += ` ORDER BY items.title ${options.sortOrder.toUpperCase()}`;
      break;
    case 'created_at':
    default:
      query += ` ORDER BY items.created_at ${options.sortOrder.toUpperCase()}`;
      break;
  }

  const rows = await database.getAllAsync<any>(query, params);

  return rows.map((r) => ({
    id: r.id,
    document_id: r.document_id,
    doc_filename: r.doc_filename || 'Document Notice',
    image_path: r.image_path,
    tab: r.tab,
    title: r.title,
    notes: r.notes,
    due_at: r.due_at,
    source_snippet: r.source_snippet,
    status: r.status,
    is_urgent: r.is_urgent === 1,
    reminder_at: r.reminder_at,
    notification_id: r.notification_id,
    confidence: r.confidence,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function getArchivedItems(): Promise<SiftItem[]> {
  const database = await getDB();
  const rows = await database.getAllAsync<any>(
    `SELECT items.*, documents.filename as doc_filename, documents.image_path as image_path FROM items LEFT JOIN documents ON items.document_id = documents.id WHERE items.status = 'archived' ORDER BY items.updated_at DESC`
  );

  return rows.map((r) => ({
    id: r.id,
    document_id: r.document_id,
    doc_filename: r.doc_filename || 'Document Notice',
    image_path: r.image_path,
    tab: r.tab,
    title: r.title,
    notes: r.notes,
    due_at: r.due_at,
    source_snippet: r.source_snippet,
    status: r.status,
    is_urgent: r.is_urgent === 1,
    reminder_at: r.reminder_at,
    notification_id: r.notification_id,
    confidence: r.confidence,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function archiveItem(id: string): Promise<void> {
  const database = await getDB();
  const now = new Date().toISOString();
  await database.runAsync(`UPDATE items SET status = 'archived', updated_at = ? WHERE id = ?`, [now, id]);
}

export async function restoreArchivedItem(id: string): Promise<void> {
  const database = await getDB();
  const now = new Date().toISOString();
  await database.runAsync(`UPDATE items SET status = 'open', updated_at = ? WHERE id = ?`, [now, id]);
}

export async function updateItemDetails(
  id: string,
  title: string,
  notes: string | null,
  dueAt: string | null,
  tab: ItemTab
): Promise<void> {
  const database = await getDB();
  const now = new Date().toISOString();
  await database.runAsync(
    `UPDATE items SET title = ?, notes = ?, due_at = ?, tab = ?, updated_at = ? WHERE id = ?`,
    [title, notes, dueAt, tab, now, id]
  );
}

export async function updateItemStatus(id: string, status: SiftItem['status']): Promise<void> {
  const database = await getDB();
  const now = new Date().toISOString();
  await database.runAsync(`UPDATE items SET status = ?, updated_at = ? WHERE id = ?`, [status, now, id]);
}

export async function toggleItemUrgent(id: string, isUrgent: boolean): Promise<void> {
  const database = await getDB();
  const now = new Date().toISOString();
  await database.runAsync(`UPDATE items SET is_urgent = ?, updated_at = ? WHERE id = ?`, [isUrgent ? 1 : 0, now, id]);
}

export async function promoteToActionable(id: string, dueAt: string): Promise<void> {
  const database = await getDB();
  const now = new Date().toISOString();
  await database.runAsync(
    `UPDATE items SET tab = 'actionable', due_at = ?, status = 'open', updated_at = ? WHERE id = ?`,
    [dueAt, now, id]
  );
}

export async function deleteItem(id: string): Promise<void> {
  const database = await getDB();
  await database.runAsync(`DELETE FROM items WHERE id = ?`, [id]);
}

export async function autoDeleteOldItems(period: AutoDeletePeriod): Promise<number> {
  if (period === 'never') return 0;
  const database = await getDB();

  let days = 30;
  if (period === '1w') days = 7;
  if (period === '2w') days = 14;
  if (period === '4w') days = 28;
  if (period === '90d') days = 90;
  if (period === '180d') days = 180;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = await database.runAsync(`DELETE FROM items WHERE created_at < ? AND status IN ('done', 'read', 'archived')`, [cutoff]);

  return result.changes;
}

export async function resetDatabase(): Promise<void> {
  const database = await getDB();
  await database.execAsync(`
    DELETE FROM items;
    DELETE FROM documents;
    UPDATE user_preferences SET free_scans_used = 0, is_subscribed = 0 WHERE id = 1;
  `);
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const database = await getDB();
  const row = await database.getFirstAsync<any>(`SELECT * FROM user_preferences WHERE id = 1`);
  if (!row) {
    return {
      enableNotifications: true,
      defaultReminderTime: '19:00_nightbefore',
      reminderSound: 'default',
      autoDeletePeriod: 'never',
      freeScansUsed: 0,
      isSubscribed: false,
    };
  }

  return {
    enableNotifications: row.enable_notifications !== undefined ? row.enable_notifications !== 0 : true,
    defaultReminderTime: row.default_reminder_time || '19:00_nightbefore',
    reminderSound: row.reminder_sound || 'default',
    autoDeletePeriod: row.auto_delete_period || 'never',
    freeScansUsed: row.free_scans_used || 0,
    isSubscribed: row.is_subscribed === 1,
    activePlanId: row.active_plan_id,
  };
}

export async function updateUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const database = await getDB();
  const current = await getUserPreferences();
  const updated = { ...current, ...prefs };

  await database.runAsync(
    `UPDATE user_preferences SET 
      enable_notifications = ?,
      default_reminder_time = ?,
      reminder_sound = ?,
      auto_delete_period = ?,
      free_scans_used = ?,
      is_subscribed = ?,
      active_plan_id = ?
     WHERE id = 1`,
    [
      updated.enableNotifications ? 1 : 0,
      updated.defaultReminderTime,
      updated.reminderSound,
      updated.autoDeletePeriod,
      updated.freeScansUsed,
      updated.isSubscribed ? 1 : 0,
      updated.activePlanId || null,
    ]
  );
}