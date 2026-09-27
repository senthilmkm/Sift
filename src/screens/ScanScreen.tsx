import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { extractItemsFromDocument, generateContextualDocumentName } from '../services/geminiExtractor';
import { saveDocumentAndItems, getUserPreferences, updateUserPreferences } from '../database/db';
import { CandidateItem, SiftDocument } from '../models/types';
import { scheduleItemNotification } from '../services/notificationService';
import { shareClassGroupSummary } from '../services/shareService';
import { addItemsToPhoneCalendar } from '../services/calendarService';
import { Ionicons } from '@expo/vector-icons';
import { PaywallModal } from '../components/PaywallModal';

interface ScanScreenProps {
  onScanComplete?: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onScanComplete }) => {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);

  const handlePressScanOption = () => {
    Alert.alert(
      'Scan Document Flyer',
      'Choose how you want to capture the flyer:',
      [
        {
          text: '📷 Take Photo',
          onPress: () => processImageSource('camera'),
        },
        {
          text: '🖼️ Pick from Library',
          onPress: () => processImageSource('library'),
        },
        {
          text: '⚡ Try Sample School Flyer',
          onPress: () => processImageSource('sample'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const processImageSource = async (source: 'camera' | 'library' | 'sample') => {
    const prefs = await getUserPreferences();
    if (!prefs.isSubscribed && prefs.freeScansUsed >= 5) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    try {
      let base64Image = '';
      let mimeType = 'image/jpeg';

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera Permission Required', 'Please allow camera access in iOS Settings to photograph flyers.');
          setLoading(false);
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          base64: true,
          quality: 0.5,
        });

        if (result.canceled || !result.assets[0].base64) {
          setLoading(false);
          return;
        }

        base64Image = result.assets[0].base64;
        mimeType = result.assets[0].mimeType || 'image/jpeg';
        setScannedImageUri(result.assets[0].uri || result.assets[0].base64);
      } else if (source === 'library') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow photo library access in iOS Settings to pick flyer images.');
          setLoading(false);
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          base64: true,
          quality: 0.5,
        });

        if (result.canceled || !result.assets[0].base64) {
          setLoading(false);
          return;
        }

        base64Image = result.assets[0].base64;
        mimeType = result.assets[0].mimeType || 'image/jpeg';
        setScannedImageUri(result.assets[0].uri || result.assets[0].base64);
      } else {
        base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }

      const prefs = await getUserPreferences();
      const extracted = await extractItemsFromDocument(
        base64Image,
        mimeType,
        prefs.activeProfile || 'school',
        prefs.enablePiiRedaction !== false,
        true
      );

      // Soonest Flyer Date Inheritance: Find the earliest valid date on the flyer
      const validDates = extracted
        .map((i) => i.due_date)
        .filter((d): d is string => !!d && d.trim() !== '' && d !== 'null')
        .sort();

      const todayStr = new Date().toISOString().split('T')[0];
      const fallbackPlusSeven = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const soonestFlyerDate = validDates.length > 0 ? validDates[0] : fallbackPlusSeven;

      const sanitized = extracted.map((item) => {
        const hasValidDate = item.due_date && item.due_date.trim() !== '' && item.due_date !== 'null';
        return {
          ...item,
          due_date: hasValidDate ? item.due_date : (item.tab === 'actionable' ? soonestFlyerDate : todayStr),
        };
      });

      setCandidates(sanitized);

      if (!prefs.isSubscribed) {
        await updateUserPreferences({ freeScansUsed: prefs.freeScansUsed + 1 });
      }
    } catch (err: any) {
      Alert.alert('Scan Failed', err?.message || 'Could not process document flyer.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidate = (index: number, updated: Partial<CandidateItem>) => {
    const next = [...candidates];
    next[index] = { ...next[index], ...updated };
    setCandidates(next);
  };

  const handleRemoveCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleSaveConfirmed = async () => {
    if (candidates.length === 0) {
      Alert.alert('No Items Selected', 'Please confirm at least one candidate item before saving.');
      return;
    }

    const prefs = await getUserPreferences();

    const contextualName = generateContextualDocumentName(candidates);
    const doc: SiftDocument = {
      id: 'doc_' + Math.random().toString(36).substring(2, 9),
      origin: 'camera',
      filename: contextualName,
      mime: 'image/jpeg',
      image_path: scannedImageUri || undefined,
      created_at: new Date().toISOString(),
    };

    const validDates = candidates
      .map((c) => c.due_date)
      .filter((d): d is string => !!d && d.trim() !== '' && d !== 'null')
      .sort();

    const fallbackDateStr = validDates.length > 0 ? validDates[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const itemsToSave = candidates.map((c) => {
      const finalDueDate = c.due_date && c.due_date.trim() !== '' && c.due_date !== 'null' ? c.due_date : fallbackDateStr;
      return {
        tab: c.tab,
        title: c.title,
        due_at: finalDueDate,
        source_snippet: c.source_snippet,
        status: 'open' as const,
        is_urgent: !!c.is_urgent,
        reminder_at: `${finalDueDate}T19:00:00`,
        confidence: c.confidence,
      };
    });

    const savedItems = await saveDocumentAndItems(doc, itemsToSave);

    // Automatically schedule notifications for ALL actionable items
    if (prefs.enableNotifications) {
      for (const item of savedItems) {
        if (item.tab === 'actionable') {
          await scheduleItemNotification(item, prefs.defaultReminderTime);
        }
      }
    }

    Alert.alert('Success', `Saved ${candidates.length} item(s) to your list & scheduled reminders!`);
    setCandidates([]);
    if (onScanComplete) onScanComplete();
  };

  return (
    <View style={styles.container}>
      {candidates.length === 0 ? (
        <View style={styles.initialBox}>
          <Ionicons name="camera-reverse-outline" size={64} color="#6366f1" />
          <Text style={styles.title}>Scan Flyer or Notice</Text>
          <Text style={styles.subtitle}>
            Photograph a school paper flyer on your fridge or pick a flyer photo from your library.
          </Text>

          {loading ? (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={{ color: '#818cf8', marginTop: 8, fontSize: 13 }}>
                Processing document with Gemini AI...
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.scanBtn} onPress={handlePressScanOption}>
              <Ionicons name="aperture" size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Scan Document Flyer</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.confirmScroll}>
          <Text style={styles.confirmTitle}>Confirm Extracted Items</Text>
          <Text style={styles.confirmSubtitle}>
            Review candidate tasks below. Edit titles/dates or remove items before saving.
          </Text>

          {candidates.map((item, index) => (
            <View key={index} style={styles.candidateCard}>
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  style={[styles.tabBadge, item.tab === 'actionable' ? styles.actionableBadge : styles.infoBadge]}
                  onPress={() =>
                    handleUpdateCandidate(index, {
                      tab: item.tab === 'actionable' ? 'informational' : 'actionable',
                    })
                  }
                >
                  <Text style={styles.badgeText}>{item.tab.toUpperCase()}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleRemoveCandidate(index)} style={{ marginLeft: 'auto' }}>
                  <Ionicons name="trash-outline" size={18} color="#f43f5e" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.titleInput}
                value={item.title}
                onChangeText={(text) => handleUpdateCandidate(index, { title: text })}
              />

              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#818cf8" />
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                  value={item.due_date || ''}
                  onChangeText={(text) => handleUpdateCandidate(index, { due_date: text })}
                />
              </View>

              <Text style={styles.snippetText}>"{item.source_snippet}"</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveConfirmed}>
            <Text style={styles.saveBtnText}>Save Confirmed Items ({candidates.length})</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, marginBottom: 8 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>─── Optional Quick Tools ───</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Quick Tools Information',
                  '• Add to iPhone Calendar: Saves flyer due dates directly to your native iPhone Calendar app with a 24-hour advance reminder alarm.\n\n• Share to Class Group: Generates a formatted text summary ready to post in your team, family, WhatsApp, or group chat.'
                )
              }
              style={{ paddingLeft: 6 }}
            >
              <Ionicons name="information-circle-outline" size={16} color="#38bdf8" />
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryToolsRow}>
            <TouchableOpacity style={styles.calendarBtn} onPress={() => addItemsToPhoneCalendar(candidates)}>
              <Ionicons name="calendar-outline" size={15} color="#38bdf8" />
              <Text style={styles.calendarBtnText}>📅 Add to iPhone Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareGroupBtn} onPress={() => shareClassGroupSummary(candidates, 'Scanned Flyer')}>
              <Ionicons name="share-social-outline" size={15} color="#c084fc" />
              <Text style={styles.shareGroupBtnText}>📱 Share Summary</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribePlan={async (planId) => {
          await updateUserPreferences({ isSubscribed: true, activePlanId: planId });
          setShowPaywall(false);
          Alert.alert('Subscribed!', 'Welcome to Sift Pro!');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  initialBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 99,
  },
  scanBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  confirmScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  confirmTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  confirmSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
  },
  candidateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionableBadge: {
    backgroundColor: '#312e81',
  },
  infoBadge: {
    backgroundColor: '#065f46',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  titleInput: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingVertical: 4,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInput: {
    color: '#818cf8',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  snippetText: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
    backgroundColor: '#0f172a',
    padding: 6,
    borderRadius: 6,
  },
  saveBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 15,
    borderRadius: 99,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryToolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  calendarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  calendarBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  shareGroupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  shareGroupBtnText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});