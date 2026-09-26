import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, DeviceEventEmitter } from 'react-native';
import { SiftItem } from '../models/types';
import { getArchivedItems, restoreArchivedItem, deleteItem } from '../database/db';
import { Ionicons } from '@expo/vector-icons';

interface ArchivedTasksModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ArchivedTasksModal: React.FC<ArchivedTasksModalProps> = ({ visible, onClose }) => {
  const [archivedItems, setArchivedItems] = useState<SiftItem[]>([]);

  const loadArchived = async () => {
    const data = await getArchivedItems();
    setArchivedItems(data);
  };

  useEffect(() => {
    if (visible) {
      loadArchived();
    }
  }, [visible]);

  const handleClose = () => {
    DeviceEventEmitter.emit('SIFT_ITEM_RESTORED');
    onClose();
  };

  const handleRestore = async (id: string) => {
    await restoreArchivedItem(id);
    DeviceEventEmitter.emit('SIFT_ITEM_RESTORED');
    Alert.alert('Restored', 'Task moved back to active list.');
    await loadArchived();
  };

  const handleDeletePermanent = async (id: string) => {
    Alert.alert('Permanent Delete', 'Permanently delete this archived task from device storage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Permanently',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(id);
          DeviceEventEmitter.emit('SIFT_ITEM_RESTORED');
          await loadArchived();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📥 Archived Storage ({archivedItems.length})</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close-circle" size={28} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {archivedItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="archive-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No archived tasks yet.</Text>
            <Text style={styles.emptySub}>Tap the archive 📥 icon on any task card to move it here.</Text>
          </View>
        ) : (
          <FlatList
            data={archivedItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.due_at ? <Text style={styles.itemDue}>📅 Due: {item.due_at}</Text> : null}
                    <Text style={styles.itemSnippet}>"{item.source_snippet}"</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => handleRestore(item.id)} style={styles.actionBtn}>
                      <Ionicons name="refresh-circle" size={24} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePermanent(item.id)} style={styles.actionBtn}>
                      <Ionicons name="trash" size={22} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  itemDue: {
    color: '#818cf8',
    fontSize: 12,
    marginTop: 2,
  },
  itemSnippet: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
  actionBtn: {
    padding: 4,
  },
});