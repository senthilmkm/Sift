import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface TimeRollerPickerProps {
  value: string; // e.g. "19:00_nightbefore"
  onSave: (timeValue: string, displayLabel: string) => void;
}

const ITEM_HEIGHT = 40;

export const TimeRollerPicker: React.FC<TimeRollerPickerProps> = ({ value, onSave }) => {
  const [selectedHour, setSelectedHour] = useState(7); // 1-12
  const [selectedMinute, setSelectedMinute] = useState(0); // 0-59
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');
  const [dayTiming, setDayTiming] = useState<'nightbefore' | 'sameday'>('nightbefore');

  const hourScrollRef = useRef<ScrollView>(null);
  const minScrollRef = useRef<ScrollView>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
  const minutes = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`)); // 00..59

  useEffect(() => {
    if (value) {
      const parts = value.split('_');
      const timePart = parts[0] || '19:00';
      const timingPart = parts[1] === 'sameday' ? 'sameday' : 'nightbefore';
      setDayTiming(timingPart);

      const [hStr, mStr] = timePart.split(':');
      let h = parseInt(hStr || '19', 10);
      let m = parseInt(mStr || '0', 10);

      const isPM = h >= 12;
      setAmpm(isPM ? 'PM' : 'AM');

      h = h % 12;
      if (h === 0) h = 12;
      setSelectedHour(h);
      setSelectedMinute(m);

      // Scroll to position
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: (h - 1) * ITEM_HEIGHT, animated: false });
        minScrollRef.current?.scrollTo({ y: m * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, [value]);

  const updateStateAndSave = (h: number, m: number, ap: 'AM' | 'PM', dt: 'nightbefore' | 'sameday') => {
    setSelectedHour(h);
    setSelectedMinute(m);
    setAmpm(ap);
    setDayTiming(dt);

    let h24 = h;
    if (ap === 'PM' && h < 12) h24 += 12;
    if (ap === 'AM' && h === 12) h24 = 0;

    const h24Str = h24 < 10 ? `0${h24}` : `${h24}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;

    const storedVal = `${h24Str}:${mStr}_${dt}`;
    const displayLabel = `${h}:${mStr} ${ap} (${dt === 'nightbefore' ? 'Night Before' : 'Same Day'})`;

    onSave(storedVal, displayLabel);
  };

  const onHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const newH = Math.max(1, Math.min(12, index + 1));
    updateStateAndSave(newH, selectedMinute, ampm, dayTiming);
  };

  const onMinScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const newM = Math.max(0, Math.min(59, index));
    updateStateAndSave(selectedHour, newM, ampm, dayTiming);
  };

  const minStr = selectedMinute < 10 ? `0${selectedMinute}` : `${selectedMinute}`;

  return (
    <View style={styles.container}>
      <Text style={styles.previewText}>
        ⏰ Default Reminder: {selectedHour}:{minStr} {ampm} ({dayTiming === 'nightbefore' ? 'Night Before' : 'Same Day'})
      </Text>

      {/* Vertical Roller Wheel Section */}
      <View style={styles.wheelsRow}>
        {/* Hour Vertical Roller */}
        <View style={styles.wheelContainer}>
          <Text style={styles.wheelHeader}>HOUR</Text>
          <View style={styles.wheelBox}>
            <View style={styles.selectionIndicator} />
            <ScrollView
              ref={hourScrollRef}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onMomentumScrollEnd={onHourScrollEnd}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
            >
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={styles.itemSlot}
                  onPress={() => {
                    hourScrollRef.current?.scrollTo({ y: (h - 1) * ITEM_HEIGHT, animated: true });
                    updateStateAndSave(h, selectedMinute, ampm, dayTiming);
                  }}
                >
                  <Text style={[styles.itemText, selectedHour === h && styles.itemTextSelected]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Text style={styles.colonSeparator}>:</Text>

        {/* Minute Vertical Roller */}
        <View style={styles.wheelContainer}>
          <Text style={styles.wheelHeader}>MINUTE</Text>
          <View style={styles.wheelBox}>
            <View style={styles.selectionIndicator} />
            <ScrollView
              ref={minScrollRef}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onMomentumScrollEnd={onMinScrollEnd}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
            >
              {minutes.map((mStr, idx) => (
                <TouchableOpacity
                  key={mStr}
                  style={styles.itemSlot}
                  onPress={() => {
                    minScrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
                    updateStateAndSave(selectedHour, idx, ampm, dayTiming);
                  }}
                >
                  <Text style={[styles.itemText, selectedMinute === idx && styles.itemTextSelected]}>
                    {mStr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* AM / PM Toggle Pills */}
        <View style={styles.ampmContainer}>
          <Text style={styles.wheelHeader}>FORMAT</Text>
          <TouchableOpacity
            style={[styles.ampmBtn, ampm === 'AM' && styles.ampmBtnActive]}
            onPress={() => updateStateAndSave(selectedHour, selectedMinute, 'AM', dayTiming)}
          >
            <Text style={[styles.ampmText, ampm === 'AM' && styles.ampmTextActive]}>AM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ampmBtn, ampm === 'PM' && styles.ampmBtnActive]}
            onPress={() => updateStateAndSave(selectedHour, selectedMinute, 'PM', dayTiming)}
          >
            <Text style={[styles.ampmText, ampm === 'PM' && styles.ampmTextActive]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day Timing Pills */}
      <View style={styles.timingRow}>
        <TouchableOpacity
          style={[styles.timingBtn, dayTiming === 'nightbefore' && styles.timingBtnActive]}
          onPress={() => updateStateAndSave(selectedHour, selectedMinute, ampm, 'nightbefore')}
        >
          <Text style={[styles.timingText, dayTiming === 'nightbefore' && styles.timingTextActive]}>
            🌙 Night Before
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timingBtn, dayTiming === 'sameday' && styles.timingBtnActive]}
          onPress={() => updateStateAndSave(selectedHour, selectedMinute, ampm, 'sameday')}
        >
          <Text style={[styles.timingText, dayTiming === 'sameday' && styles.timingTextActive]}>
            ☀️ Same Day
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wheelContainer: {
    alignItems: 'center',
    width: 70,
  },
  colonSeparator: {
    color: '#6366f1',
    fontSize: 24,
    fontWeight: '800',
    marginHorizontal: 8,
    marginTop: 20,
  },
  wheelHeader: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  wheelBox: {
    height: ITEM_HEIGHT * 3,
    width: 66,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#6366f1',
    zIndex: 1,
    pointerEvents: 'none',
  },
  itemSlot: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  itemText: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
  },
  itemTextSelected: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  ampmContainer: {
    marginLeft: 16,
    alignItems: 'center',
    gap: 6,
  },
  ampmBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ampmBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  ampmText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  ampmTextActive: {
    color: '#ffffff',
  },
  timingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timingBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timingBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  timingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  timingTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
