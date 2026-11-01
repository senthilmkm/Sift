import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Alert, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SiftItem, FilterOptions, ItemTab, ProfileId } from '../models/types';
import { getItems, updateItemStatus, archiveItem, updateItemDetails, getUserPreferences, updateItemNotificationId } from '../database/db';
import { ItemCard } from '../components/ItemCard';
import { FilterBar } from '../components/FilterBar';
import { EditItemModal } from '../components/EditItemModal';
import { shareTaskDetails } from '../services/shareService';
import { PROFILE_CONFIGS } from '../config/profiles';
import { scheduleItemNotification, cancelNotification } from '../services/notificationService';

export const ActionableScreen: React.FC = () => {
  const [items, setItems] = useState<SiftItem[]>([]);
  const [activeProfile, setActiveProfile] = useState<ProfileId>('school');
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
      const prefs = await getUserPreferences();
      const currentProfile = prefs.activeProfile || 'school';
      setActiveProfile(currentProfile);
      const data = await getItems({ ...filterOptions, profileId: currentProfile });
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
    const subRestore = DeviceEventEmitter.addListener('SIFT_ITEM_RESTORED', () => {
      loadItems();
    });
    const subProfile = DeviceEventEmitter.addListener('SIFT_PROFILE_CHANGED', (newProfile: ProfileId) => {
      setActiveProfile(newProfile);
      loadItems();
    });
    return () => {
      subRestore.remove();
      subProfile.remove();
    };
  }, [filterOptions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: SiftItem['status']) => {
    const nextStatus = currentStatus === 'done' ? 'open' : 'done';
    const targetItem = items.find((i) => i.id === id);

    if (nextStatus === 'done' && targetItem?.notification_id) {
      await cancelNotification(targetItem.notification_id);
      await updateItemNotificationId(id, null);
    } else if (nextStatus === 'open' && targetItem) {
      const prefs = await getUserPreferences();
      if (prefs.enableNotifications) {
        const notifId = await scheduleItemNotification(targetItem, prefs.defaultReminderTime, prefs.enableCriticalAlerts);
        if (notifId) {
          await updateItemNotificationId(id, notifId);
        }
      }
    }

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
            const targetItem = items.find((i) => i.id === id);
            if (targetItem?.notification_id) {
              await cancelNotification(targetItem.notification_id);
              await updateItemNotificationId(id, null);
            }
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
    const targetItem = items.find((i) => i.id === id);
    if (targetItem?.notification_id) {
      await cancelNotification(targetItem.notification_id);
      await updateItemNotificationId(id, null);
    }

    await updateItemDetails(id, title, notes, dueAt, tab);

    const prefs = await getUserPreferences();
    if (tab === 'actionable' && prefs.enableNotifications) {
      const updatedItem: SiftItem = {
        ...(targetItem || ({} as any)),
        id,
        title,
        notes,
        due_at: dueAt,
        tab,
      };
      const notifId = await scheduleItemNotification(updatedItem, prefs.defaultReminderTime, prefs.enableCriticalAlerts);
      if (notifId) {
        await updateItemNotificationId(id, notifId);
      }
    }

    await loadItems();
  };

  return (
    <View style={styles.container}>
      <FilterBar
        options={filterOptions}
        profileId={activeProfile}
        onChangeOptions={(updated) => setFilterOptions({ ...filterOptions, ...updated })}
      />

      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            No {PROFILE_CONFIGS[activeProfile]?.tab1Name?.replace(/^[^\w\s]+/, '').trim() || 'Actionable Tasks'}
          </Text>
          <Text style={styles.emptySub}>
            {PROFILE_CONFIGS[activeProfile]?.emptyStateText || 'Scan a flyer, bill, or notice to extract your deadlines!'}
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