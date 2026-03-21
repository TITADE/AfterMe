# After Me — Android UAT Test Scripts

**Document Version:** 1.0  
**Last Updated:** March 2026  
**App Version:** After Me Mobile v1.0  
**Platform:** Android (physical device or emulator)  
**Build:** Debug build via `npx expo run:android` · Production AAB via EAS

> **This document is for the Android test team only.**  
> A separate iOS UAT script document exists for the iOS test team.  
> Do not mix these documents — several flows, labels, and features differ between platforms.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Test Accounts & Prerequisites](#3-test-accounts--prerequisites)
4. [Test Suite Overview](#4-test-suite-overview)
5. [AND-01 · First Launch & Onboarding](#and-01--first-launch--onboarding)
6. [AND-02 · Biometric Authentication](#and-02--biometric-authentication)
7. [AND-03 · Legal Disclaimer & Privacy](#and-03--legal-disclaimer--privacy)
8. [AND-04 · Safety Net Setup — Android Layout](#and-04--safety-net-setup--android-layout)
9. [AND-05 · Vault Dashboard](#and-05--vault-dashboard)
10. [AND-06 · Document Scanning](#and-06--document-scanning)
11. [AND-07 · Document Import (Files & Photos)](#and-07--document-import-files--photos)
12. [AND-08 · Document Library — Search, Sort & Filter](#and-08--document-library--search-sort--filter)
13. [AND-09 · Document Viewer & Metadata Editing](#and-09--document-viewer--metadata-editing)
14. [AND-10 · Free Tier Limit & Paywall](#and-10--free-tier-limit--paywall)
15. [AND-11 · In-App Purchase — Premium Upgrade (Lifetime)](#and-11--in-app-purchase--premium-upgrade-lifetime)
16. [AND-12 · Family Kit Creation](#and-12--family-kit-creation)
17. [AND-13 · Family Kit — Survivor Import](#and-13--family-kit--survivor-import)
18. [AND-14 · Personal Recovery Kit](#and-14--personal-recovery-kit)
19. [AND-15 · Settings — Biometric Lock & Security](#and-15--settings--biometric-lock--security)
20. [AND-16 · Vault Integrity Check](#and-16--vault-integrity-check)
21. [AND-17 · Multi-Vault Management](#and-17--multi-vault-management)
22. [AND-18 · Help & FAQ Screen — Android Content](#and-18--help--faq-screen--android-content)
23. [AND-19 · Restore My Vault (Device Loss Recovery)](#and-19--restore-my-vault-device-loss-recovery)
24. [AND-20 · Accessibility — TalkBack & Font Scaling](#and-20--accessibility--talkback--font-scaling)
25. [AND-21 · Reset & Re-Onboarding](#and-21--reset--re-onboarding)
26. [AND-22 · Onboarding — How It Works Screen](#and-22--onboarding--how-it-works-screen)
27. [AND-23 · Safety Net — Family Kit Path](#and-23--safety-net--family-kit-path)
28. [AND-24 · Safety Net — Defer Path](#and-24--safety-net--defer-path)
29. [AND-25 · Settings → Support Content](#and-25--settings--support-content)
30. [AND-26 · Website — How It Works Page](#and-26--website--how-it-works-page)
31. [AND-27 · Premium Gate — Family Kit from Onboarding](#and-27--premium-gate--family-kit-from-onboarding)
32. [AND-28 · Paywall UX — Lifetime Hero, Break-Even & Death-Risk](#and-28--paywall-ux--lifetime-hero-break-even--death-risk)
33. [AND-29 · Annual Plan Purchase via Paywall](#and-29--annual-plan-purchase-via-paywall)
34. [AND-30 · Settings — Annual Subscriber Upgrade Card](#and-30--settings--annual-subscriber-upgrade-card)
35. [AND-31 · Website — Pricing Section](#and-31--website--pricing-section)
36. [AND-32 · Family Kit — Empty Vault Guard](#and-32--family-kit--empty-vault-guard)
37. [AND-33 · Android Back Gesture Behaviour](#and-33--android-back-gesture-behaviour)
38. [AND-34 · iCloud UI Absent on Android](#and-34--icloud-ui-absent-on-android)
39. [AND-35 · Google Play Billing — Restore & Cancel Wording](#and-35--google-play-billing--restore--cancel-wording)
40. [AND-36 · Android Keystore Label & Key Storage](#and-36--android-keystore-label--key-storage)
41. [AND-37 · Android-Specific Permission Prompts](#and-37--android-specific-permission-prompts)
42. [Pass/Fail Summary Sheet](#passfail-summary-sheet)

---

## 1. Introduction

This document provides step-by-step manual UAT test scripts for the After Me mobile application on **Android only**. It covers all implemented phases adapted for the Android platform:

- **Phase 1:** Encryption, Android Keystore key management, biometric authentication
- **Phase 2:** Document ingestion, scanning, import
- **Phase 3:** UI/UX, categories, document library
- **Phase 4:** Family Kit creation and survivor import
- **Phase 5:** Onboarding, Google Play Billing in-app purchases
- **Phase 6:** Personal Recovery Kit, multi-vault, Help screen
- **Android-specific:** Back gesture behaviour, permission prompts, iCloud UI absence, Google Play wording, Android Keystore label

### Key Android differences from iOS — read before starting

| Feature | iOS | Android |
|---------|-----|---------|
| Biometric label | Face ID / Touch ID | Fingerprint / Biometric |
| Key storage label | Secure Enclave | Android Keystore |
| iCloud Backup | Available in Settings | **Not present** — section hidden |
| Safety Net screen | 2 cards (Family Kit + iCloud) | **1 card only** (Family Kit) + Defer |
| How It Works screen | Shows iCloud path (Path 2) | iCloud path not applicable |
| Restore purchases alert | "Apple ID" | "Google account" |
| Cancel subscription | "Cancel in App Store Settings" | "Cancel in Google Play Settings" |
| IAP system | StoreKit (iOS system sheet) | Google Play Billing (Play sheet) |
| Accessibility tool | VoiceOver | TalkBack |
| TestFlight invite | In Settings → Beta | **Not present** |
| Back navigation | Swipe from left edge | System back gesture / button |
| Device recovery | iCloud Keychain + QR kit | QR kit + .afterme file only |

---

## 2. Test Environment Setup

| Item | Requirement |
|------|-------------|
| Device | Physical Android device **or** Android emulator (Pixel 7 recommended) |
| Android Version | Android 9 (API 28) minimum · Android 13+ recommended |
| Google Play | Signed into a Google account (for IAP testing) |
| Network | Active internet connection (for Google Play Billing) |
| Build type | Debug build for development testing · Release AAB for Play Console testing |
| Camera | Camera permission granted to After Me |
| Storage | At least 200 MB free |
| Biometrics | Fingerprint enrolled on device (or PIN/pattern as fallback) |
| Second device | Required for AND-13 (Survivor Import) — OR use same device after full reset |
| Printed QR card | Required for AND-13, AND-19 — print or display from AND-12 / AND-14 |
| .afterme file | Required for AND-13, AND-19 — save during AND-12 / AND-14 |

### Install the test build

```bash
# Connect Android device via USB with USB debugging enabled, then:
cd after-me-mobile
npx expo run:android

# OR for emulator:
npx expo run:android  # auto-detects running emulator
```

### Fix emulator network connection (if Metro bundler not connecting)

```bash
# Run this once after emulator boots — forwards Metro port to emulator:
adb reverse tcp:8081 tcp:8081
```

---

## 3. Test Accounts & Prerequisites

| Item | Details |
|------|---------|
| Google Play test account | Use a **licence tester** account added in Play Console → Setup → Licence Testing |
| Licence tester email | Add your Google account as a licence tester so purchases are free in testing |
| IAP Products required | `com.afterme.app.premium.lifetime` (in-app product) and `com.afterme.app.premium.annual` (subscription) must be **Active** in Google Play Console |
| Test documents | Have 2–3 real documents ready to photograph (passport photo page, any ID, any utility bill) |
| .afterme file | Save one during AND-12; needed for AND-13 and AND-19 |
| QR Key Card | Print or screenshot from AND-12; needed for AND-13 and AND-19 |

> **Note on Google Play IAP in testing:** Unlike iOS sandbox, Google Play licence testers make real purchases that are immediately refunded. You must be signed into the **same Google account** on the device that is registered as a licence tester in Play Console.

---

## 4. Test Suite Overview

| Suite | Test ID | Description | Priority |
|-------|---------|-------------|----------|
| Onboarding | AND-01 | First launch, full onboarding flow (8 screens) | CRITICAL |
| Auth | AND-02 | Fingerprint / biometric lock and unlock | CRITICAL |
| Legal | AND-03 | Legal disclaimer, correct privacy URL | HIGH |
| Safety Net | AND-04 | Safety Net screen — Android layout (1 card only) | CRITICAL |
| Dashboard | AND-05 | Vault dashboard, progress rings, categories | HIGH |
| Scanning | AND-06 | Camera document scanning | CRITICAL |
| Import | AND-07 | Import from Files and Photos | HIGH |
| Library | AND-08 | Search, sort, filter, long-press | HIGH |
| Viewer | AND-09 | View, edit metadata, delete | HIGH |
| Free Tier | AND-10 | 5-document free tier enforcement | CRITICAL |
| Purchases | AND-11 | Premium upgrade — lifetime (Google Play Billing) | CRITICAL |
| Family Kit | AND-12 | Create Family Kit, QR card, PDF | CRITICAL |
| Survivor | AND-13 | Open a Family Kit as a survivor | CRITICAL |
| Recovery Kit | AND-14 | Personal Recovery Kit creation | HIGH |
| Security | AND-15 | Biometric toggle, session lock | HIGH |
| Integrity | AND-16 | Vault integrity scan | MEDIUM |
| Multi-Vault | AND-17 | Create and switch vaults | MEDIUM |
| Help | AND-18 | Help & FAQ — Android-specific answers | HIGH |
| Device Loss | AND-19 | Restore My Vault from Welcome screen | CRITICAL |
| Accessibility | AND-20 | TalkBack, font scaling | HIGH |
| Reset | AND-21 | Full reset and re-onboarding | HIGH |
| How It Works | AND-22 | Onboarding explainer screen | HIGH |
| Safety Net — Kit | AND-23 | Safety Net: Family Kit path (primary) | CRITICAL |
| Safety Net — Defer | AND-24 | Safety Net: defer path | HIGH |
| Support Content | AND-25 | Settings → Support — correct links only | HIGH |
| Website | AND-26 | How It Works web page | MEDIUM |
| Premium Gate | AND-27 | Family Kit premium gate from onboarding | CRITICAL |
| Paywall UX | AND-28 | Paywall Layout — Lifetime Hero, Break-Even, Death-Risk | CRITICAL |
| Annual Purchase | AND-29 | Annual Plan via Google Play Billing | CRITICAL |
| Upgrade Card | AND-30 | Settings → Upgrade Card for Annual Subscribers | HIGH |
| Website Pricing | AND-31 | Website Pricing Section — Lifetime Hero + Annual | HIGH |
| Family Kit Guard | AND-32 | Family Kit — Empty Vault Guard | CRITICAL |
| Back Gesture | AND-33 | Android system back gesture throughout app | HIGH |
| iCloud Absent | AND-34 | iCloud UI is fully absent on Android | CRITICAL |
| Play Billing Text | AND-35 | Google Play wording in alerts and legal text | HIGH |
| Keystore Label | AND-36 | Android Keystore label in Settings | MEDIUM |
| Permissions | AND-37 | Android permission prompt flows | HIGH |

---

## AND-01 · First Launch & Onboarding

**Priority:** CRITICAL  
**Precondition:** Fresh install. App has never been opened on this device.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 01.1 | Launch the app | Welcome screen appears with After Me logo, tagline "Your legacy. Their peace of mind.", and 3 buttons | ☐ |
| 01.2 | Verify button layout | "I'm Planning My Legacy" (amber, primary), "I Have a Legacy Kit" (secondary, border), "Restore My Vault" (subtle, lowest) | ☐ |
| 01.3 | Tap "I'm Planning My Legacy" | First onboarding screen appears — emotional, warm tone | ☐ |
| 01.4 | Read and advance through Screens 1–4 | Each screen loads without crash; back navigation works via system back gesture | ☐ |
| 01.5 | After Screen 4 (QR reveal), note the next screen | "How Your Family Will Access This" explainer screen appears before the Legal Disclaimer | ☐ |
| 01.6 | Read explainer screen and tap "I understand — continue" | App proceeds to Legal Disclaimer screen | ☐ |
| 01.7 | Verify Legal Disclaimer screen | Legal disclaimer appears with full text and Privacy Policy link | ☐ |
| 01.8 | Tap "I Accept & Continue" | App proceeds to biometric setup screen | ☐ |
| 01.9 | Tap primary CTA on biometric screen | Android fingerprint / biometric system prompt appears | ☐ |
| 01.10 | Authenticate successfully | Success animation plays; screen advances to Screen 8 (Safety Net) | ☐ |
| 01.11 | Verify Safety Net screen shows **1 card only** | Only the "Create a Family Kit" card and the defer option are visible — **no iCloud card** | ☐ |
| 01.12 | Complete Safety Net screen (see AND-23/AND-24) | App transitions to the main vault dashboard | ☐ |
| 01.13 | Verify main tabs | Four tabs visible: Vault, Documents, Family Kit, Settings | ☐ |
| 01.14 | Verify progress dot count throughout onboarding | 8 dots shown in total; active dot advances correctly on each screen | ☐ |
| 01.15 | Verify no crash on any screen | All 8 onboarding screens load and animate without crash or ANR | ☐ |

---

## AND-02 · Biometric Authentication

**Priority:** CRITICAL  
**Precondition:** App has completed onboarding. Fingerprint enrolled on device.  
**Note:** On Android the label will show "Fingerprint", "Biometric", or the device-specific equivalent — not "Face ID" or "Touch ID".

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 02.1 | Background the app (press Home or swipe up) | App moves to background | ☐ |
| 02.2 | Wait 3 seconds, then reopen app | Biometric lock screen appears (vault is locked) | ☐ |
| 02.3 | Authenticate with fingerprint | Vault unlocks; dashboard is shown | ☐ |
| 02.4 | Background again; return immediately | App may or may not require re-auth (session cached for a short period) | ☐ |
| 02.5 | Force-close app from recent apps | — | ☐ |
| 02.6 | Reopen app | Biometric prompt appears again immediately | ☐ |
| 02.7 | Cancel / fail biometric twice | Error animation plays; option to use device PIN / pattern shown | ☐ |
| 02.8 | Use device PIN fallback | Vault unlocks successfully | ☐ |
| 02.9 | Verify biometric label on lock screen | Label reads "Fingerprint", "Biometric", or similar — **not** "Face ID" | ☐ |

---

## AND-03 · Legal Disclaimer & Privacy

**Priority:** HIGH  
**Precondition:** Fresh install (or after reset).

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 03.1 | Advance onboarding past the How It Works screen | Legal Disclaimer screen appears | ☐ |
| 03.2 | Verify disclaimer text is readable | No truncation; scrollable if content is long | ☐ |
| 03.3 | Tap "View our Privacy Policy" link | Chrome / browser opens **`https://myafterme.co.uk/privacy`** (verify the URL exactly) | ☐ |
| 03.4 | Use system back or close browser tab | App / disclaimer screen is still showing | ☐ |
| 03.5 | Tap "I Accept & Continue" | Acceptance saved; app proceeds | ☐ |
| 03.6 | Verify acceptance persists | Complete onboarding. Go to Settings. No re-prompt for disclaimer. | ☐ |

---

## AND-04 · Safety Net Setup — Android Layout

**Priority:** CRITICAL  
**Precondition:** Reached the Safety Net screen (Screen 8) of onboarding.  
**Android-specific:** On Android this screen shows **only one card** (Family Kit). The iCloud card is absent. The subhead "Two very different things." and the body copy about iCloud are also absent.

### Verify screen content before testing scenarios

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 04.0 | Reach Safety Net screen | Headline reads "One last step." | ☐ |
| 04.0a | Verify body copy | Body reads: "Create your kit now, or set it up once you have added documents." — **no mention of iCloud** | ☐ |
| 04.0b | Count the cards visible | **Only 1 card** — "Create a Family Kit" with amber accent. The iCloud card does **not** appear. | ☐ |
| 04.0c | Inspect the Family Kit card | "Create a Family Kit" with amber border and "For your family" badge | ☐ |
| 04.0d | Inspect card secondary text | Reads: "The only way your loved ones can access this vault. Add documents first, then generate your kit." | ☐ |
| 04.0e | Verify no "Two very different things." subhead | That subhead is iOS-only — it must **not** appear on Android | ☐ |
| 04.0f | Verify no iCloud card | No card labelled "Enable iCloud Backup" or "For you only" is present | ☐ |
| 04.0g | Verify defer option present | "Living dangerously — remind me later" link is visible below the card | ☐ |

*For full scenario testing of each option, see AND-23 (Family Kit path) and AND-24 (defer path).*

---

## AND-05 · Vault Dashboard

**Priority:** HIGH  
**Precondition:** Onboarding complete. At least 0 documents in vault.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 05.1 | Open Vault tab | Dashboard shows overall vault completeness ring | ☐ |
| 05.2 | Verify 8 category cards | Identity, Financial, Property, Insurance, Medical, Legal, Digital, Personal | ☐ |
| 05.3 | Verify category progress rings | Each category shows a small circular progress ring with count | ☐ |
| 05.4 | Tap a category card | Navigates to Document Library filtered to that category | ☐ |
| 05.5 | Use system back gesture | Returns to Dashboard | ☐ |
| 05.6 | Add 3 documents (see AND-06) and return to Dashboard | Progress rings update to reflect added documents | ☐ |
| 05.7 | Verify completeness score increases | Overall ring and percentage updates | ☐ |
| 05.8 | If safety net was deferred, verify warning card | A warning banner prompting to set up a safety net is visible | ☐ |
| 05.9 | If Family Kit was not created, verify nudge card | Dashboard shows a prompt to create or update the Family Kit | ☐ |

---

## AND-06 · Document Scanning

**Priority:** CRITICAL  
**Precondition:** Onboarding complete. Camera permission granted (see AND-37 for permission flow).

### Single-Page Scan

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 06.1 | Tap Documents tab → tap "+" button | Add Document modal appears | ☐ |
| 06.2 | Select a document category (e.g. "Identity") | Category picker with icons and descriptions shown | ☐ |
| 06.3 | Tap "Scan with Camera" | Document scanner opens with real-time edge detection | ☐ |
| 06.4 | Aim camera at a flat document | Green border / edge detection overlay appears around document | ☐ |
| 06.5 | Capture the document | Preview or crop screen appears | ☐ |
| 06.6 | Accept / confirm the scan | Returns to Add Document flow | ☐ |
| 06.7 | Enter a title (e.g. "My Passport") | Text input accepts the title | ☐ |
| 06.8 | Tap "Save Document" | Document appears in the library with a thumbnail | ☐ |
| 06.9 | Verify thumbnail is visible in grid | Document shows a real thumbnail (not a placeholder icon) | ☐ |

### Multi-Page Scan

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 06.10 | Open Add Document → select "Scan with Camera" | Scanner opens | ☐ |
| 06.11 | Scan a document, then add additional pages if supported | Multiple pages captured | ☐ |
| 06.12 | Save the multi-page document | Document saved with a descriptive title | ☐ |

---

## AND-07 · Document Import (Files & Photos)

**Priority:** HIGH  
**Precondition:** Test PDF and test JPEG available on device.

### Import from Files

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 07.1 | Open Add Document → select a category → tap "Pick from Files" | Android file picker (DocumentsUI) opens | ☐ |
| 07.2 | Navigate to a PDF file | File is selectable | ☐ |
| 07.3 | Select the PDF | Returns to app; title pre-populated from filename | ☐ |
| 07.4 | Confirm and save | PDF document appears in the library | ☐ |
| 07.5 | Open the document | PDF renders in the viewer | ☐ |

### Import from Photos

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 07.6 | Open Add Document → select a category → tap "Pick from Photos" | Android photo picker opens | ☐ |
| 07.7 | Select a photo | Returns to app; title editable | ☐ |
| 07.8 | Enter a title and save | Image document saved with thumbnail | ☐ |

### Unsupported File Type

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 07.9 | Try importing a `.docx` or `.mp4` file | App shows an error: "Unsupported file type" | ☐ |
| 07.10 | Verify app does not crash | App remains stable; no crash or ANR | ☐ |

---

## AND-08 · Document Library — Search, Sort & Filter

**Priority:** HIGH  
**Precondition:** At least 5 documents in vault across 2+ categories.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 08.1 | Open Documents tab | 2-column grid of document thumbnails shown | ☐ |
| 08.2 | Tap the search bar | Keyboard appears; search field is focused | ☐ |
| 08.3 | Type part of a document title | Library filters in real time to matching documents | ☐ |
| 08.4 | Clear search | All documents shown again | ☐ |
| 08.5 | Tap the sort button | Sort mode toggles (Newest → Oldest → Name) | ☐ |
| 08.6 | Sort by Name | Documents reorder alphabetically | ☐ |
| 08.7 | Tap a category filter badge | Library filters to that category only | ☐ |
| 08.8 | Verify filter badge tap target | Badge is large enough to tap easily | ☐ |
| 08.9 | Tap "All" filter | All documents shown again | ☐ |
| 08.10 | Long-press a document card | Context menu appears with "Rename" and "Delete" options | ☐ |
| 08.11 | Tap "Rename" | A rename dialog/modal appears | ☐ |
| 08.12 | Enter a new name and confirm | Document renamed; library updates immediately | ☐ |

---

## AND-09 · Document Viewer & Metadata Editing

**Priority:** HIGH  
**Precondition:** At least 1 document exists in vault.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 09.1 | Tap a document in the library | Document viewer opens | ☐ |
| 09.2 | Verify document renders | Image: photo shown. PDF: PDF viewer renders document. | ☐ |
| 09.3 | Verify metadata shown | Title, category, date added, provider (if set) visible | ☐ |
| 09.4 | Tap "Edit" button | Edit mode activates; text fields become editable | ☐ |
| 09.5 | Change the title | New title entered in text input | ☐ |
| 09.6 | Set a document date | Date field accepts date input | ☐ |
| 09.7 | Set a provider name (e.g. "Home Office") | Text input accepts value | ☐ |
| 09.8 | Set an expiry date (e.g. 5 years from today) | Date input accepted | ☐ |
| 09.9 | Tap "Save" | Success feedback shown; viewer displays updated metadata immediately | ☐ |
| 09.10 | Use system back; reopen the document | Updated metadata persists correctly | ☐ |
| 09.11 | Tap "Delete Document" button | Confirmation dialog appears | ☐ |
| 09.12 | Cancel delete | Document remains | ☐ |
| 09.13 | Delete via long-press context menu | Document removed from library; thumbnail removed | ☐ |

---

## AND-10 · Free Tier Limit & Paywall

**Priority:** CRITICAL  
**Precondition:** Not yet upgraded to Premium. Fresh vault (or reset).  
**Note:** Free tier limit is **5 documents**. Verify all in-app references show "5", not any other number.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 10.1 | Add documents until 4 are in the vault | Each document adds normally | ☐ |
| 10.2 | Open Add Document modal with 4 documents stored | Free tier banner shows "1 of 5 free documents remaining" | ☐ |
| 10.3 | Add the 5th document | Document saves; banner shows "Free limit reached (5 documents). Upgrade to add more." | ☐ |
| 10.4 | Attempt to add a 6th document | Paywall screen appears automatically | ☐ |
| 10.5 | Verify paywall headline | "You've reached the free limit of 5 documents." | ☐ |
| 10.6 | Dismiss paywall | Returns to document library; no document added; still 5 documents | ☐ |
| 10.7 | Open Settings → Subscription section | Shows "Free" status and "Upgrade to Premium" amber button | ☐ |
| 10.8 | Tap "Upgrade to Premium" in Settings | Paywall appears | ☐ |

---

## AND-11 · In-App Purchase — Premium Upgrade (Lifetime)

**Priority:** CRITICAL  
**Precondition:** Licence tester Google account signed into device. Both IAP products active in Google Play Console.  
**Android-specific:** The purchase sheet is the **Google Play Billing** system UI, not StoreKit. The sheet will show the Google Play payment UI with your Google account.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 11.1 | Open paywall from any trigger (Settings or document limit) | Paywall opens with Lifetime card displayed **first and prominently** as the hero product | ☐ |
| 11.2 | Verify Lifetime is pre-selected | Lifetime product has amber border, radio filled, and "BEST VALUE · RECOMMENDED" badge visible | ☐ |
| 11.3 | Verify Lifetime price displayed | Shows real price from Google Play — expected £79.99 | ☐ |
| 11.4 | Verify "Pay once. Then never again." subtitle appears under lifetime price | Text present on lifetime card | ☐ |
| 11.5 | Tap "Get Lifetime — £79.99" CTA | **Google Play Billing** purchase sheet appears (system UI) | ☐ |
| 11.6 | Confirm purchase with licence tester account | Purchase completes; paywall dismisses automatically | ☐ |
| 11.7 | Verify premium status in Settings | Settings → Subscription shows "Lifetime access — no renewals, ever" | ☐ |
| 11.8 | Verify no upgrade card is shown | Annual subscriber upgrade card does **not** appear (user is lifetime) | ☐ |
| 11.9 | Verify document limit removed | Can add a 6th document without paywall appearing | ☐ |
| 11.10 | Verify Family Kit unlocked | Family Kit creation wizard opens without paywall | ☐ |

### Restore Purchases

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 11.11 | Open Settings → Subscription → "Restore Purchases" | Loading spinner; Google Play is queried | ☐ |
| 11.12 | Verify restore result | "Lifetime access — no renewals, ever" restored; **no mention of Apple ID** | ☐ |
| 11.13 | Verify no purchases found alert (with empty account) | Alert reads: "We couldn't find any previous purchases for this **Google account**." — not "Apple ID" | ☐ |

---

## AND-12 · Family Kit Creation

**Priority:** CRITICAL  
**Precondition:** Premium account. **At least 1 document in vault** — the wizard immediately dismisses with an Alert if the vault is empty (see AND-32).

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 12.1 | Tap "Family Kit" tab | Family Kit screen shows history / create button | ☐ |
| 12.2 | Tap "Create Family Kit" | Kit Creation Wizard opens — Step 1: Introduction | ☐ |
| 12.3 | Read introduction and tap "Get Started" | Step 2: owner name and emergency contact form | ☐ |
| 12.4 | Enter your name and an emergency contact name | Fields accept text; Android keyboard appears | ☐ |
| 12.5 | Tap "Generate Kit" | Step 3: Loading / generating state shown | ☐ |
| 12.6 | Wait for generation to complete | Step 4: Validating; then Step 5: Complete | ☐ |
| 12.7 | Verify QR code is shown | A QR code is visible on the success screen | ☐ |
| 12.8 | Tap "Save & Distribute" | Step 6: Distribution options shown | ☐ |
| 12.9 | Tap "Save .afterme File" | Android share sheet appears (Files, Drive, email, etc.) | ☐ |
| 12.10 | Save file to Downloads or Google Drive | File saved with `.afterme` extension | ☐ |
| 12.11 | Tap "Print QR Key Card" | PDF is generated; Android share sheet appears (print, save, share) | ☐ |
| 12.12 | Dismiss wizard | Wizard closes; Family Kit tab shows kit history entry | ☐ |
| 12.13 | Verify freshness status | Kit shows "Fresh" status indicator | ☐ |
| 12.14 | Add a new document to vault | Family Kit tab shows a "stale" or "update recommended" warning | ☐ |
| 12.15 | **Verify both outputs exist** | You now have (a) the `.afterme` file and (b) the printed/saved QR Key Card PDF — keep both for AND-13 | ☐ |

---

## AND-13 · Family Kit — Survivor Import

**Priority:** CRITICAL  
**Precondition:** A valid `.afterme` file and its QR code (from AND-12) are available. Use a second Android device or fresh install.  
**Note:** The survivor flow does not show bereavement support links at any point. After import, the flow ends at an "Open the Vault" button.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 13.1 | Fresh install (or use second device) and launch app | Welcome screen shown | ☐ |
| 13.2 | Tap "I Have a Legacy Kit" | Survivor onboarding screen appears | ☐ |
| 13.3 | Verify tone and language | Warm, compassionate language; dove emoji; "Take your time. There's no rush." | ☐ |
| 13.4 | Read the 3-step overview and tap "I'm Ready to Begin" | Camera opens for QR scanning | ☐ |
| 13.5 | Grant camera permission if prompted | Camera permission granted | ☐ |
| 13.6 | Scan the printed/displayed QR code from AND-12 | Access key extracted; "QR Code Received" screen appears | ☐ |
| 13.7 | Tap "Select .afterme File" and choose the file via Android file picker | Decryption begins; "Importing Vault" loading screen shown | ☐ |
| 13.8 | Wait for import to complete | "Vault Imported Successfully" screen shown with document count | ☐ |
| 13.9 | Verify vault intro screen content | Shows document count, three info bullets (encryption, categories, biometric protection) | ☐ |
| 13.10 | **Verify no support links appear** | No external links, no bereavement resources, no phone numbers appear anywhere | ☐ |
| 13.11 | Tap "Open the Vault" | Main vault dashboard opens | ☐ |
| 13.12 | Verify all documents present | All documents from original vault are visible in library | ☐ |
| 13.13 | Open a document | Document content renders correctly | ☐ |
| 13.14 | Verify vault is protected by own biometrics | Force-close and reopen — fingerprint prompt from the survivor's own device appears | ☐ |

---

## AND-14 · Personal Recovery Kit

**Priority:** HIGH  
**Precondition:** At least 1 document in vault.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 14.1 | Open Settings → "Personal Recovery" section | "Personal Recovery Kit" button visible | ☐ |
| 14.2 | Tap "Personal Recovery Kit" | Wizard opens with introduction screen | ☐ |
| 14.3 | Read the introduction and storage recommendations | Clear instructions about storing file and QR code separately | ☐ |
| 14.4 | Tap "Generate Recovery Kit" | Loading screen with "Encrypting your vault…" | ☐ |
| 14.5 | Wait for completion | QR code shown on completion screen | ☐ |
| 14.6 | Tap "Save & Share" | Distribution screen shown | ☐ |
| 14.7 | Tap "Save .afterme File" | Android share sheet appears | ☐ |
| 14.8 | Tap "Print QR Recovery Card" | PDF share sheet appears | ☐ |
| 14.9 | Tap "Done" | Wizard closes | ☐ |

---

## AND-15 · Settings — Biometric Lock & Security

**Priority:** HIGH  
**Precondition:** Onboarding complete.  
**Android-specific:** There is **no iCloud Backup section** in Settings on Android. Verify it is absent.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 15.1 | Open Settings → Security section | Biometric lock toggle shown; currently on | ☐ |
| 15.2 | Toggle biometric lock OFF | Toggle state changes; preference saved | ☐ |
| 15.3 | Background and reopen app | App reopens WITHOUT biometric prompt | ☐ |
| 15.4 | Toggle biometric lock back ON | Toggle state changes; preference saved | ☐ |
| 15.5 | Background and reopen app | Biometric prompt appears again | ☐ |
| 15.6 | Open Settings → Storage section | Shows encrypted vault size and used percentage | ☐ |
| 15.7 | Verify storage bar / display | Correct byte count displayed | ☐ |
| 15.8 | **Verify NO iCloud Backup section** | Scroll through entire Settings screen — no "iCloud Backup" section, toggle, "Back Up Now" button, or "Restore from Backup" button is present | ☐ |

---

## AND-16 · Vault Integrity Check

**Priority:** MEDIUM  
**Precondition:** At least 3 documents in vault.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 16.1 | Open Settings → Storage section | "Check Integrity" button visible | ☐ |
| 16.2 | Tap "Check Integrity" | Loading state; scan in progress | ☐ |
| 16.3 | Wait for scan to complete | Result shown: "X of Y documents verified. No corruption found." | ☐ |
| 16.4 | Verify no false positives | Normal, readable documents should all pass | ☐ |

---

## AND-17 · Multi-Vault Management

**Priority:** MEDIUM  
**Precondition:** Premium account (required for multiple vaults).

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 17.1 | Open Settings → "Manage Vaults" | Vault Manager screen opens in a modal | ☐ |
| 17.2 | Verify default vault | "My Vault" shown with a "Default" badge | ☐ |
| 17.3 | Tap "Create New Vault" (dashed card) | Name input dialog appears | ☐ |
| 17.4 | Enter "Work Documents" and create | New vault appears in list | ☐ |
| 17.5 | Tap "Work Documents" vault | "Active" badge moves to Work Documents vault | ☐ |
| 17.6 | Go to Documents tab | Library is empty (new vault has no documents) | ☐ |
| 17.7 | Add a document to Work Documents vault | Document saved in separate vault | ☐ |
| 17.8 | Switch back to "My Vault" | Original documents reappear in library | ☐ |
| 17.9 | Long-press "Work Documents" vault | Rename dialog appears | ☐ |
| 17.10 | Rename vault to "Business Docs" | Vault name updated | ☐ |
| 17.11 | Try to delete "My Vault" (default) | Error shown: "Cannot delete the default vault" | ☐ |
| 17.12 | Delete "Business Docs" vault | Confirmation alert shown; vault deleted after confirm | ☐ |
| 17.13 | Attempt to create a 6th vault (create 5 total first) | Error shown: "Maximum of 5 vaults reached" | ☐ |

---

## AND-18 · Help & FAQ Screen — Android Content

**Priority:** HIGH  
**Precondition:** Onboarding complete.  
**Android-specific:** Several FAQ answers are different on Android. The "What if I lose my phone?" and "Is my data backed up?" answers must reflect the Android experience (no iCloud).

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 18.1 | Open Settings → "Help & FAQ" | Help screen opens in a modal | ☐ |
| 18.2 | Verify 5 FAQ sections visible | Security & Privacy, Recovery & Backup, Documents & Vault, Account & Subscription, The .afterme Format | ☐ |
| 18.3 | Tap a question | Answer expands inline (accordion); chevron rotates | ☐ |
| 18.4 | Open "What if I lose my phone?" in Recovery & Backup | Answer describes **Personal Recovery Kit and Family Kit** as the recovery paths — no mention of iCloud as a recovery method | ☐ |
| 18.5 | Verify the answer does **not** say "iCloud Keychain" or "iCloud Documents" | Those are iOS-only recovery methods and must not appear in the Android answer | ☐ |
| 18.6 | Open "Is my data backed up to any cloud?" | Answer states: "No automatic cloud backup exists on Android. Your vault lives on your device. Use a Personal Recovery Kit or Family Kit to protect against device loss." | ☐ |
| 18.7 | Verify the answer does **not** say "Enable iCloud backup in Settings" | That option does not exist on Android | ☐ |
| 18.8 | Open "Is there a storage limit?" in Documents & Vault | Answer reads "The free tier allows up to **5 documents**…" | ☐ |
| 18.9 | Open "What do I get with Premium?" | Answer mentions 5-document free tier limit, £34.99/year annual, £79.99 lifetime | ☐ |
| 18.10 | Open "How do I restore my purchase?" | Answer references **Google Play account** (not Apple ID) | ☐ |
| 18.11 | Scroll to bottom | "Contact Support" button and privacy/terms links visible | ☐ |
| 18.12 | Tap "Contact Support" | Email app opens with `support@myafterme.co.uk` pre-filled | ☐ |
| 18.13 | Tap "Privacy Policy" | Browser opens `https://myafterme.co.uk/privacy` | ☐ |
| 18.14 | Tap "Terms of Service" | Browser opens `https://myafterme.co.uk/terms` | ☐ |

---

## AND-19 · Restore My Vault (Device Loss Recovery)

**Priority:** CRITICAL  
**Precondition:** A Personal Recovery Kit `.afterme` file and its QR code are available (from AND-14). Fresh install.  
**Android-specific:** Recovery on Android uses the QR card + .afterme file only. There is no iCloud restore path.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 19.1 | Fresh install; launch app | Welcome screen shows 3 buttons | ☐ |
| 19.2 | Verify "Restore My Vault" button is visible | Third button below "I Have a Legacy Kit" | ☐ |
| 19.3 | Tap "Restore My Vault" | Survivor/Import flow opens | ☐ |
| 19.4 | Scan the Personal Recovery Kit QR code | Access key scanned | ☐ |
| 19.5 | Select the `.afterme` Recovery Kit file via file picker | Decryption begins | ☐ |
| 19.6 | Wait for restore to complete | Success; all documents restored | ☐ |
| 19.7 | Verify documents in library | All original documents present | ☐ |

---

## AND-20 · Accessibility — TalkBack & Font Scaling

**Priority:** HIGH  
**Precondition:** Enable TalkBack (Settings → Accessibility → TalkBack) for steps 20.1–20.7. Enable large font for 20.8–20.12.

### TalkBack

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 20.1 | Enable TalkBack; open app | TalkBack reads the Welcome screen title and button labels | ☐ |
| 20.2 | Navigate through the How It Works onboarding screen | Path cards are read correctly; "I understand — continue" button announced | ☐ |
| 20.3 | Navigate to Document Library | Each document card announces title and category | ☐ |
| 20.4 | Navigate to category filter badges | Badges are announced with correct accessibility labels | ☐ |
| 20.5 | Navigate to Settings toggles | Biometric toggle announces "on/off" state | ☐ |
| 20.6 | Open Help screen | FAQ questions are announced with "button, collapsed/expanded" state | ☐ |
| 20.7 | Disable TalkBack | — | ☐ |

### Font Scaling

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 20.8 | Set font size to largest available (Settings → Display → Font size) | — | ☐ |
| 20.9 | Open app — check onboarding screens including How It Works | Text scales up; no truncation or overflow on any card | ☐ |
| 20.10 | Open Document Library | Text in cards scales; layout remains usable | ☐ |
| 20.11 | Open Help screen | FAQ answers scale; accordion still works | ☐ |
| 20.12 | Open Settings → Support section | All links readable at large text | ☐ |
| 20.13 | Reset font size to default | — | ☐ |

---

## AND-21 · Reset & Re-Onboarding

**Priority:** HIGH  
**Precondition:** App is fully set up with at least 3 documents.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 21.1 | Open Settings → scroll to bottom | "Reset Vault" or "Reset App" button visible | ☐ |
| 21.2 | Tap Reset | A confirmation dialog appears warning about data loss | ☐ |
| 21.3 | Cancel | App is unchanged | ☐ |
| 21.4 | Tap Reset again and confirm | All data cleared; app returns to Welcome screen | ☐ |
| 21.5 | Verify vault is empty | All documents gone; Welcome screen fresh | ☐ |
| 21.6 | Complete full onboarding again | Onboarding flows correctly from scratch; Safety Net screen shows 1 card (Family Kit) | ☐ |
| 21.7 | Verify no residual data | No old documents appear | ☐ |

---

## AND-22 · Onboarding — How It Works Screen

**Priority:** HIGH  
**Precondition:** Fresh install or reset. Reach the explainer screen by advancing through Screens 1–4 of onboarding.  
**Android-specific:** Path 2 (iCloud) on this screen is not applicable to Android. Verify the screen is still readable and the content makes sense for an Android user.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 22.1 | Advance through Screens 1–4 of onboarding | After Screen 4 (QR reveal), a new screen appears before the Legal Disclaimer | ☐ |
| 22.2 | Verify screen eyebrow text | Reads "Before you set up" in amber uppercase | ☐ |
| 22.3 | Verify headline | Reads "How your family will access this" | ☐ |
| 22.4 | Verify subhead copy | Explains the concept of no phone / no password needed | ☐ |
| 22.5 | Verify Path 1 card — Family Kit | Card present; "Recommended" badge in amber; explains QR card + .afterme file | ☐ |
| 22.6 | Verify Path 3 card — No preparation | Card present; explains permanent inaccessibility | ☐ |
| 22.7 | Verify amber note at bottom | Text about setting up Family Kit after onboarding | ☐ |
| 22.8 | Tap "I understand — continue" | App proceeds to Legal Disclaimer screen | ☐ |
| 22.9 | Verify progress dot count | 8 dots total; dot 5 is active on this screen | ☐ |
| 22.10 | Verify animations load without crash | Cards stagger in; CTA fades in last; no ANR | ☐ |

---

## AND-23 · Safety Net — Family Kit Path

**Priority:** CRITICAL  
**Precondition:** Reached the Safety Net screen (Screen 8) of onboarding. **Premium account required to actually create a kit** — if not premium, verify paywall gate (see AND-27).  
**Note:** If vault is empty when onboarding completes, the wizard will NOT auto-launch. See AND-32 for empty vault guard testing.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 23.1 | On Safety Net screen, tap "Create a Family Kit" (amber border card) | App completes onboarding and navigates to the main vault dashboard | ☐ |
| 23.2 | Verify the app opens to the dashboard | Onboarding marked complete; vault accessible | ☐ |
| 23.3 | If premium AND vault has at least 1 document: Family Kit Wizard launches immediately | Kit creation wizard opens without a paywall | ☐ |
| 23.3a | If premium BUT vault is empty: Wizard does NOT launch | Dashboard shown with "No safety net yet" nudge card; no wizard or error | ☐ |
| 23.4 | If not premium: Paywall appears | Paywall shown before wizard; after purchase, wizard launches (see AND-27) | ☐ |
| 23.5 | Verify Dashboard shows "No safety net yet" nudge card until kit is created | Dashboard card persists until a Family Kit has been successfully generated | ☐ |

---

## AND-24 · Safety Net — Defer Path

**Priority:** HIGH  
**Precondition:** Reached the Safety Net screen (Screen 8) of onboarding.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 24.1 | On Safety Net screen, tap "Living dangerously — remind me later" | A confirmation alert appears: "Are you sure? Without a safety net…" | ☐ |
| 24.2 | Tap "Go Back" on the alert | Alert dismisses; Safety Net screen is still showing | ☐ |
| 24.3 | Tap defer again, then tap "Continue without safety net" | App completes onboarding and enters the vault | ☐ |
| 24.4 | Check Dashboard | A warning banner/card is visible prompting to set up a safety net | ☐ |
| 24.5 | Verify no Family Kit exists | Family Kit tab shows no kits created | ☐ |

---

## AND-25 · Settings → Support Content

**Priority:** HIGH  
**Precondition:** Onboarding complete.  
**Note:** The Support section must contain only app support links. No bereavement resources. On Android, the TestFlight invite button must **not** appear.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 25.1 | Open Settings → scroll to Support section | Support section is visible | ☐ |
| 25.2 | Verify the Support section heading | Reads "Support" | ☐ |
| 25.3 | Count the items in the Support section | Exactly 4 items | ☐ |
| 25.4 | Verify item 1: Contact Support | Label "Contact Support" with hint "support@myafterme.co.uk" | ☐ |
| 25.5 | Tap Contact Support | Email app opens with `support@myafterme.co.uk` pre-filled | ☐ |
| 25.6 | Verify item 2: Support Centre | Label "Support Centre" with hint "FAQs, guides and help articles" | ☐ |
| 25.7 | Tap Support Centre | Browser opens `https://myafterme.co.uk/support` | ☐ |
| 25.8 | Verify item 3: Privacy Policy | Label "Privacy Policy" | ☐ |
| 25.9 | Tap Privacy Policy | Browser opens `https://myafterme.co.uk/privacy` | ☐ |
| 25.10 | Verify item 4: Terms of Service | Label "Terms of Service" | ☐ |
| 25.11 | Tap Terms of Service | Browser opens `https://myafterme.co.uk/terms` | ☐ |
| 25.12 | **Verify no TestFlight invite button** | "Invite Beta Testers" / "Share your TestFlight invite link" must **not** appear anywhere in Settings | ☐ |
| 25.13 | **Verify no bereavement links** | "Beyond Blue", "Lifeline Australia", "Grief Support Services" must **not** appear | ☐ |

---

## AND-26 · Website — How It Works Page

**Priority:** MEDIUM  
**Precondition:** Device with a browser. Internet connection. Navigate to `myafterme.co.uk`.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 26.1 | Open `https://myafterme.co.uk/how-it-works` in a browser | Page loads without errors | ☐ |
| 26.2 | Verify hero headline | "How your loved ones will access your vault" | ☐ |
| 26.3 | Verify 4 access path cards | Path 1 (Family Kit — amber, "Recommended"), Path 2 (Personal Recovery Kit), Path 3 (iCloud — labelled "Not recommended for family access"), Path 4 (No preparation) | ☐ |
| 26.4 | Verify step-by-step walkthrough | "What you do today" and "What your family does when they need it" sections present | ☐ |
| 26.5 | Check page on mobile viewport | Page is fully responsive; no horizontal overflow on Android browser | ☐ |
| 26.6 | Verify footer links | Privacy Policy, Terms, Support, How It Works all present | ☐ |

---

## AND-27 · Premium Gate — Family Kit from Onboarding

**Priority:** CRITICAL  
**Precondition:** Onboarding just completed via the Family Kit path. User is NOT yet premium.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 27.1 | Complete onboarding via "Create a Family Kit" on Safety Net screen, without premium | App transitions to vault | ☐ |
| 27.2 | Verify the experience | A paywall appears before the Family Kit wizard, OR app gracefully routes to Family Kit tab with an upgrade prompt | ☐ |
| 27.3 | Verify no crash or dead end | The non-premium user is never left on a broken or empty screen | ☐ |
| 27.4 | Dismiss paywall | Returns to Dashboard or Family Kit tab cleanly | ☐ |
| 27.5 | Purchase Premium (see AND-11) | Premium is activated via Google Play Billing | ☐ |
| 27.6 | Navigate to Family Kit tab and tap Create | Family Kit wizard opens without paywall | ☐ |
| 27.7 | Complete the Family Kit wizard | Kit created successfully; QR code shown | ☐ |

---

## AND-28 · Paywall UX — Lifetime Hero, Break-Even & Death-Risk

**Priority:** CRITICAL  
**Precondition:** Free tier user. Open paywall from any trigger.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 28.1 | Open paywall from any trigger | Paywall loads; Lifetime card appears **first and largest** | ☐ |
| 28.2 | Verify death-risk callout | Amber callout card visible: *"With an annual plan, your family may need to manage a renewal after you're gone. With lifetime, they never will."* | ☐ |
| 28.3 | Verify Lifetime card content | "BEST VALUE · RECOMMENDED" badge; large price (£79.99); "Pay once. Then never again." tagline; 7 feature bullets | ☐ |
| 28.4 | Verify break-even maths strip | Between the two cards: "Annual × 3 years = £104.97 · Lifetime = £79.99 · Break even in under 2.5 years" | ☐ |
| 28.5 | Verify Annual card is below maths strip | Annual card shows £34.99/year; 5 feature bullets | ☐ |
| 28.6 | Verify Lifetime is pre-selected by default | Lifetime radio is filled; amber border on lifetime card | ☐ |
| 28.7 | Verify CTA button with Lifetime selected | Button reads "Get Lifetime — £79.99" | ☐ |
| 28.8 | Tap Annual card to select it | Annual card highlights; CTA changes to "Start Annual — £34.99/yr" | ☐ |
| 28.9 | Verify legal text with Annual selected | Text reads: "Subscription renews automatically. Cancel in **Google Play** Settings any time." — **not** "App Store" | ☐ |
| 28.10 | Verify legal text with Lifetime selected | Text reads: "One-time payment. No subscription. No renewal. Ever." | ☐ |
| 28.11 | Verify "Restore Purchases" button present | Visible below CTA | ☐ |
| 28.12 | Verify no crash when products fail to load | If Google Play unavailable (emulator without Play Services), a graceful "Products temporarily unavailable" message appears | ☐ |

---

## AND-29 · Annual Plan Purchase via Google Play Billing

**Priority:** CRITICAL  
**Precondition:** Licence tester Google account on device. Subscription product `com.afterme.app.premium.annual` active in Google Play Console.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 29.1 | Open paywall; tap Annual card | Annual card selected; CTA reads "Start Annual — £34.99/yr" | ☐ |
| 29.2 | Tap CTA | **Google Play Billing** subscription sheet appears | ☐ |
| 29.3 | Confirm subscription with licence tester account | Subscription activates; paywall dismisses | ☐ |
| 29.4 | Verify premium status in Settings | Settings → Subscription shows "Annual subscription active" | ☐ |
| 29.5 | Verify upgrade card is visible | Amber "Switch to Lifetime" upgrade card appears below the subscription status | ☐ |
| 29.6 | Verify upgrade card content | Badge: "UPGRADE AVAILABLE"; Title: "Switch to Lifetime"; "See offer →" link | ☐ |
| 29.7 | Verify no "Upgrade to Premium" button shown | Main amber button is hidden (user is already premium) | ☐ |
| 29.8 | Verify document limit removed | Can add a 6th document without paywall | ☐ |
| 29.9 | Verify Family Kit unlocked | Family Kit wizard opens without paywall | ☐ |

---

## AND-30 · Settings — Annual Subscriber Upgrade Card

**Priority:** HIGH  
**Precondition:** Annual plan purchased (from AND-29). User is in Settings.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 30.1 | Open Settings → scroll to Subscription section | Amber upgrade card visible below "Annual subscription active" text | ☐ |
| 30.2 | Verify upgrade card copy | "UPGRADE AVAILABLE" badge · "Switch to Lifetime" title · "Pay once. Then never again — including for your family after you're gone." · "See offer →" | ☐ |
| 30.3 | Tap the upgrade card | Paywall opens in upgrade mode | ☐ |
| 30.4 | Verify upgrade paywall layout | Single card showing lifetime only — no annual option | ☐ |
| 30.5 | Verify upgrade paywall headline | "Switch to lifetime. Pay once. Never again." | ☐ |
| 30.6 | Verify upgrade paywall price | Shows upgrade price (£54.99 or configured price) | ☐ |
| 30.7 | Tap upgrade CTA | Google Play Billing sheet appears for lifetime product | ☐ |
| 30.8 | Complete purchase | Purchase completes; paywall dismisses | ☐ |
| 30.9 | Verify upgrade card is now gone | Settings Subscription section shows "Lifetime access — no renewals, ever" · No upgrade card | ☐ |

---

## AND-31 · Website — Pricing Section

**Priority:** HIGH  
**Precondition:** Browser with internet access. Navigate to `https://myafterme.co.uk`.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 31.1 | Navigate to `myafterme.co.uk` and scroll to Pricing section | Pricing section loads | ☐ |
| 31.2 | Verify Lifetime card is shown first with featured styling | Lifetime card has amber border, "RECOMMENDED" badge | ☐ |
| 31.3 | Verify Lifetime price | "£79.99" displayed prominently | ☐ |
| 31.4 | Verify break-even note | "Annual × 3 years = £104.97 · break even in under 2.5 years" | ☐ |
| 31.5 | Verify "No renewal risk at death" bullet | Present in Lifetime feature list | ☐ |
| 31.6 | Verify Annual card is secondary | £34.99/year; no featured styling | ☐ |
| 31.7 | Verify no Family plan shown | Only two products: Lifetime and Annual | ☐ |
| 31.8 | Verify free tier note | "Up to 5 documents, read-only after 7-day full trial" | ☐ |

---

## AND-32 · Family Kit — Empty Vault Guard

**Priority:** CRITICAL  
**Precondition:** Premium account. Vault must have **zero documents**.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 32.1 | Complete fresh install + onboarding. Choose "Create a Family Kit" on Safety Net screen. Ensure vault is empty. | App completes onboarding and shows the vault dashboard | ☐ |
| 32.2 | Verify the Family Kit wizard does NOT auto-open | Dashboard is shown. No wizard, no error screen. "No safety net yet" nudge card visible. | ☐ |
| 32.3 | Tap the "No safety net yet" nudge card (vault still empty) | Alert shown: "Add documents first — your Family Kit is an encrypted snapshot of your vault." | ☐ |
| 32.4 | Dismiss the alert. Add at least 1 document. | Document added successfully | ☐ |
| 32.5 | Tap the nudge card again (vault now has 1 document) | Family Kit wizard opens at Step 1: Introduction | ☐ |
| 32.6 | Tap "Family Kit" tab → "Create Family Kit" with empty vault (reset if needed) | Alert shown: "Add documents first..." | ☐ |
| 32.7 | Verify alert message is clear and actionable | Alert explains: "Your Family Kit is an encrypted snapshot of your vault. Add at least one document before generating your kit." | ☐ |
| 32.8 | Dismiss alert | Wizard is closed; user is back on the previous screen | ☐ |
| 32.9 | Verify Safety Net card copy on onboarding Screen 8 | Card secondary text reads: "The only way your loved ones can access this vault. Add documents first, then generate your kit." | ☐ |

---

## AND-33 · Android Back Gesture Behaviour

**Priority:** HIGH  
**Precondition:** Onboarding complete. App running normally.  
**Android-specific:** This test has no iOS equivalent. Android users navigate with the system back gesture (swipe from left edge on gesture navigation, or the system back button on 3-button navigation). Verify the back gesture behaves correctly throughout the app and does not cause unintended exits or crashes.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 33.1 | From the Dashboard (Vault tab), press system back | App moves to background (does not close tabs or navigate incorrectly) | ☐ |
| 33.2 | Open a document viewer; press system back | Document viewer closes; returns to Document Library | ☐ |
| 33.3 | Open Add Document modal; press system back | Modal closes without saving; returns to Document Library | ☐ |
| 33.4 | Open Family Kit wizard (on Step 3 of 6); press system back | Wizard handles back gracefully — either prompts to confirm cancel, or navigates to previous step | ☐ |
| 33.5 | During onboarding (Screen 3 of 8); press system back | Returns to Screen 2 of onboarding; does not exit the app or go to Welcome | ☐ |
| 33.6 | On Legal Disclaimer screen; press system back | Returns to How It Works screen | ☐ |
| 33.7 | Open Paywall modal; press system back | Paywall dismisses; returns to previous screen | ☐ |
| 33.8 | Open Help & FAQ modal; press system back | Help modal closes; returns to Settings | ☐ |
| 33.9 | Open Settings → Manage Vaults modal; press system back | Modal closes; returns to Settings | ☐ |
| 33.10 | Press system back rapidly several times during navigation | No crash, no blank screen, no ANR | ☐ |

---

## AND-34 · iCloud UI Absent on Android

**Priority:** CRITICAL  
**Precondition:** Onboarding complete.  
**Android-specific:** This test verifies that all iCloud-related UI is completely absent on Android. These elements are iOS-only and must never appear for Android users.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 34.1 | Open Settings; scroll through the entire Settings screen | **No** "iCloud Backup" section, toggle, "Back Up Now" button, or "Restore from Backup" button is visible at all | ☐ |
| 34.2 | Open Settings → Safety Net / Subscription section | No iCloud-related options visible | ☐ |
| 34.3 | Go through onboarding to the Safety Net screen (Screen 8) | Safety Net screen shows **exactly 1 card** — "Create a Family Kit". No "Enable iCloud Backup" card. | ☐ |
| 34.4 | On Safety Net screen, verify subhead is absent | "Two very different things." subhead does **not** appear | ☐ |
| 34.5 | On Safety Net screen, verify body copy is correct | Body text does not mention iCloud | ☐ |
| 34.6 | Open Help & FAQ → Recovery & Backup section | No FAQ answers suggest enabling iCloud as an option for Android users | ☐ |
| 34.7 | Open Paywall | No reference to iCloud as a feature in any feature bullet | ☐ |
| 34.8 | Check onboarding How It Works screen (AND-22) | If a Path 2 (iCloud) card is shown, verify it is either absent or clearly labelled as non-applicable on this device | ☐ |

---

## AND-35 · Google Play Billing — Restore & Cancel Wording

**Priority:** HIGH  
**Precondition:** Onboarding complete. Open the paywall or Settings → Subscription.  
**Android-specific:** All user-facing text that refers to "Apple ID" or "App Store Settings" must say "Google account" or "Google Play Settings" on Android.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 35.1 | Open paywall; select the Annual plan | Annual card selected | ☐ |
| 35.2 | Read the legal text below the CTA button | Text reads: "Subscription renews automatically. Cancel in **Google Play** Settings any time." — NOT "App Store Settings" | ☐ |
| 35.3 | Select the Lifetime plan and read legal text | Text reads: "One-time payment. No subscription. No renewal. Ever." | ☐ |
| 35.4 | Open Settings → Subscription → "Restore Purchases" with an account that has no purchases | Alert appears: "We couldn't find any previous purchases for this **Google account**." — NOT "Apple ID" | ☐ |
| 35.5 | Tap "Restore Purchases" after a successful purchase | "Your premium access has been restored." — no platform-specific branding in this message | ☐ |

---

## AND-36 · Android Keystore Label & Key Storage

**Priority:** MEDIUM  
**Precondition:** Onboarding complete.  
**Android-specific:** The Settings screen shows a label identifying where the vault key is stored. On Android this must say "Android Keystore", not "Secure Enclave".

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 36.1 | Open Settings → scroll to the Security section | A "Key Storage" or equivalent row is visible | ☐ |
| 36.2 | Read the key storage label | Label reads "**Android Keystore**" — NOT "Secure Enclave" | ☐ |
| 36.3 | Verify no other iOS-specific security labels appear | No mention of "Secure Enclave", "iCloud Keychain", or "Apple" in the Security section | ☐ |

---

## AND-37 · Android-Specific Permission Prompts

**Priority:** HIGH  
**Precondition:** Fresh install on Android (or app with permissions revoked in Android Settings).  
**Android-specific:** Android requires explicit runtime permission prompts for Camera and Photos. The prompts are Android system dialogs, not iOS-style.

| Step | Action | Expected Result | Result |
|------|--------|-----------------|--------|
| 37.1 | Fresh install. Go to Documents tab → "+" → "Scan with Camera" | Android **Camera** permission dialog appears ("Allow After Me to take pictures and record video?") | ☐ |
| 37.2 | Tap "Allow" | Camera opens; scanning can proceed | ☐ |
| 37.3 | Revoke camera permission in Android Settings; return to app; try to scan again | Permission dialog appears again OR a rationale message explains why camera is needed | ☐ |
| 37.4 | Tap "Don't allow" on camera permission | App handles gracefully — shows an error message; does not crash | ☐ |
| 37.5 | Try importing via "Pick from Photos" | Android **Photos / Media** permission dialog appears (or scoped storage access on Android 13+) | ☐ |
| 37.6 | Grant photos permission | Photo picker opens correctly | ☐ |
| 37.7 | On the biometric setup screen during onboarding, verify biometric prompt | Android system biometric prompt appears (fingerprint sensor / face); **not** an iOS Face ID sheet | ☐ |
| 37.8 | Verify the app does not request any permissions it does not need | No unexpected permission prompts (e.g. Contacts, Location, Microphone during normal use) appear | ☐ |

---

## Pass/Fail Summary Sheet

**Tester Name:** ___________________________  
**Device Model:** ___________________________  
**Android Version:** ___________________________  
**App Version:** ___________________________  
**Test Date:** ___________________________  
**Build Type:** Debug / Release AAB  
**Google Play Licence Tester Account:** ___________________________

---

| Suite | Test ID | Test Name | Result | Notes |
|-------|---------|-----------|--------|-------|
| Onboarding | AND-01 | First Launch & Onboarding (8 screens) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Auth | AND-02 | Biometric Authentication (Fingerprint) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Legal | AND-03 | Legal Disclaimer & Privacy | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Safety Net | AND-04 | Safety Net — Android Layout (1 card) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Dashboard | AND-05 | Vault Dashboard | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Scanning | AND-06 | Document Scanning | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Import | AND-07 | Document Import (Files & Photos) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Library | AND-08 | Search, Sort & Filter | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Viewer | AND-09 | Document Viewer & Editing | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Free Tier | AND-10 | Free Tier & Paywall | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Purchases | AND-11 | In-App Purchase — Lifetime (Google Play) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Family Kit | AND-12 | Family Kit Creation | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Survivor | AND-13 | Survivor Import | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Recovery Kit | AND-14 | Personal Recovery Kit | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Security | AND-15 | Biometric Lock & Security (no iCloud section) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Integrity | AND-16 | Vault Integrity Check | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Multi-Vault | AND-17 | Multi-Vault Management | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Help | AND-18 | Help & FAQ — Android Content | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Device Loss | AND-19 | Restore My Vault (QR + .afterme file) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Accessibility | AND-20 | TalkBack & Font Scaling | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Reset | AND-21 | Reset & Re-Onboarding | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| How It Works | AND-22 | Onboarding — How It Works Screen | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Safety Net — Kit | AND-23 | Safety Net: Family Kit Path | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Safety Net — Defer | AND-24 | Safety Net: Defer Path | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Support Content | AND-25 | Settings → Support (no TestFlight link) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Website | AND-26 | Website — How It Works Page | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Premium Gate | AND-27 | Premium Gate — Family Kit from Onboarding | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Paywall UX | AND-28 | Paywall Layout — Lifetime Hero, Break-Even | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Annual Purchase | AND-29 | Annual Plan — Google Play Billing | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Upgrade Card | AND-30 | Settings → Upgrade Card | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Website Pricing | AND-31 | Website Pricing Section | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Family Kit Guard | AND-32 | Family Kit — Empty Vault Guard | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Back Gesture | AND-33 | Android Back Gesture Behaviour | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| iCloud Absent | AND-34 | iCloud UI Fully Absent on Android | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Play Billing Text | AND-35 | Google Play Wording in Alerts & Legal Text | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Keystore Label | AND-36 | Android Keystore Label in Settings | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Permissions | AND-37 | Android Permission Prompts | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |

---

### Overall Result

| Metric | Count |
|--------|-------|
| Total test suites | 37 |
| PASS | |
| FAIL | |
| BLOCKED | |
| **Go / No-Go** | |

**Signed off by:** ___________________________  
**Date:** ___________________________

---

## Defect Log

| # | Suite | Test ID | Step | Description | Severity | Status |
|---|-------|---------|------|-------------|----------|--------|
| 1 | | | | | Critical / High / Medium / Low | Open / Fixed |

---

*After Me Android UAT v1.0 — Covers all core phases with Android-specific adaptations: Google Play Billing (not StoreKit), Android Keystore (not Secure Enclave), TalkBack (not VoiceOver), system back gesture, iCloud UI fully absent, Safety Net single-card layout, Google Play wording in all alerts and legal text, Android runtime permission flows.*
