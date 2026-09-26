import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SiftItem, ItemTab } from '../models/types';
import { addItemsToPhoneCalendar } from '../services/calendarService';
import { shareClassGroupSummary } from '../services/shareService';
import { Ionicons } from '@expo/vector-icons';

interface EditItemModalProps {
  visible: boolean;
  item: SiftItem | null;
  onClose: () => void;
  onSave: (id: string, title: string, notes: string | null, dueAt: string | null, tab: ItemTab) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ visible, item, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<ItemTab>('actionable');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDueAt(item.due_at || '');
      setNotes(item.notes || '');
      setTab(item.tab);
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for the item.');
      return;
    }

    onSave(item.id, title.trim(), notes.trim() || null, dueAt.trim() || null, tab);
    onClose();
  };

  const handleSyncSingleToCalendar = async () => {
    await addItemsToPhoneCalendar([{ title: title || item.title, due_date: dueAt || item.due_at, source_snippet: notes || item.notes || item.source_snippet }]);
  };

  const handleShareSingleToClass = async () => {
    await shareClassGroupSummary([{ title: title || item.title, due_date: dueAt || item.due_at }], 'Sift Flyer Item');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Item</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Item title..."
            placeholderTextColor="#64748b"
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TouchableOpacity onPress={handleSyncSingleToCalendar} style={styles.calLink}>
              <Ionicons name="calendar-outline" size={12} color="#0284c7" />
              <Text style={styles.calLinkText}>Sync to Calendar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rowInput}>
            <Ionicons name="calendar-outline" size={18} color="#818cf8" style={{ marginRight: 6 }} />
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={dueAt}
              onChangeText={setDueAt}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
            />
          </View>

          <Text style={styles.label}>Notes / Extra Info</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes, order codes, or details..."
            placeholderTextColor="#64748b"
            multiline
          />

          <Text style={styles.label}>Tab Category</Text>
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              style={[styles.tabChip, tab === 'actionable' && styles.activeTabChip]}
              onPress={() => setTab('actionable')}
            >
              <Text style={[styles.tabChipText, tab === 'actionable' && styles.activeTabText]}>
                ⚡ Actionable
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabChip, tab === 'informational' && styles.activeTabChip]}
              onPress={() => setTab('informational')}
            >
              <Text style={[styles.tabChipText, tab === 'informational' && styles.activeTabText]}>
                ℹ️ Informational
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Quick Actions</Text>
          <View style={styles.quickToolsRow}>
            <TouchableOpacity style={styles.calLink} onPress={handleSyncSingleToCalendar}>
              <Ionicons name="calendar-outline" size={14} color="#38bdf8" />
              <Text style={styles.calLinkText}>📅 Add to Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareLink} onPress={handleShareSingleToClass}>
              <Ionicons name="share-social-outline" size={14} color="#c084fc" />
              <Text style={styles.shareLinkText}>📱 Share to Class Group</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  quickToolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  shareLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c084fc',
  },
  shareLinkText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  calLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  calLinkText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  tabToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeTabChip: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  tabChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});