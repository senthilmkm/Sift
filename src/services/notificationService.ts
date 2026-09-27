import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SiftItem } from '../models/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
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

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true, // <--- iOS Critical Alerts Entitlement
      },
    });
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/**
 * Calculates exact date & time triggers with 100% mathematical precision
 */
export function calculateNotificationTriggerDate(
  dueAt: string | null,
  defaultReminderTime: string = '19:00_nightbefore',
  now: Date = new Date()
): Date {
  const [timePart, timingPart] = defaultReminderTime.split('_');
  const [hours, minutes] = (timePart || '19:00').split(':').map(Number);
  const isNightBefore = timingPart !== 'sameday';

  let triggerDate = new Date();

  if (dueAt) {
    const [y, m, d] = dueAt.split('T')[0].split('-').map(Number);
    triggerDate = new Date(y, m - 1, d, hours || 19, minutes || 0, 0, 0);
    if (isNightBefore) {
      triggerDate.setDate(triggerDate.getDate() - 1);
    }
  } else {
    triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours || 19, minutes || 0, 0, 0);
    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }
  }

  return triggerDate;
}

export async function scheduleItemNotification(
  item: SiftItem,
  defaultReminderTime: string = '19:00_nightbefore'
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (item.notification_id) {
    await cancelNotification(item.notification_id);
  }

  const now = new Date();
  const triggerDate = calculateNotificationTriggerDate(item.due_at, defaultReminderTime, now);

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
      body: item.urgency_reason || item.source_snippet || `Due: ${item.due_at || 'Today'}`,
      sound: true,
      // iOS 15+ Critical Interruption Level when urgent:
      interruptionLevel: item.is_urgent ? 'critical' : 'active',
      priority: item.is_urgent
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.DEFAULT,
      data: { itemId: item.id, profileId: item.profile_id },
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
      body: 'Your Sift notifications and critical alerts are working perfectly!',
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
