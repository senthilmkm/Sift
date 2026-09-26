import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function addItemsToPhoneCalendar(
  items: { title: string; due_date?: string | null; source_snippet?: string }[]
): Promise<number> {
  try {
    const granted = await requestCalendarPermissions();
    if (!granted) {
      if (typeof Alert !== 'undefined' && Alert.alert) {
        Alert.alert(
          'Calendar Permission Required',
          'Please allow calendar access in iOS Settings to add flyer dates directly to your iPhone Calendar.'
        );
      }
      return 0;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const isIOS = Platform && Platform.OS ? Platform.OS === 'ios' : true;

    const defaultCalendar = isIOS
      ? calendars.find((cal) => cal.allowsModifications && cal.source && cal.source.name === 'Default') || calendars.find((cal) => cal.allowsModifications)
      : calendars.find((cal) => cal.isPrimary) || calendars[0];

    if (!defaultCalendar) {
      if (typeof Alert !== 'undefined' && Alert.alert) {
        Alert.alert('Calendar Error', 'No editable calendar found on your device.');
      }
      return 0;
    }

    let addedCount = 0;

    for (const item of items) {
      if (!item.due_date || item.due_date === 'null' || item.due_date.trim() === '') continue;

      const datePart = item.due_date.split('T')[0];
      const [y, m, d] = datePart.split('-').map(Number);
      if (isNaN(y) || isNaN(m) || isNaN(d) || y < 2000) continue;

      const startDate = new Date(y, m - 1, d, 9, 0, 0);
      const endDate = new Date(y, m - 1, d, 10, 0, 0);

      await Calendar.createEventAsync(defaultCalendar.id, {
        title: `[Sift] ${item.title}`,
        startDate: startDate,
        endDate: endDate,
        allDay: false,
        timeZone: 'GMT',
        notes: item.source_snippet ? `Source: "${item.source_snippet}"\n\nAdded via Sift iOS` : 'Added via Sift iOS App',
        alarms: [{ relativeOffset: -1440 }],
      });

      addedCount++;
    }

    if (typeof Alert !== 'undefined' && Alert.alert) {
      if (addedCount > 0) {
        Alert.alert('Calendar Sync Complete', `Successfully added ${addedCount} event(s) with reminders to your iPhone Calendar!`);
      } else {
        Alert.alert('No Valid Dates', 'No valid due dates were found to add to your calendar.');
      }
    }

    return addedCount;
  } catch (err: any) {
    console.error('Failed to add items to calendar:', err);
    if (typeof Alert !== 'undefined' && Alert.alert) {
      Alert.alert('Calendar Error', err?.message || 'Could not sync events to calendar.');
    }
    return 0;
  }
}