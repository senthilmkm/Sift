import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Alert, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SiftItem, FilterOptions, ItemTab } from '../models/types';
import { getItems, updateItemStatus, promoteToActionable, archiveItem, updateItemDetails } from '../database/db';
import { ItemCard } from '../components/ItemCard';
import { FilterBar } from '../components/FilterBar';
import { EditItemModal } from '../components/EditItemModal';
import { shareTaskDetails } from '../services/shareService';

export const InformationalScreen: React.FC = () => {
  const [items, setItems] = useState<SiftItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState<SiftItem | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    tab: 'informational',
    status: 'all',
    urgentOnly: false,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const loadItems = async () => {
    try {
      const data = await getItems(filterOptions);
      setItems(data);
    } catch (err) {
      console.error('Failed to load informational items:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [filterOptions])
  );

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('SIFT_ITEM_RESTORED', () => {
      loadItems();
    });
    return () => {
      subscription.remove();
    };
  }, [filterOptions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: SiftItem['status']) => {
    const nextStatus = currentStatus === 'read' ? 'open' : 'read';
    await updateItemStatus(id, nextStatus);
    await loadItems();
  };

  const handleArchiveItem = (id: string) => {
    Alert.alert(
      'Archive Note',
      'Move this reference note to Archival Storage?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await archiveItem(id);
            await loadItems();
          },
        },
      ]
    );
  };

  const handlePromoteActionable = async (id: string) => {
    const defaultDueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await promoteToActionable(id, defaultDueDate);
    Alert.alert('Promoted to Actionable', `Item moved to Actionable tab with due date set to ${defaultDueDate}.`);
    await loadItems();
  };

  const handleSaveEdit = async (
    id: string,
    title: string,
    notes: string | null,
    dueAt: string | null,
    tab: ItemTab
  ) => {
    await updateItemDetails(id, title, notes, dueAt, tab);
    await loadItems();
  };

  return (
    <View style={styles.container}>
      <FilterBar
        options={filterOptions}
        onChangeOptions={(updated) => setFilterOptions({ ...filterOptions, ...updated })}
      />

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Reference Notes</Text>
          <Text style={styles.emptySub}>
            Informational highlights, spirit week themes, and menu updates will appear here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onToggleStatus={handleToggleStatus}
              onArchiveItem={handleArchiveItem}
              onPromoteActionable={handlePromoteActionable}
              onEditItem={(target) => setEditingItem(target)}
              onShareItem={shareTaskDetails}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        />
      )}

      <EditItemModal
        visible={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEdit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});