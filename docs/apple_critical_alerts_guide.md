# 🚨 Sift: Apple Critical Alerts Entitlement & Technical Implementation Guide

This guide provides both the **ready-to-submit Apple Entitlement Application copy** and the **exact technical & configuration steps** required to enable Critical Alerts in Sift.

> [!NOTE]
> **Submitted Application Tracking**  
> **Apple Request ID:** `25258T5RLF`  
> **Submitted Date:** October 1, 2026  
> **Status:** Submitted & Pending Apple Developer Review (24–48 hours)

---

## Part 1: Apple Developer Entitlement Application Details

Use these exact answers when submitting the [Apple Critical Alerts Entitlement Request Form](https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/).

### 1. Describe your app
> **App Name:** Sift  
> **Bundle Identifier:** `com.senthilmkm.sift`  
> **Primary Platform:** iOS (Expo / React Native)  
>
> **Description:**  
> Sift is an AI-powered document scanner and deadline tracking application. It allows users—specifically caregivers, chronic illness patients, and family managers—to photograph physical paper notices, medical care plans, lab instructions, and urgent financial or legal documents. Using Gemini multimodal AI, Sift automatically extracts critical deadlines, pre-procedure requirements, and actionable tasks, scheduling them directly into the user’s local calendar and notification system.

---

### 2. What type of notifications will you send as Critical Alerts?
> **Notification Category:** Health & Safety / High-Stakes Deadlines  
>
> **Specific Examples:**
> 1. **Medical & Surgical Pre-Op Directives:** Urgent reminders for time-sensitive medical preparation (e.g., *"Fast 12 hours before morning blood work"* or *"Cease taking blood thinners 48h prior to procedure"*).
> 2. **Time-Critical Legal & Immigration Notices:** Reminders for non-deferrable court appearances, visa biometrics appointments, or legal response windows.
> 3. **Time-Sensitive Caregiver Alerts:** Emergency medication refill deadlines or critical elder care instructions where missing a window poses a direct health or safety risk.

---

### 3. How frequently will you send Critical Alerts?
> **Frequency:** Extremely Low / Event-Driven (< 1 to 2 alerts per month per user on average).  
>
> **Explanation:**  
> Critical Alerts in Sift are **strictly opt-in** and reserved exclusively for items explicitly flagged as **Urgent** (`is_urgent = true`) with hard medical or legal deadlines. Standard daily reminders, routine notices, and general tasks use standard iOS local notifications (`interruptionLevel: 'active'`). Critical Alerts will never be used for marketing, engagement, or non-urgent reminders.

---

### 4. Detailed Justification Strategy & App Usage

> **Why Sift Requires This Entitlement:**  
> Standard iOS local notifications can be silenced by the physical Ring/Silent switch, or suppressed by Do Not Disturb, Bedtime, and custom Focus modes. 
>
> In high-stakes caregiver and healthcare management scenarios, missing a time-sensitive directive carries severe real-world consequences:
> * **Medical Procedures:** If a patient or caregiver sleeps through or misses a pre-op fasting or medication adjustment notification because Focus Mode was active overnight, hospitals must cancel surgeries on the spot, causing health risks and wasted medical resources.
> * **Elder Care Management:** Caregivers managing aging parents often sleep with Do Not Disturb enabled to avoid low-priority disturbances, yet require urgent audible notifications when critical medical instructions must be executed.
>
> **How It Will Be Used in Sift:**
> 1. **User Control & Explicit Consent:** Users are presented with a dedicated settings toggle (`Enable Critical Alarms`) explaining that this entitlement bypasses Silent/Focus modes.
> 2. **Selective Triggering:** Sift’s Gemini AI parser automatically identifies high-urgency directives (`is_urgent = true`). Only items meeting strict urgency criteria trigger `interruptionLevel: 'critical'`.
> 3. **Custom Audio Cue:** Plays a distinctive, high-clarity notification chime to ensure immediate user awareness during emergency preparation windows.

---

## Part 2: Technical Configuration & Code Setup

Follow these steps to configure Critical Alerts in the Sift Expo codebase.

### Step 1: Update [`app.json`](file:///c:/Workspaces/Sift/app.json)

Add `com.apple.developer.usernotifications.critical-alerts` to your iOS entitlements:

```json
{
  "expo": {
    "name": "Sift",
    "slug": "sift",
    "ios": {
      "bundleIdentifier": "com.senthilmkm.sift",
      "entitlements": {
        "com.apple.security.application-groups": [
          "group.com.senthilmkm.sift"
        ],
        "com.apple.developer.usernotifications.critical-alerts": true
      }
    }
  }
}
```

---

### Step 2: Update Permission Request in [`src/services/notificationService.ts`](file:///c:/Workspaces/Sift/src/services/notificationService.ts)

Modify `requestNotificationPermissions()` to explicitly request `allowCriticalAlerts` from iOS:

```typescript
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
        allowCriticalAlerts: true, // <--- Required for iOS Critical Alerts
      },
    });
    finalStatus = status;
  }
  return finalStatus === 'granted';
}
```

---

### Step 3: Update Scheduling Logic in [`src/services/notificationService.ts`](file:///c:/Workspaces/Sift/src/services/notificationService.ts)

Set `interruptionLevel: 'critical'` on urgent items when scheduling with `expo-notifications`:

```typescript
export async function scheduleItemNotification(
  item: SiftItem, 
  defaultReminderTime: string = '19:00_nightbefore'
): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (item.notification_id) {
    await cancelNotification(item.notification_id);
  }

  // Calculate trigger input...
  // (Existing trigger calculation logic remains identical)

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: item.is_urgent ? `⚡ URGENT: ${item.title}` : `📋 Sift Reminder: ${item.title}`,
      body: item.source_snippet || `Due: ${item.due_at || 'Today'}`,
      sound: true,
      // iOS 15+ Interruption Level:
      interruptionLevel: item.is_urgent ? 'critical' : 'active',
      priority: item.is_urgent 
        ? Notifications.AndroidNotificationPriority.MAX 
        : Notifications.AndroidNotificationPriority.DEFAULT,
      data: { itemId: item.id },
    },
    trigger: triggerInput,
  });

  return notificationId;
}
```

---

## Verification & Testing Checklist

> [!IMPORTANT]
> Apple Critical Alerts will **only** function on a physical iOS device built with a Provisioning Profile that includes the approved Critical Alerts entitlement. They will not ring out loud in Expo Go or the iOS Simulator.

1. **EAS Build:** Build a development client using EAS CLI:  
   `npx eas-cli build --profile development --platform ios`
2. **Device Permission Check:** When Sift launches and requests notification permissions, confirm the system prompt includes:  
   *"Sift Would Like to Send You Critical Alerts."*
3. **Silent Mode Test:** Turn on the physical Silent switch on your iPhone or turn on Do Not Disturb. Schedule an urgent test notification and verify the alarm rings out loud.
