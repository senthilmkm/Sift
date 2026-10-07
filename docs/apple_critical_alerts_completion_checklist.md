# 📋 Sift: Apple Critical Alerts Status (DISABLED)

**Status:** **DISABLED** (October 7, 2026)

Apple Critical Alerts entitlement and code triggers have been turned off for Sift to streamline App Store submission without requiring custom entitlement review.

---

## Current Configuration

- **Entitlement:** Removed `com.apple.developer.usernotifications.critical-alerts` from [`app.json`](file:///c:/Workspaces/Sift/app.json).
- **Notification Request:** Removed `allowCriticalAlerts: true` from [`notificationService.ts`](file:///c:/Workspaces/Sift/src/services/notificationService.ts).
- **Interruption Level:** Set to `timeSensitive` (iOS 15+) for urgent notifications, which delivers alerts promptly on lock screen without requiring Apple approval.
- **Verification:** All tests and TypeScript checks verified passing (`npx tsc --noEmit` & `npm test`).

