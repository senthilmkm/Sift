import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SiftItem } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

interface ItemCardProps {
  item: SiftItem;
  onToggleStatus: (id: string, currentStatus: SiftItem['status']) => void;
  onArchiveItem: (id: string) => void;
  onPromoteActionable?: (id: string) => void;
  onEditItem?: (item: SiftItem) => void;
  onShareItem: (item: SiftItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onToggleStatus,
  onArchiveItem,
  onPromoteActionable,
  onEditItem,
  onShareItem,
}) => {
  const isDone = item.status === 'done' || item.status === 'read' || item.status === 'archived';

  let dueCategory: 'red' | 'amber' | 'teal' | 'none' = 'none';
  let badgeLabel = '';
  let validDueDate = '';

  if (item.due_at && item.due_at !== 'null' && item.due_at !== 'undefined' && item.due_at.trim().length > 0) {
    const datePart = item.due_at.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);

    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 2000) {
      validDueDate = datePart;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueDate = new Date(y, m - 1, d);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        dueCategory = 'red';
        badgeLabel = diffDays === 0 ? 'DUE TODAY ⚡' : 'OVERDUE ⚡';
      } else if (diffDays === 1) {
        dueCategory = 'amber';
        badgeLabel = 'DUE TOMORROW ⏰';
      } else {
        dueCategory = 'teal';
        badgeLabel = `IN ${diffDays} DAYS 📅`;
      }
    }
  }

  const renderTextWithLinks = (text: string, style: any) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*)/g;
    const parts = text.split(urlRegex);
    const matches: string[] = text.match(urlRegex) || [];

    if (matches.length === 0) {
      return <Text style={style}>{text}</Text>;
    }

    return (
      <Text style={style}>
        {parts.map((part, i) => {
          if (matches.includes(part)) {
            const fullUrl = part.startsWith('http') ? part : `https://${part}`;
            return (
              <Text
                key={i}
                style={styles.clickableLink}
                onPress={() => Linking.openURL(fullUrl)}
              >
                {part} 🔗
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.card,
        dueCategory === 'red' && styles.redCardBorder,
        dueCategory === 'amber' && styles.amberCardBorder,
        dueCategory === 'teal' && styles.tealCardBorder,
        isDone && styles.doneCard,
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.checkboxTouch}
          onPress={() => onToggleStatus(item.id, item.status)}
          testID={`checkbox-${item.id}`}
        >
          <Ionicons
            name={isDone ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={26}
            color={isDone ? '#10b981' : '#6366f1'}
          />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          {renderTextWithLinks(item.title, [styles.titleText, isDone && styles.strikethroughText])}

          <View style={styles.dueRow}>
                        {validDueDate ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.dueText}>📅 Due: {validDueDate}</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'iPhone Calendar Sync',
                      'Tapping "Sync" saves this event to your native iPhone Calendar app with an automated 24-hour advance alert so you never miss a deadline.'
                    )
                  }
                  style={{ paddingLeft: 4 }}
                >
                  <Ionicons name="information-circle-outline" size={14} color="#818cf8" />
                </TouchableOpacity>
              </View>
            ) : null}

            {badgeLabel ? (
              <View
                style={[
                  styles.badge,
                  dueCategory === 'red' && styles.redBadge,
                  dueCategory === 'amber' && styles.amberBadge,
                  dueCategory === 'teal' && styles.tealBadge,
                ]}
              >
                <Text style={styles.badgeText}>{badgeLabel}</Text>
              </View>
            ) : null}

            {item.doc_filename ? (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>📄 {item.doc_filename}</Text>
              </View>
            ) : null}
          </View>

          {item.notes ? (
            <View style={{ marginTop: 2 }}>
              {renderTextWithLinks(`📝 Notes: ${item.notes}`, styles.notesText)}
            </View>
          ) : null}
        </View>

        <View style={styles.actionsRow}>
          {onEditItem && (
            <TouchableOpacity onPress={() => onEditItem(item)} style={styles.actionIcon}>
              <Ionicons name="create-outline" size={20} color="#818cf8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => onShareItem(item)} style={styles.actionIcon}>
            <Ionicons name="share-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onArchiveItem(item.id)} style={styles.actionIcon}>
            <Ionicons name="archive-outline" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {item.source_snippet ? (
        <View style={styles.snippetBox}>
          <Text style={styles.snippetLabel}>Source Snippet:</Text>
          {renderTextWithLinks(`"${item.source_snippet}"`, styles.snippetText)}
        </View>
      ) : null}

      {item.tab === 'informational' && onPromoteActionable && (
        <TouchableOpacity
          style={styles.promoteBtn}
          onPress={() => onPromoteActionable(item.id)}
        >
          <Ionicons name="arrow-up-circle-outline" size={18} color="#6366f1" />
          <Text style={styles.promoteBtnText}>Make Actionable</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  redCardBorder: {
    borderColor: '#ef4444',
  },
  amberCardBorder: {
    borderColor: '#f59e0b',
  },
  tealCardBorder: {
    borderColor: '#14b8a6',
  },
  doneCard: {
    opacity: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxTouch: {
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  clickableLink: {
    color: '#38bdf8',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  strikethroughText: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
    gap: 6,
  },
  dueText: {
    color: '#818cf8',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  redBadge: {
    backgroundColor: '#7f1d1d',
  },
  amberBadge: {
    backgroundColor: '#78350f',
  },
  tealBadge: {
    backgroundColor: '#134e4a',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  groupBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupBadgeText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  notesText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 4,
    marginLeft: 4,
  },
  snippetBox: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
  },
  snippetLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  snippetText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  promoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#312e81',
    borderRadius: 6,
  },
  promoteBtnText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});