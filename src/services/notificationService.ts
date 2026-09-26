import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SiftItem } from '../models/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function checkNotificationPermissionStatus() {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return { status, canAskAgain };
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleItemNotification(item: SiftItem, defaultReminderTime: string = '19:00_nightbefore'): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (item.notification_id) {
    await cancelNotification(item.notification_id);
  }

  const [timePart, timingPart] = defaultReminderTime.split('_');
  const [hours, minutes] = (timePart || '19:00').split(':').map(Number);
  const isNightBefore = timingPart !== 'sameday';

  const now = new Date();
  let triggerDate = new Date();

  if (item.due_at) {
    const [y, m, d] = item.due_at.split('T')[0].split('-').map(Number);
    triggerDate = new Date(y, m - 1, d, hours || 19, minutes || 0, 0);
    if (isNightBefore) {
      triggerDate.setDate(triggerDate.getDate() - 1);
    }
  } else {
    triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours || 19, minutes || 0, 0);
    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }
  }

  const diffSeconds = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);
  let triggerInput: any;

  if (diffSeconds <= 0) {
    triggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    };
  } else if (diffSeconds <= 600) {
    triggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: diffSeconds,
      repeats: false,
    };
  } else {
    triggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: item.is_urgent ? `⚡ URGENT: ${item.title}` : `📋 Sift Reminder: ${item.title}`,
      body: item.source_snippet || `Due: ${item.due_at || 'Today'}`,
      sound: true,
      priority: item.is_urgent ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
      data: { itemId: item.id },
    },
    trigger: triggerInput,
  });

  return notificationId;
}

export async function sendTestNotification(): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚡ Sift Test Alert',
      body: 'Your Sift notifications are working perfectly!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (err) {
    console.warn('Error cancelling notification:', err);
  }
}
