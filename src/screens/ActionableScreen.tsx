import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Alert, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SiftItem, FilterOptions, ItemTab } from '../models/types';
import { getItems, updateItemStatus, archiveItem, updateItemDetails } from '../database/db';
import { ItemCard } from '../components/ItemCard';
import { FilterBar } from '../components/FilterBar';
import { EditItemModal } from '../components/EditItemModal';
import { shareTaskDetails } from '../services/shareService';

export const ActionableScreen: React.FC = () => {
  const [items, setItems] = useState<SiftItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState<SiftItem | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    tab: 'actionable',
    status: 'all',
    urgentOnly: false,
    sortBy: 'due_date',
    sortOrder: 'asc',
  });

  const loadItems = async () => {
    try {
      const data = await getItems(filterOptions);
      setItems(data);
    } catch (err) {
      console.error('Failed to load actionable items:', err);
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
    const nextStatus = currentStatus === 'done' ? 'open' : 'done';
    await updateItemStatus(id, nextStatus);
    await loadItems();
  };

  const handleArchiveItem = (id: string) => {
    Alert.alert(
      'Archive Task',
      'Move this task to Archival Storage?',
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
          <Text style={styles.emptyTitle}>No Actionable Tasks</Text>
          <Text style={styles.emptySub}>
            Photograph a school flyer or share a PDF to extract your actionable deadlines!
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