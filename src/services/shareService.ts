import { Share, Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { SiftItem } from '../models/types';
import { getItems } from '../database/db';

export function exportItemsToJSON(items: SiftItem[]): string {
  return JSON.stringify(items, null, 2);
}

export function exportItemsToCSV(items: SiftItem[]): string {
  let csv = 'ID,Tab,Title,Due Date,Status,Urgent,Document,Source Snippet,Notes\n';
  items.forEach((item) => {
    const titleClean = (item.title || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
    const snippetClean = (item.source_snippet || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
    const notesClean = (item.notes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
    csv += `"${item.id}","${item.tab}","${titleClean}","${item.due_at || ''}","${item.status}","${item.is_urgent ? 'YES' : 'NO'}","${item.doc_filename || ''}","${snippetClean}","${notesClean}"\n`;
  });
  return csv;
}

export async function shareTaskDetails(item: SiftItem): Promise<void> {
  const message = `⚡ *Sift Task:* ${item.title}\n📅 *Due:* ${item.due_at || 'No Due Date'}\n📄 *Source:* "${item.source_snippet}"${item.notes ? `\n📝 *Notes:* ${item.notes}` : ''}\n\n⚡ *Summarized with Sift iOS:* https://senthilmkm.github.io/Sift/index.html`;

  try {
    await Share.share({
      message: message,
      title: `[Sift] ${item.title}`,
    });
  } catch (error) {
    console.error('Error sharing task via native share sheet:', error);
  }
}

export async function shareClassGroupSummary(
  items: { title: string; due_date?: string | null; notes?: string | null; source_snippet?: string | null; doc_filename?: string | null; tab?: string }[],
  flyerName: string = 'Document Notice'
): Promise<void> {
  if (items.length === 0) return;

  let msg = `📢 *${flyerName} Summary:*

`;
  items.forEach((item) => {
    const dueStr = item.due_date ? ` (Due: ${item.due_date})` : '';
    msg += `• *${item.title}*${dueStr}
`;
    if (item.notes && item.notes.trim()) {
      msg += `  📝 Notes: ${item.notes.trim()}
`;
    }

    const fullText = `${item.notes || ''} ${item.source_snippet || ''}`;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*)/g;
    const urls = Array.from(new Set(fullText.match(urlRegex) || []));
    if (urls.length > 0) {
      msg += `  🔗 Links: ${urls.join(', ')}
`;
    }
    if (item.doc_filename) {
      msg += `  📄 Source: ${item.doc_filename}
`;
    }
    msg += `
`;
  });

  msg += `✨ *Summarized in 5s with Sift iOS:* https://senthilmkm.github.io/Sift/index.html`;

  try {
    await Share.share({
      message: msg,
      title: `[Sift] ${flyerName} Summary`,
    });
  } catch (error) {
    console.error('Error sharing class summary:', error);
  }
}

function sanitizeCSVField(val: string | null | undefined): string {
  if (!val) return '""';
  const clean = val.replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${clean}"`;
}

function getTaxFields(item: SiftItem) {
  let vendor = 'N/A';
  let totalAmount = '$0.00';
  let taxCategory = 'Uncategorized Expense';

  if (item.metadata_json) {
    try {
      const meta = JSON.parse(item.metadata_json);
      if (meta.vendor_name) vendor = meta.vendor_name;
      if (meta.total_amount) totalAmount = meta.total_amount;
      if (meta.tax_category) taxCategory = meta.tax_category;
    } catch {
      // Fallback
    }
  }

  if (totalAmount === '$0.00') {
    const priceMatch = item.title.match(/\$\d+(?:\.\d{2})?/);
    if (priceMatch) totalAmount = priceMatch[0];
  }

  return { vendor, totalAmount, taxCategory };
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

    let csvContent = `=== SECTION 1: ACTIONABLE TASKS & DEADLINES (${actionable.length}) ===\n`;
    csvContent += `Tab,Title,Date / Due Date,Vendor Name,Total Amount Spent,Tax Category,Status,Urgent,Flyer Document,Source Snippet,Receipt Notes\n`;
    actionable.forEach((item) => {
      const tax = getTaxFields(item);
      csvContent += `${sanitizeCSVField('Actionable')},${sanitizeCSVField(item.title)},${sanitizeCSVField(item.due_at || 'No Due Date')},${sanitizeCSVField(tax.vendor)},${sanitizeCSVField(tax.totalAmount)},${sanitizeCSVField(tax.taxCategory)},${sanitizeCSVField(item.status.toUpperCase())},${sanitizeCSVField(item.is_urgent ? 'YES' : 'NO')},${sanitizeCSVField(item.doc_filename || 'Document Notice')},${sanitizeCSVField(item.source_snippet)},${sanitizeCSVField(item.notes || '')}\n`;
    });

    csvContent += `\n=== SECTION 2: EXPENSES, RECEIPTS & PERMITS (${informational.length}) ===\n`;
    csvContent += `Tab,Title,Date / Purchase Date,Vendor Name,Total Amount Spent,Tax Category,Status,Urgent,Flyer Document,Source Snippet,Receipt Notes\n`;
    informational.forEach((item) => {
      const tax = getTaxFields(item);
      const purchaseDate = item.due_at || (item.created_at ? item.created_at.split('T')[0] : 'N/A');
      csvContent += `${sanitizeCSVField('Informational')},${sanitizeCSVField(item.title)},${sanitizeCSVField(purchaseDate)},${sanitizeCSVField(tax.vendor)},${sanitizeCSVField(tax.totalAmount)},${sanitizeCSVField(tax.taxCategory)},${sanitizeCSVField(item.status.toUpperCase())},${sanitizeCSVField(item.is_urgent ? 'YES' : 'NO')},${sanitizeCSVField(item.doc_filename || 'Document Notice')},${sanitizeCSVField(item.source_snippet)},${sanitizeCSVField(item.notes || '')}\n`;
    });

    const file = new File(Paths.cache, 'Sift_Tasks_Export.csv');
    if (file.exists) {
      try {
        file.delete();
      } catch (e) {
        // Ignore deletion error
      }
    }
    file.create();
    file.write(csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Sift Tasks & Receipts to Excel',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      await Share.share({
        message: csvContent,
        title: 'Sift_Tasks_Export.csv',
      });
    }
  } catch (error) {
    console.error('Error exporting tasks to Excel CSV:', error);
  }
}

/**
 * Generates a clean, professional PDF Expense & Tax Report
 */
export async function exportAllTasksToPDF(): Promise<void> {
  try {
    const actionable = await getItems({ searchQuery: '', tab: 'actionable', status: 'all', urgentOnly: false, sortBy: 'due_date', sortOrder: 'asc' });
    const informational = await getItems({ searchQuery: '', tab: 'informational', status: 'all', urgentOnly: false, sortBy: 'created_at', sortOrder: 'desc' });
    const allItems = [...actionable, ...informational];

    if (allItems.length === 0) {
      if (typeof Alert !== 'undefined' && Alert.alert) {
        Alert.alert('No Items to Export', 'There are no active or saved items to generate a PDF report.');
      }
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let tableRows = '';
    allItems.forEach((item, index) => {
      const tax = getTaxFields(item);
      const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      tableRows += `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 12px; color: #334155;">${item.due_at || item.created_at.split('T')[0]}</td>
          <td style="padding: 10px; font-size: 12px; font-weight: bold; color: #0f172a;">${item.title}</td>
          <td style="padding: 10px; font-size: 12px; color: #059669; font-weight: 600;">${tax.taxCategory}</td>
          <td style="padding: 10px; font-size: 12px; font-weight: bold; color: #2563eb;">${tax.totalAmount}</td>
          <td style="padding: 10px; font-size: 11px; color: #64748b;">${item.notes || item.source_snippet.substring(0, 60)}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Sift Tax & Expense Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #0f172a; }
          .header { background: #0f172a; color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 22px; }
          .header p { margin: 5px 0 0; font-size: 12px; color: #94a3b8; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #1e293b; color: #ffffff; text-align: left; padding: 10px; font-size: 12px; }
          .footer { margin-top: 30px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚡ Sift — Tax & CPA Expense Report</h1>
          <p>Generated on ${todayStr} | Total Records: ${allItems.length}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Item / Vendor</th>
              <th>Tax Category</th>
              <th>Amount</th>
              <th>Notes / Snippet</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated automatically with Sift iOS — Privacy-First Document & Expense Command Center</p>
        </div>
      </body>
      </html>
    `;

    const pdf = await Print.printToFileAsync({ html: htmlContent });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdf.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Sift PDF Expense Report',
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (error) {
    console.error('Error generating PDF export:', error);
  }
}