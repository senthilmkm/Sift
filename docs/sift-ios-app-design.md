# Sift — iOS App Master Design & Technical Architecture (Locked v3.0)

> **Status:** FINAL LOCKED SPECIFICATION  
> **Target Platform:** iOS (React Native / Expo + EAS Native Share Extension)  
> **AI Engine:** Google Gemini 2.5 Flash API (via Secure Serverless Edge Proxy)  
> **Contact / Support:** senthil930@gmail.com  

---

## 1. Executive Summary & Brand Strategy

**Sift** is an AI-powered "Document-to-Digest Filter" designed for busy parents and professionals. It converts messy paper flyers, school forms, and PDF attachments into a 15-second tap-to-confirm actionable list.

### Going-Viral App Icon & Visual Identity
- **App Icon Concept:** A sleek, glowing electric-violet and cobalt blue gradient backdrop with a stylized, translucent glassmorphism "funnel/sift lens" icon that turns raw paper documents into radiant, organized checklist checkmarks.
- **Design Language:** Modern iOS Human Interface Guidelines (HIG) with smooth glassmorphism cards, micro-animations, vibrant status badges (urgent amber/coral, actionable violet, informational emerald), and zero visual clutter.
- **User Philosophy:** **Zero Friction, Maximum Value.** The user must never feel annoyed or overwhelmed. Every interaction completes in 1 to 2 taps.

---

## 2. iOS Tab Bar Navigation System

Sift uses a standard 4-tab iOS bottom navigation bar with a centered, elevated **"Quick Scan"** Action Button:

```
┌────────────────────────────────────────────────────────────────────────┐
│  [ 📋 Actionable ]   [ ℹ️ Informational ]   [ 📷 SCAN ]   [ ⚙️ Settings ] │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Tab 1 — 📋 Actionable:**
   - Tasks requiring action by a date (title, due date, priority, open/done checkmark, urgent alarm toggle).
   - Includes top Search Bar + **Filter & Sort Control Bar**.
2. **Tab 2 — ℹ️ Informational:**
   - Reference updates, newsletter highlights, spirit week themes.
   - 1-tap **"Make Actionable"** button (promotes to Actionable tab with due date picker).
3. **Tab 3 — 📷 Quick Scan (Center Floating Action Button):**
   - Launches Camera overlay or presents **"Upload / Share PDF"** sheet immediately.
4. **Tab 4 — ⚙️ Settings:**
   - Complete hub for subscription, reminders, data retention, app reset, and support links.

---

## 3. Advanced Sorting & Filtering System (Record Sets)

Every list view (Actionable, Informational, Archived) includes a non-intrusive, expandable Filter & Sort bar to make user management effortless.

```
┌────────────────────────────────────────────────────────────────────────┐
│  🔍 Search items...                    [ 📑 Filter ]  [ ⇅ Sort: Date ] │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Sorting Capabilities
- **By Due Date (Default):** Ascending (Earliest due first) or Descending.
- **By Priority / Urgency:** Urgent Alarms first $\rightarrow$ Actionable $\rightarrow$ Informational.
- **By Date Added / Created:** Newest scans first.
- **Alphabetical:** A to Z by Title.

### 3.2 Filtering Capabilities
- **Status Filter:** All | Open | Done | Overdue.
- **Urgency Filter:** Show Urgent Alarms Only (⚡).
- **Origin Filter:** Camera Scans vs. Shared PDFs/Images from Mail.
- **Date Range Filter:** Today | This Week | This Month | Overdue.

---

## 4. Settings Screen Specifications

The Settings tab is organized into clean, rounded iOS grouped inset card sections:

### Section 1: Subscription Management
- **Current Plan Status:** Shows active plan (e.g., "Sift Pro Annual — 7 Days Trial Active").
- **Manage Subscription:** Opens iOS native Apple Subscription Management sheet.
- **Restore Purchases:** 1-tap restore via RevenueCat / StoreKit.
- **Upgrade to Pro:** Triggers the Lucrative Paywall UI.

### Section 2: Reminders & Notification Preferences
- **Default Reminder Time:** Picker for evening before due date (default: 7:00 PM).
- **Urgent Alarm Sound:** Select notification sound pattern (e.g., "Chime", "Radar", "Urgent Alert").
- **Focus Mode Guidance:** Help modal explaining how to allow Sift through iOS Focus / Do Not Disturb settings.

### Section 3: Data Retention & Auto-Deletion
- **Auto-Delete Old Items:** Configurable dropdown to automatically prune completed/archived items and associated images:
  - Options: `1 Week` | `2 Weeks` | `4 Weeks` | `90 Days` | `180 Days` | `Never (Default)`.
- **Storage Space Used:** Displays local database & cached image disk usage (e.g., "14.2 MB used").

### Section 4: Danger Zone / Reset App
- **Reset App Data:** Single red-accented button to purge all local SQLite data, document caches, and reset preferences.
- **Double Confirmation Modal:** Requires user to type "RESET" or confirm via biometric TouchID/FaceID to prevent accidental data loss.

### Section 5: Support & Legal (Bottom Section)
- **FAQs & Guides:** Expandable accordion answering common user questions.
- **Contact Support:** Email link directly to `senthil930@gmail.com`.
- **Legal & Web Links:** Clickable buttons opening web views for:
  - 🌐 [Support Hub](support.html)
  - 🔒 [Privacy Policy](privacy.html)
  - 📜 [Terms of Service](terms.html)
- **App Version:** Shows current version & build number (e.g., `v1.0.0 (Build 42)`).

---

## 5. Lucrative Paywall & Subscription Strategy

Because Sift uses Google Gemini Multimodal AI for high-accuracy extraction, we **cannot be conservative** with pricing. We adopt a high-converting, lucrative subscription model.

```
┌────────────────────────────────────────────────────────────────────────┐
│  ⚡ BACK TO SCHOOL SPECIAL — 50% OFF                                  │
│  Unlock Unlimited AI Flyer Scans                                       │
│                                                                        │
│  [✓] Unlimited Gemini 2.5 AI Document Scans                            │
│  [✓] 1-Tap Urgent Alarms & Same-Day Alerts                             │
│  [✓] Export to CSV / PDF & Share to Spouse                             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🌟 ANNUAL PASS (BEST VALUE)           $29.99 / year ($2.50/mo) │  │
│  │ 7 Days Free Trial, then $29.99/yr                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ MONTHLY PRO                           $4.99 / month             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  [ 🚀 START 7-DAY FREE TRIAL ]                                         │
│                                                                        │
│  Restore Purchases  •  Privacy Policy  •  Terms of Use  •  Support     │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Paywall Strategy & Triggers
- **Free Tier:** 5 free document scans per month.
- **Paywall Triggers:**
  1. Attempting scan #6 in a month.
  2. Tapping "Export Data to CSV/PDF".
  3. Enabling "Spouse / Group Email Share".
  4. Tapping "Upgrade to Pro" in Settings.
- **Conversion UX:** Prominent 7-day free trial button, clear comparison badge ("Save 50%"), dynamic promo banner via `pricing.json`.
- **Footer Links:** Mandatory App Store compliance links to `privacy.html`, `terms.html`, and `support.html` pointing to `senthil930@gmail.com`.

---

## 6. Technical Architecture & Secure Gemini API Key Protection

### 🔒 THE SECURITY CRITICAL REQUIREMENT
**Problem:** Hardcoding `GEMINI_API_KEY` inside a client-side iOS bundle (React Native binary) is a severe vulnerability. Anyone can decompile the iOS IPA / JavaScript bundle and steal your Gemini API Key to run up thousands of dollars in API charges.

**Solution:** **Serverless Secure Edge Proxy Architecture.**

```
┌─────────────────┐       HTTPS Payload       ┌──────────────────────────────┐
│  Sift iOS App   │ ────────────────────────► │ Serverless Edge Proxy        │
│  (React Native) │ (Base64 Image + JWT Token)│ (Cloudflare Worker / Vercel) │
└─────────────────┘                           └──────────────┬───────────────┘
                                                             │
                                                  Validates JWT Token & Quota
                                                  Injects Secret GEMINI_API_KEY
                                                             │
                                                             ▼
                                              ┌──────────────────────────────┐
                                              │  Google Gemini 2.5 API       │
                                              └──────────────┬───────────────┘
                                                             │
                                                  Returns Structured JSON
                                                             │
                                                             ▼
┌─────────────────┐   Parsed Candidate Items  ┌──────────────────────────────┐
│  Sift iOS App   │ ◄──────────────────────── │ Serverless Edge Proxy        │
│ (Confirm Screen)│                           └──────────────────────────────┘
└─────────────────┘
```

### 6.1 Serverless Edge Proxy Details
1. **Endpoint:** `https://api.siftapp.com/v1/extract` (or Cloudflare Worker / Supabase Edge Function).
2. **Environment Variable:** `GEMINI_API_KEY` stored securely in Cloudflare / Vercel server environment variables.
3. **Client Authentication:** App Check / Anonymous JWT token issued to device during initial app launch.
4. **Rate Limiting & Quotas:** Proxy checks client request counts against the user's free tier (5 scans/month) or active RevenueCat subscription status before forwarding requests to Gemini.

---

## 7. Web Marketing & Legal Pages (`/web`)

The `/web` folder contains four standalone, highly polished HTML pages designed with modern CSS, glassmorphism, responsive navigation, dark/light modes, and App Store badges:

1. **`index.html` (Master Marketing Landing Page):**
   - **Hero Section:** Stunning headline ("Turn Fridge Flyers into 15-Second Action Items"), interactive mockup, "Download on the App Store" primary call-to-action.
   - **Feature Showcase:** Gemini AI accuracy, 2-tab split (Actionable vs Informational), privacy-first promise, urgent alarms.
   - **Header & Footer:** Professional navigation linking to Features, Privacy, Terms, and Support.
2. **`privacy.html` (Privacy Policy):**
   - Professional iOS app privacy policy stating zero mailbox reading, local SQLite data storage, anonymized AI processing, and contact email `senthil930@gmail.com`.
3. **`terms.html` (Terms of Service):**
   - Comprehensive terms of service covering subscription renewals, auto-cancellation via Apple ID, and user data rights.
4. **`support.html` (Support & FAQ Hub):**
   - Interactive FAQ accordions covering scanning tips, notification setup, subscription management, and a direct contact form pointing to `senthil930@gmail.com`.

---

## 8. Summary of File Locations

- **Design Document:** `C:\Workspaces\Sift\docs\sift-ios-app-design.md`
- **Pricing Config:** `C:\Workspaces\Sift\docs\pricing.json`
- **Web Pages:** `C:\Workspaces\Sift\web\index.html`, `privacy.html`, `terms.html`, `support.html`
