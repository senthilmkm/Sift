import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { FilterOptions, SortByOption } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

interface FilterBarProps {
  options: FilterOptions;
  onChangeOptions: (updated: Partial<FilterOptions>) => void;
}

const TAX_CATEGORIES = [
  'All',
  'Materials & Supplies',
  'Vehicle & Fuel',
  'Utilities & Repairs',
  'Office & Admin',
  'Professional Fees',
];

export const FilterBar: React.FC<FilterBarProps> = ({ options, onChangeOptions }) => {
  const activeCategory = options.taxCategory || 'All';

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items, vendors, or snippets..."
          placeholderTextColor="#64748b"
          value={options.searchQuery}
          onChangeText={(text) => onChangeOptions({ searchQuery: text })}
        />
        {options.searchQuery ? (
          <TouchableOpacity onPress={() => onChangeOptions({ searchQuery: '' })}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tax Category Filter Pills Bar */}
      <View style={styles.categoryPillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {TAX_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.taxPill, isActive && styles.activeTaxPill]}
                onPress={() => onChangeOptions({ taxCategory: cat === 'All' ? undefined : cat })}
                activeOpacity={0.7}
              >
                <Text style={[styles.taxPillText, isActive && styles.activeTaxPillText]}>
                  {cat === 'All' ? '🏷️ All Expenses' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.filterChipRow}>
        <TouchableOpacity
          style={[styles.chip, options.status === 'all' && styles.activeChip]}
          onPress={() => onChangeOptions({ status: 'all' })}
        >
          <Text style={[styles.chipText, options.status === 'all' && styles.activeChipText]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, options.status === 'open' && styles.activeChip]}
          onPress={() => onChangeOptions({ status: 'open' })}
        >
          <Text style={[styles.chipText, options.status === 'open' && styles.activeChipText]}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, options.urgentOnly && styles.activeUrgentChip]}
          onPress={() => onChangeOptions({ urgentOnly: !options.urgentOnly })}
        >
          <Ionicons name="flash" size={12} color={options.urgentOnly ? '#fff' : '#ff6b6b'} />
          <Text style={[styles.chipText, options.urgentOnly && styles.activeChipText, { marginLeft: 4 }]}>Urgent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortChip}
          onPress={() => {
            const nextSort: SortByOption =
              options.sortBy === 'due_date' ? 'urgency' : options.sortBy === 'urgency' ? 'title' : 'due_date';
            onChangeOptions({ sortBy: nextSort });
          }}
        >
          <Ionicons name="swap-vertical" size={12} color="#818cf8" />
          <Text style={styles.sortChipText}>Sort: {options.sortBy.replace('_', ' ')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  categoryPillsWrapper: {
    marginTop: 8,
  },
  categoryPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#1e1b4b',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#3730a3',
  },
  activeTaxPill: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  taxPillText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '600',
  },
  activeTaxPillText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#1e293b',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeChip: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  activeUrgentChip: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  activeChipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: '#312e81',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortChipText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
});
