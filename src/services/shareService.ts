import { Share, Alert } from 'react-native';
import { SiftItem } from '../models/types';
import { getItems } from '../database/db';

export async function shareTaskDetails(item: SiftItem): Promise<void> {
  const message = `⚡ *Sift Task:* ${item.title}\n📅 *Due:* ${item.due_at || 'No Due Date'}\n📄 *Source:* "${item.source_snippet}"${item.notes ? `\n📝 *Notes:* ${item.notes}` : ''}\n\nSent from Sift iOS App`;

  try {
    await Share.share({
      message: message,
      title: `[Sift] ${item.title}`,
    });
  } catch (error) {
    console.error('Error sharing task via native share sheet:', error);
  }
}

function sanitizeCSVField(val: string | null | undefined): string {
  if (!val) return '""';
  const clean = val.replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${clean}"`;
}

export async function exportAllTasksToExcel(): Promise<void> {
  try {
    const actionable = await getItems({ searchQuery: '', tab: 'actionable', status: 'all', urgentOnly: false, sortBy: 'due_date', sortOrder: 'asc' });
    const informational = await getItems({ searchQuery: '', tab: 'informational', status: 'all', urgentOnly: false, sortBy: 'created_at', sortOrder: 'desc' });

    if (actionable.length === 0 && informational.length === 0) {
      if (typeof Alert !== 'undefined' && Alert.alert) {
        Alert.alert('No Tasks to Export', 'There are no active or saved tasks in your database to export to Excel.');
      }
      return;
    }

    let csvContent = `=== SECTION 1: ACTIONABLE TASKS (${actionable.length}) ===\n`;
    csvContent += `Tab,Title,Due Date,Status,Urgent,Flyer Document,Source Snippet,Notes\n`;
    actionable.forEach((item) => {
      csvContent += `${sanitizeCSVField('Actionable')},${sanitizeCSVField(item.title)},${sanitizeCSVField(item.due_at || 'No Due Date')},${sanitizeCSVField(item.status.toUpperCase())},${sanitizeCSVField(item.is_urgent ? 'YES' : 'NO')},${sanitizeCSVField(item.doc_filename || 'School Flyer')},${sanitizeCSVField(item.source_snippet)},${sanitizeCSVField(item.notes || '')}\n`;
    });

    csvContent += `\n=== SECTION 2: INFORMATIONAL REFERENCE NOTES (${informational.length}) ===\n`;
    csvContent += `Tab,Title,Due Date,Status,Urgent,Flyer Document,Source Snippet,Notes\n`;
    informational.forEach((item) => {
      csvContent += `${sanitizeCSVField('Informational')},${sanitizeCSVField(item.title)},${sanitizeCSVField(item.due_at || 'N/A')},${sanitizeCSVField(item.status.toUpperCase())},${sanitizeCSVField(item.is_urgent ? 'YES' : 'NO')},${sanitizeCSVField(item.doc_filename || 'School Flyer')},${sanitizeCSVField(item.source_snippet)},${sanitizeCSVField(item.notes || '')}\n`;
    });

    await Share.share({
      message: csvContent,
      title: 'Sift_Tasks_Export.csv',
    });
  } catch (err) {
    console.error('Failed to export tasks to Excel:', err);
  }
}

export function exportItemsToJSON(items: SiftItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function exportItemsToCSV(items: SiftItem[]): string {
  const headers = ['ID', 'Tab', 'Title', 'Due Date', 'Status', 'Is Urgent', 'Flyer Document', 'Source Snippet', 'Created At'];
  const rows = items.map((i) => [
    sanitizeCSVField(i.id),
    sanitizeCSVField(i.tab),
    sanitizeCSVField(i.title),
    sanitizeCSVField(i.due_at || 'No Due Date'),
    sanitizeCSVField(i.status),
    sanitizeCSVField(i.is_urgent ? 'Yes' : 'No'),
    sanitizeCSVField(i.doc_filename || 'School Flyer'),
    sanitizeCSVField(i.source_snippet),
    sanitizeCSVField(i.created_at),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}