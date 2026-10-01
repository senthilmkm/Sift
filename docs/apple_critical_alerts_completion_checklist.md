# 📋 Sift: Apple Critical Alerts Completion & Deployment Checklist

This document details the **3 non-code deployment steps** required to activate Apple Critical Alerts for Sift on physical iOS devices, TestFlight, and the App Store.

---

## Executive Summary & Codebase Status

- **Codebase Implementation:** **100% COMPLETE**
  - Entitlements added to [`app.json`](file:///c:/Workspaces/Sift/app.json#L30) (`com.apple.developer.usernotifications.critical-alerts`)
  - iOS notification permission request includes `allowCriticalAlerts: true` in [`notificationService.ts`](file:///c:/Workspaces/Sift/src/services/notificationService.ts#L39)
  - `interruptionLevel: 'critical'` configured for urgent items when `enableCriticalAlerts` is toggled ON in Settings
  - Unit tests and TypeScript type checks verified (`npx tsc --noEmit` and `npx jest` 12/12 suites passing)

---

## 3 Pending Deployment Steps

### Step 1: Submit Apple Developer Entitlement Application (✅ SUBMITTED)

- **Status:** **Submitted & Pending Apple Review**
- **Apple Request ID:** `25258T5RLF`
- **Submission Date:** October 1, 2026
- **Submitted Bundle ID:** `com.senthilmkm.sift`

> **Note:** Apple standard review turnaround is 24–48 hours. Proceed to Step 2 once Apple sends approval notification email.

---

### Step 2: Update App Store Connect & Provisioning Profiles

Once Apple approves the entitlement request via email:

1. Log into [Apple Developer Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list).
2. Click Identifiers and select **`com.senthilmkm.sift`**.
3. Under **Capabilities**, check **Critical Alerts**.
4. Save your changes and re-generate provisioning profiles.
5. Sync credentials using EAS CLI:
   ```bash
   bunx eas-cli credentials
   ```
   Select **iOS** ➔ **Provisioning Profiles** ➔ **Re-sign / Update**.

---

### Step 3: Physical Hardware Verification Checklist

> [!IMPORTANT]
> Apple Critical Alerts **only** function on physical iOS devices built with an entitlement-signed binary. They will **not** ring out loud in Expo Go or the iOS Simulator.

1. **Build Development / TestFlight Client:**
   ```bash
   bunx eas-cli build --profile development --platform ios
   ```
   *(Or for TestFlight: `bunx eas-cli build --profile production --platform ios`)*

2. **Permission Prompt Verification:**
   Launch the app on a physical iPhone and toggle **Notifications** ON in Settings. Verify the system prompt states:
   > *"Sift Would Like to Send You Critical Alerts. Critical alerts display on the Lock Screen and play a sound even if your phone is muted or Do Not Disturb is on."*

3. **Silent & Focus Mode Hardware Test:**
   - Flip the physical Silent switch on the iPhone to **Mute** (red indicator visible).
   - Turn on **Do Not Disturb** or Sleep Focus mode.
   - Schedule an urgent task scan or send a test alert.
   - **Expected Outcome:** The device rings out loud and displays the urgent banner on the Lock Screen despite Silent/Focus mode.
