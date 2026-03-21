# After Me — Comprehensive UAT Test Scripts

**Document Version:** 5.0  
**Last Updated:** March 2026  
**App Version:** After Me Mobile v1.0  
**Platform:** iOS (physical device)  
**Build:** Release build via `npx expo run:ios --device`

### Changelog from v4.0 (this release — v5.0)
| Change | Affected Tests |
|---|---|
| Family Kit wizard now guards against empty vault — dismisses immediately with a clear Alert if no documents exist | UAT-12 (updated), UAT-24 (updated), UAT-34 (new) |
| Onboarding Safety Net card (Family Kit) — secondary text updated to set expectation: "Add documents first, then generate your kit" | UAT-04 (updated) |
| Dashboard no longer auto-opens kit wizard on first load if vault is empty; wizard only auto-launches when `totalDocuments > 0` | UAT-24 (updated) |

### Changelog from v3.0 (v4.0 changes)
| Change | Affected Tests |
|---|---|
| Free tier limit reduced from 10 → **5 documents** | UAT-10 (updated) |
| Paywall completely rebuilt — lifetime-first hero, break-even maths strip, death-risk callout, annual as secondary | UAT-11 (updated), UAT-30 (new) |
| Annual plan price set to **£34.99/year** | UAT-11, UAT-30 |
| Lifetime plan price confirmed **£79.99** | UAT-11, UAT-30 |
| Upgrade path added — annual subscribers see amber upgrade card in Settings → Subscription | UAT-32 (new) |
| Annual plan purchase flow verified in paywall | UAT-31 (new) |
| HelpScreen updated — pricing FAQs corrected to 5-doc limit, new Q&A for annual vs lifetime | UAT-19 (updated) |
| `web/support.html` — all "10 document" references updated to 5; pricing figures added | UAT-28 (already covered) |
| `web/index.html` pricing section — Family plan removed; Lifetime hero + Annual secondary | UAT-33 (new) |

### Changelog from v2.0 (v3.0 changes)
| Change | Affected Tests |
|---|---|
| New onboarding screen — "How Your Family Will Access This" (inserted after Screen 4) | UAT-01, UAT-23 (new) |
| Safety Net screen redesigned — Family Kit is now primary; iCloud is personal-recovery only | UAT-04 (rewritten), UAT-24 (new) |
| Survivor flow — bereavement support step removed; vault intro goes directly to "Open the Vault" | UAT-13 |
| Privacy Policy URL corrected to `myafterme.co.uk/privacy` | UAT-03 |
| Settings → Support — bereavement links removed; only app support links remain | UAT-27 (new) |
| Website — `how-it-works` page added | UAT-28 (new) |
| Premium gate on Family Kit from onboarding flow | UAT-29 (new) |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Test Accounts & Prerequisites](#3-test-accounts--prerequisites)
4. [Test Suite Overview](#4-test-suite-overview)
5. [UAT-01 · First Launch & Onboarding](#uat-01--first-launch--onboarding)
6. [UAT-02 · Biometric Authentication](#uat-02--biometric-authentication)
7. [UAT-03 · Legal Disclaimer & Privacy](#uat-03--legal-disclaimer--privacy)
8. [UAT-04 · Safety Net Setup — Redesigned](#uat-04--safety-net-setup--redesigned)
9. [UAT-05 · Vault Dashboard](#uat-05--vault-dashboard)
10. [UAT-06 · Document Scanning](#uat-06--document-scanning)
11. [UAT-07 · Document Import (Files & Photos)](#uat-07--document-import-files--photos)
12. [UAT-08 · Document Library — Search, Sort & Filter](#uat-08--document-library--search-sort--filter)
13. [UAT-09 · Document Viewer & Metadata Editing](#uat-09--document-viewer--metadata-editing)
14. [UAT-10 · Free Tier Limit & Paywall](#uat-10--free-tier-limit--paywall)
15. [UAT-11 · In-App Purchase — Premium Upgrade](#uat-11--in-app-purchase--premium-upgrade)
16. [UAT-12 · Family Kit Creation](#uat-12--family-kit-creation)
17. [UAT-13 · Family Kit — Survivor Import](#uat-13--family-kit--survivor-import)
18. [UAT-14 · Personal Recovery Kit](#uat-14--personal-recovery-kit)
19. [UAT-15 · iCloud Backup & Restore](#uat-15--icloud-backup--restore)
20. [UAT-16 · Settings — Biometric Lock & Security](#uat-16--settings--biometric-lock--security)
21. [UAT-17 · Vault Integrity Check](#uat-17--vault-integrity-check)
22. [UAT-18 · Multi-Vault Management](#uat-18--multi-vault-management)
23. [UAT-19 · Help & FAQ Screen](#uat-19--help--faq-screen)
24. [UAT-20 · Restore My Vault (Device Loss Recovery)](#uat-20--restore-my-vault-device-loss-recovery)
25. [UAT-21 · Accessibility](#uat-21--accessibility)
26. [UAT-22 · Reset & Re-Onboarding](#uat-22--reset--re-onboarding)
27. [UAT-23 · Onboarding — How It Works Screen *(new)*](#uat-23--onboarding--how-it-works-screen)
28. [UAT-24 · Safety Net — Family Kit Path *(new)*](#uat-24--safety-net--family-kit-path)
29. [UAT-25 · Safety Net — iCloud Path *(new)*](#uat-25--safety-net--icloud-path)
30. [UAT-26 · Safety Net — Defer Path *(new)*](#uat-26--safety-net--defer-path)
31. [UAT-27 · Settings → Support Content *(new)*](#uat-27--settings--support-content)
32. [UAT-28 · Website — How It Works Page *(new)*](#uat-28--website--how-it-works-page)
33. [UAT-29 · Premium Gate — Family Kit from Onboarding *(new)*](#uat-29--premium-gate--family-kit-from-onboarding)
34. [UAT-30 · Paywall UX — Lifetime Hero, Break-Even & Death-Risk *(new)*](#uat-30--paywall-ux--lifetime-hero-break-even--death-risk)
35. [UAT-31 · Annual Plan Purchase via Paywall *(new)*](#uat-31--annual-plan-purchase-via-paywall)
36. [UAT-32 · Settings — Annual Subscriber Upgrade Card *(new)*](#uat-32--settings--annual-subscriber-upgrade-card)
37. [UAT-33 · Website — Pricing Section *(new)*](#uat-33--website--pricing-section)
38. [UAT-34 · Family Kit — Empty Vault Guard *(new)*](#uat-34--family-kit--empty-vault-guard)
38. [Pass/Fail Summary Sheet](#passfail-summary-sheet)

---

## 1. Introduction

This document provides step-by-step manual UAT test scripts for the After Me mobile application covering all implemented phases and subsequent changes:

- **Phase 1:** Encryption, key management, biometric authentication
- **Phase 2:** Document ingestion, scanning, import
- **Phase 3:** UI/UX, categories, document library
- **Phase 4:** Family Kit creation and survivor import
- **Phase 5:** Onboarding, iCloud backup, in-app purchases
- **Phase 6:** Personal Recovery Kit, multi-vault, Help screen
- **Post-launch changes:** Safety Net redesign, onboarding explainer screen, survivor flow clean-up, support content corrections, website how-it-works page

Each test case includes: preconditions, numbered steps, and explicit expected results. Record **PASS**, **FAIL**, or **BLOCKED** with notes.

---

## 2. Test Environment Setup

| Item | Requirement |
|---|---|
| Device | Physical iPhone (Face ID or Touch ID configured) |
| iOS Version | iOS 17+ (iOS 18+ recommended) |
| iCloud | Signed in with Apple ID; iCloud Drive enabled |
| App Store | Signed in (for IAP sandbox testing) |
| Network | Active internet connection for iCloud and StoreKit |
| Build type | Release build installed on device |
| Camera | Camera access granted to After Me |
| Photos | Photo library access granted to After Me |
| Second device | Required for UAT-13 (Survivor Import) — OR use same device after full reset |
| Printed QR card | Required for UAT-13, UAT-20 — print from UAT-12 / UAT-14 |
| .afterme file | Required for UAT-13, UAT-20 — save to Files app during UAT-12 / UAT-14 |

### Install the test build

```
# From project root, with iPhone connected:
cd after-me-mobile
npx expo run:ios --device "Your iPhone Name" --configuration Release
```

---

## 3. Test Accounts & Prerequisites

| Item | Details |
|---|---|
| IAP Sandbox Account | Create at [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Users → Sandbox Testers |
| Sandbox email | e.g. `uat-tester@mailinator.com` |
| IAP Products required | `com.afterme.app.premium.lifetime` and `com.afterme.app.premium.annual` must exist in App Store Connect |
| iCloud container | `iCloud.com.afterme.app` must be provisioned in Apple Developer Portal |
| Test documents | Have 2–3 real documents ready to photograph (passport photo page, any ID, any utility bill) |

---

## 4. Test Suite Overview

| Suite | Test ID | Description | Priority |
|---|---|---|---|
| Onboarding | UAT-01 | First launch, full onboarding flow (8 screens) | CRITICAL |
| Auth | UAT-02 | Face ID / Touch ID lock and unlock | CRITICAL |
| Legal | UAT-03 | Legal disclaimer, correct privacy URL | HIGH |
| Safety Net | UAT-04 | Safety Net screen — card layout and messaging | CRITICAL |
| Dashboard | UAT-05 | Vault dashboard, progress rings, categories | HIGH |
| Scanning | UAT-06 | Camera document scanning | CRITICAL |
| Import | UAT-07 | Import from Files and Photos | HIGH |
| Library | UAT-08 | Search, sort, filter, long-press | HIGH |
| Viewer | UAT-09 | View, edit metadata, delete | HIGH |
| Free Tier | UAT-10 | **5-document** free tier enforcement | CRITICAL |
| Purchases | UAT-11 | Premium upgrade — lifetime & annual, new paywall UX | CRITICAL |
| Family Kit | UAT-12 | Create Family Kit, QR card, PDF | CRITICAL |
| Survivor | UAT-13 | Open a Family Kit as a survivor (updated flow) | CRITICAL |
| Recovery Kit | UAT-14 | Personal Recovery Kit creation | HIGH |
| iCloud | UAT-15 | iCloud backup and full restore | CRITICAL |
| Security | UAT-16 | Biometric toggle, session lock | HIGH |
| Integrity | UAT-17 | Vault integrity scan | MEDIUM |
| Multi-Vault | UAT-18 | Create and switch vaults | MEDIUM |
| Help | UAT-19 | Help & FAQ screen | LOW |
| Device Loss | UAT-20 | Restore My Vault from Welcome screen | CRITICAL |
| Accessibility | UAT-21 | VoiceOver, Dynamic Type | HIGH |
| Reset | UAT-22 | Full reset and re-onboarding | HIGH |
| How It Works | UAT-23 | New onboarding explainer screen | HIGH |
| Safety Net — Kit | UAT-24 | Safety Net: Family Kit path (primary) | CRITICAL |
| Safety Net — iCloud | UAT-25 | Safety Net: iCloud path (personal recovery) | HIGH |
| Safety Net — Defer | UAT-26 | Safety Net: defer path | HIGH |
| Support Content | UAT-27 | Settings → Support — correct links only | HIGH |
| Website | UAT-28 | How It Works web page | MEDIUM |
| Premium Gate | UAT-29 | Family Kit premium gate from onboarding flow | CRITICAL |
| Paywall UX | UAT-30 | Paywall Layout — Lifetime Hero, Break-Even, Death-Risk | CRITICAL |
| Annual Purchase | UAT-31 | Annual Plan Purchase via Paywall | CRITICAL |
| Upgrade Card | UAT-32 | Settings → Upgrade Card for Annual Subscribers | HIGH |
| Website Pricing | UAT-33 | Website Pricing Section — Lifetime Hero + Annual | HIGH |
| Family Kit Guard | UAT-34 | Family Kit — Empty Vault Guard *(new v5.0)* | CRITICAL |

---

## UAT-01 · First Launch & Onboarding

**Priority:** CRITICAL  
**Precondition:** Fresh install. App has never been opened on this device.  
**Note (v3.0):** Onboarding now has 8 screens — a new "How Your Family Will Access This" screen is inserted between Screen 4 (QR reveal) and the Legal Disclaimer. Total progress dots = 8.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 01.1 | Launch the app | Welcome screen appears with After Me logo, tagline "Your legacy. Their peace of mind.", and 3 buttons | ☐ |
| 01.2 | Verify button layout | "I'm Planning My Legacy" (amber, primary), "I Have a Legacy Kit" (secondary, border), "Restore My Vault" (subtle, lowest) | ☐ |
| 01.3 | Tap "I'm Planning My Legacy" | First onboarding screen appears — emotional, warm tone | ☐ |
| 01.4 | Read and advance through Screens 1–4 | Each screen loads without crash; back navigation works | ☐ |
| 01.5 | After Screen 4 (QR reveal), note the next screen | **New: "How Your Family Will Access This" explainer screen appears** (not the Legal Disclaimer yet) | ☐ |
| 01.6 | Read explainer screen and tap "I understand — continue" | App proceeds to Legal Disclaimer screen | ☐ |
| 01.7 | Verify Legal Disclaimer screen | Legal disclaimer appears with full text and Privacy Policy link | ☐ |
| 01.8 | Tap "I Accept & Continue" | App proceeds to biometric setup screen | ☐ |
| 01.9 | Tap primary CTA on biometric screen | iOS Face ID / Touch ID system prompt appears | ☐ |
| 01.10 | Authenticate successfully | Success animation plays; screen advances to Screen 8 (Safety Net) | ☐ |
| 01.11 | Complete Safety Net screen (see UAT-24/25/26) | App transitions to the main vault dashboard | ☐ |
| 01.12 | Verify main tabs | Four tabs visible: Vault, Documents, Family Kit, Settings | ☐ |
| 01.13 | Verify progress dot count throughout onboarding | 8 dots shown in total; active dot advances correctly on each screen | ☐ |

---

## UAT-02 · Biometric Authentication

**Priority:** CRITICAL  
**Precondition:** App has completed onboarding. App is in foreground.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 02.1 | Background the app (press Home / swipe up) | App moves to background | ☐ |
| 02.2 | Wait 3 seconds, then reopen app | Biometric lock screen appears (vault is locked) | ☐ |
| 02.3 | Authenticate with Face ID / Touch ID | Vault unlocks; dashboard is shown | ☐ |
| 02.4 | Background again; return immediately | App may or may not require re-auth (session is cached for short period) | ☐ |
| 02.5 | Force-close app from app switcher | — | ☐ |
| 02.6 | Reopen app | Biometric prompt appears again immediately | ☐ |
| 02.7 | Cancel / fail biometric twice | Error animation plays; option to use device passcode shown | ☐ |
| 02.8 | Use device passcode fallback | Vault unlocks successfully | ☐ |

---

## UAT-03 · Legal Disclaimer & Privacy

**Priority:** HIGH  
**Precondition:** Fresh install (or after reset).  
**Note (v3.0):** Privacy Policy URL is now `myafterme.co.uk/privacy` — verify this is the URL that opens, not the old `elufadeju.com` address.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 03.1 | Advance onboarding past the new How It Works screen | Legal Disclaimer screen appears | ☐ |
| 03.2 | Verify disclaimer text is readable | No truncation; scrollable if content is long | ☐ |
| 03.3 | Tap "View our Privacy Policy" link | Safari opens **`https://myafterme.co.uk/privacy`** (verify the URL matches exactly) | ☐ |
| 03.4 | Return to app | Disclaimer screen is still showing | ☐ |
| 03.5 | Tap "I Accept & Continue" | Acceptance saved; app proceeds | ☐ |
| 03.6 | Verify acceptance persists | Complete onboarding. Go to Settings. No re-prompt for disclaimer. | ☐ |

---

## UAT-04 · Safety Net Setup — Redesigned

**Priority:** CRITICAL  
**Precondition:** Reached the Safety Net screen (Screen 8) of onboarding.  
**Note (v3.0):** This screen has been redesigned. Two cards now serve clearly different purposes:
- **Card 1 (amber border, "For your family"):** "Create a Family Kit" — the only way your loved ones can access the vault
- **Card 2 (grey border, "For you only"):** "Enable iCloud Backup" — for personal device recovery; does NOT give family access
- **Defer option:** "Living dangerously — remind me later" (unchanged)

### Verify screen content before testing scenarios

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 04.0 | Reach Safety Net screen | Headline reads "One last step." with subhead "Two very different things." | ☐ |
| 04.0a | Read body copy | Body reads: "A Family Kit gives your loved ones access. iCloud Backup protects you if you lose this device. They are not the same thing." | ☐ |
| 04.0b | Inspect Card 1 | "Create a Family Kit" with amber accent bar and "For your family" badge | ☐ |
| 04.0c | Inspect Card 1 secondary text | Reads: "The only way your loved ones can access this vault. Add documents first, then generate your kit." | ☐ |
| 04.0d | Inspect Card 2 | "Enable iCloud Backup" with grey "For you only" badge | ☐ |
| 04.0e | Inspect Card 2 secondary text | Reads: "If YOU lose this device. Does not give your family access to the vault." | ☐ |

*For full scenario testing of each option, see UAT-24, UAT-25, and UAT-26 below.*

---

## UAT-05 · Vault Dashboard

**Priority:** HIGH  
**Precondition:** Onboarding complete. At least 0 documents in vault.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 05.1 | Open Vault tab | Dashboard shows overall vault completeness ring | ☐ |
| 05.2 | Verify 8 category cards | Identity, Financial, Property, Insurance, Medical, Legal, Digital, Personal | ☐ |
| 05.3 | Verify category progress rings | Each category shows a small circular progress ring with count | ☐ |
| 05.4 | Tap a category card | Navigates to Document Library filtered to that category | ☐ |
| 05.5 | Tap back | Returns to Dashboard | ☐ |
| 05.6 | Add 3 documents (see UAT-06) and return to Dashboard | Progress rings update to reflect added documents | ☐ |
| 05.7 | Verify completeness score increases | Overall ring and percentage updates | ☐ |
| 05.8 | If safety net was deferred, verify warning card | A warning banner prompting to set up a safety net is visible | ☐ |
| 05.9 | If Family Kit was not created, verify staleness card | Dashboard shows a prompt to create or update the Family Kit | ☐ |

---

## UAT-06 · Document Scanning

**Priority:** CRITICAL  
**Precondition:** Onboarding complete. Camera permission granted.

### Single-Page Scan

| Step | Action | Expected Result | Result |
|---|---|---|---|
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
|---|---|---|---|
| 06.10 | Open Add Document → select "Scan with Camera" | Scanner opens | ☐ |
| 06.11 | Scan a document, then add additional pages if supported | Multiple pages captured | ☐ |
| 06.12 | Save the multi-page document | Document saved with a descriptive title | ☐ |

---

## UAT-07 · Document Import (Files & Photos)

**Priority:** HIGH  
**Precondition:** Test PDF and test JPEG available on device.

### Import from Files

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 07.1 | Open Add Document → select a category → tap "Pick from Files" | iOS Files picker opens | ☐ |
| 07.2 | Navigate to a PDF file | File is selectable | ☐ |
| 07.3 | Select the PDF | Returns to app; title pre-populated from filename | ☐ |
| 07.4 | Confirm and save | PDF document appears in the library | ☐ |
| 07.5 | Open the document | PDF renders in the viewer | ☐ |

### Import from Photos

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 07.6 | Open Add Document → select a category → tap "Pick from Photos" | iOS photo picker opens | ☐ |
| 07.7 | Select a photo | Returns to app; title editable | ☐ |
| 07.8 | Enter a title and save | Image document saved with thumbnail | ☐ |

### Unsupported File Type

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 07.9 | Try importing a `.docx` or `.mp4` file | App shows an error: "Unsupported file type" | ☐ |
| 07.10 | Verify app does not crash | App remains stable; no crash | ☐ |

---

## UAT-08 · Document Library — Search, Sort & Filter

**Priority:** HIGH  
**Precondition:** At least 5 documents in vault across 2+ categories.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 08.1 | Open Documents tab | 2-column grid of document thumbnails shown | ☐ |
| 08.2 | Tap the search bar | Keyboard appears; search field is focused | ☐ |
| 08.3 | Type part of a document title | Library filters in real time to matching documents | ☐ |
| 08.4 | Clear search | All documents shown again | ☐ |
| 08.5 | Tap the sort button | Sort mode toggles (Newest → Oldest → Name) | ☐ |
| 08.6 | Sort by Name | Documents reorder alphabetically | ☐ |
| 08.7 | Tap a category filter badge | Library filters to that category only | ☐ |
| 08.8 | Verify filter badge tap target | Badge is large enough to tap easily (≥ 44pt height) | ☐ |
| 08.9 | Tap "All" filter | All documents shown again | ☐ |
| 08.10 | Long-press a document card | Context menu appears with "Rename" and "Delete" options | ☐ |
| 08.11 | Tap "Rename" | A rename dialog/modal appears (NOT an iOS Alert.prompt) | ☐ |
| 08.12 | Enter a new name and confirm | Document renamed; library updates immediately | ☐ |

---

## UAT-09 · Document Viewer & Metadata Editing

**Priority:** HIGH  
**Precondition:** At least 1 document exists in vault.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 09.1 | Tap a document in the library | Document viewer opens | ☐ |
| 09.2 | Verify document renders | Image: photo shown. PDF: PDF viewer renders document. | ☐ |
| 09.3 | Verify metadata shown | Title, category, date added, provider (if set) visible | ☐ |
| 09.4 | Tap "Edit" button | Edit mode activates; text fields become editable | ☐ |
| 09.5 | Change the title | New title entered in text input | ☐ |
| 09.6 | Set a document date | Date field accepts date input | ☐ |
| 09.7 | Set a provider name (e.g. "Home Office") | Text input accepts value | ☐ |
| 09.8 | Set an expiry date (e.g. 5 years from today) | Date input accepted | ☐ |
| 09.9 | Tap "Save" | Success feedback shown; viewer displays updated metadata immediately | ☐ |
| 09.10 | Close and reopen the document | Updated metadata persists correctly | ☐ |
| 09.11 | Tap "Delete Document" button | Confirmation dialog appears | ☐ |
| 09.12 | Cancel delete | Document remains | ☐ |
| 09.13 | Delete via long-press context menu | Document removed from library; thumbnail removed | ☐ |

---

## UAT-10 · Free Tier Limit & Paywall

**Priority:** CRITICAL  
**Precondition:** Not yet upgraded to Premium. Fresh vault (or reset).  
**Note (v4.0):** Free tier limit is now **5 documents** (reduced from 10). All hardcoded references in UI use the `FREE_TIER_DOCUMENT_LIMIT` constant — verify the number shown in-app matches 5.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 10.1 | Add documents until 4 are in the vault | Each document adds normally | ☐ |
| 10.2 | Open Add Document modal with 4 documents stored | Free tier banner shows "1 of 5 free documents remaining" | ☐ |
| 10.3 | Add the 5th document | Document saves; banner now shows "Free limit reached (5 documents). Upgrade to add more." | ☐ |
| 10.4 | Attempt to add a 6th document | Paywall screen appears automatically with `document_limit` trigger | ☐ |
| 10.5 | Verify paywall headline | "You've reached the free limit of 5 documents." | ☐ |
| 10.6 | Dismiss paywall | Returns to document library; no document added; still 5 documents | ☐ |
| 10.7 | Open Settings → Subscription section | Shows "Free" status and "Upgrade to Premium" amber button | ☐ |
| 10.8 | Tap "Upgrade to Premium" in Settings | Paywall appears with `settings` trigger | ☐ |

---

## UAT-11 · In-App Purchase — Premium Upgrade (Lifetime)

**Priority:** CRITICAL  
**Precondition:** Sandbox tester account signed in on device (Settings → App Store → Sandbox Account). Both IAP products created in App Store Connect.  
**Note (v4.0):** The paywall has been fully rebuilt. See UAT-30 for detailed paywall UX verification. This suite covers the lifetime purchase flow specifically.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 11.1 | Open paywall from any trigger (Settings or document limit) | Paywall opens with Lifetime card displayed **first and prominently** as the hero product | ☐ |
| 11.2 | Verify Lifetime is pre-selected | Lifetime product has amber border, radio filled, and "BEST VALUE · RECOMMENDED" badge visible | ☐ |
| 11.3 | Verify Lifetime price displayed | Shows real price from StoreKit — expected £79.99 (or sandbox equivalent) | ☐ |
| 11.4 | Verify "Pay once. Then never again." subtitle appears under lifetime price | Text present on lifetime card | ☐ |
| 11.5 | Tap "Get Lifetime — £79.99" CTA | StoreKit purchase sheet appears (iOS system UI) | ☐ |
| 11.6 | Confirm purchase with sandbox account | Purchase completes; paywall dismisses automatically | ☐ |
| 11.7 | Verify premium status in Settings | Settings → Subscription shows "Lifetime access — no renewals, ever" confirmation text | ☐ |
| 11.8 | Verify no upgrade card is shown | Annual subscriber upgrade card does **not** appear (user is lifetime) | ☐ |
| 11.9 | Verify document limit removed | Can add a 6th document without paywall appearing | ☐ |
| 11.10 | Verify Family Kit unlocked | Family Kit creation wizard opens without paywall | ☐ |

### Restore Purchases

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 11.11 | Sign out from sandbox account; sign back in | — | ☐ |
| 11.12 | Settings → Subscription → "Restore Purchases" | Loading spinner; then "Lifetime access — no renewals, ever" confirmation restored | ☐ |

---

## UAT-12 · Family Kit Creation

**Priority:** CRITICAL  
**Precondition:** Premium account. **At least 1 document in vault** — the wizard immediately dismisses with an Alert if the vault is empty (see UAT-34).  
**Note (v5.0):** The kit wizard now guards against an empty vault at entry. If triggered with zero documents, the user sees an alert and is returned to the dashboard. Test that guard in UAT-34.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 12.1 | Tap "Family Kit" tab | Family Kit screen shows history / create button | ☐ |
| 12.2 | Tap "Create Family Kit" | Kit Creation Wizard opens — Step 1: Introduction | ☐ |
| 12.3 | Read introduction and tap "Get Started" | Step 2: owner name and emergency contact form | ☐ |
| 12.4 | Enter your name and an emergency contact name | Fields accept text | ☐ |
| 12.5 | Tap "Generate Kit" | Step 3: Loading / generating state shown | ☐ |
| 12.6 | Wait for generation to complete | Step 4: Validating (auto-validation); then Step 5: Complete | ☐ |
| 12.7 | Verify QR code is shown | A QR code is visible on the success screen | ☐ |
| 12.8 | Tap "Save & Distribute" | Step 6: Distribution options shown | ☐ |
| 12.9 | Tap "Save .afterme File" | iOS share sheet appears to save/AirDrop the file | ☐ |
| 12.10 | Save file to Files app | File saved with `.afterme` extension | ☐ |
| 12.11 | Tap "Print QR Key Card" | A PDF is generated and share/print sheet appears | ☐ |
| 12.12 | Dismiss wizard | Wizard closes; Family Kit tab shows kit history entry | ☐ |
| 12.13 | Verify freshness status | Kit shows "Fresh" status indicator | ☐ |
| 12.14 | Add a new document to vault | Family Kit tab shows a "stale" or "update recommended" warning | ☐ |
| 12.15 | **Verify both outputs exist** | You now have (a) the `.afterme` file saved to Files and (b) the printed/saved QR Key Card PDF — keep these for UAT-13 | ☐ |

---

## UAT-13 · Family Kit — Survivor Import

**Priority:** CRITICAL  
**Precondition:** A valid `.afterme` file and its QR code (from UAT-12) are available. Use a second device or fresh install.  
**Note (v3.0):** The survivor flow no longer shows a bereavement support step at the end. After the vault imports successfully, the flow ends at the vault intro screen with an "Open the Vault" button. No external support links appear.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 13.1 | Fresh install (or use second device) and launch app | Welcome screen shown | ☐ |
| 13.2 | Tap "I Have a Legacy Kit" | Survivor onboarding screen appears | ☐ |
| 13.3 | Verify tone and language | Warm, compassionate language; no corporate or clinical tone; dove emoji; "Take your time. There's no rush." | ☐ |
| 13.4 | Read the 3-step overview and tap "I'm Ready to Begin" | Camera opens for QR scanning | ☐ |
| 13.5 | Scan the printed/displayed QR code from UAT-12 | Access key extracted; "QR Code Received" screen appears with prompt to select file | ☐ |
| 13.6 | Tap "Select .afterme File" and choose the file from Files app | Decryption begins; "Importing Vault" loading screen shown | ☐ |
| 13.7 | Wait for import to complete | **"Vault Imported Successfully"** screen shown with document count | ☐ |
| 13.8 | Verify vault intro screen content | Shows document count, three info bullets (encryption, categories, Face ID protection) | ☐ |
| 13.9 | **Verify no support links appear** | No external links, no bereavement resources, no phone numbers are shown anywhere in this flow | ☐ |
| 13.10 | Tap "Open the Vault" | Main vault dashboard opens | ☐ |
| 13.11 | Verify all documents present | All documents from original vault are visible in library | ☐ |
| 13.12 | Open a document | Document content renders correctly | ☐ |
| 13.13 | Verify vault is protected by own biometrics | Force-close and reopen — Face ID prompt from the survivor's own device appears | ☐ |

---

## UAT-14 · Personal Recovery Kit

**Priority:** HIGH  
**Precondition:** At least 1 document in vault.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 14.1 | Open Settings → "Personal Recovery" section | "Personal Recovery Kit" button visible | ☐ |
| 14.2 | Tap "Personal Recovery Kit" | Wizard opens with introduction screen | ☐ |
| 14.3 | Read the introduction and storage recommendations | Clear instructions about storing file and QR code separately | ☐ |
| 14.4 | Tap "Generate Recovery Kit" | Loading screen with "Encrypting your vault…" | ☐ |
| 14.5 | Wait for completion | QR code shown on completion screen | ☐ |
| 14.6 | Tap "Save & Share" | Distribution screen shown | ☐ |
| 14.7 | Tap "Save .afterme File" | Share sheet appears to save the file | ☐ |
| 14.8 | Tap "Print QR Recovery Card" | PDF share sheet appears | ☐ |
| 14.9 | Tap "Done" | Wizard closes | ☐ |

---

## UAT-15 · iCloud Backup & Restore

**Priority:** CRITICAL  
**Precondition:** Signed into iCloud. iCloud Drive enabled. At least 3 documents in vault.

### Backup

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 15.1 | Open Settings → iCloud Backup | Section shows toggle and buttons | ☐ |
| 15.2 | Enable "Auto Backup" toggle | Toggle turns on; iCloud backup enabled | ☐ |
| 15.3 | Tap "Back Up Now" | Loading spinner on button; backup in progress | ☐ |
| 15.4 | Wait for completion | Success message or spinner stops; last backup date updates | ☐ |
| 15.5 | Verify only "Back Up Now" button was loading (not Restore) | The "Restore from Backup" button was not spinning | ☐ |

### Restore (Simulated Device Loss)

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 15.6 | Delete and reinstall the app | App launches fresh; Welcome screen shown | ☐ |
| 15.7 | Complete biometric setup (brief onboarding) | Key set up fresh on new install | ☐ |
| 15.8 | Go to Settings → iCloud Backup → "Restore from Backup" | Loading spinner on Restore button only | ☐ |
| 15.9 | Wait for restore to complete | All documents restored from iCloud | ☐ |
| 15.10 | Verify documents in library | All original documents visible with correct metadata | ☐ |
| 15.11 | Open a restored document | Document content renders correctly | ☐ |

---

## UAT-16 · Settings — Biometric Lock & Security

**Priority:** HIGH  
**Precondition:** Onboarding complete.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 16.1 | Open Settings → Security section | Biometric lock toggle shown; currently on | ☐ |
| 16.2 | Toggle biometric lock OFF | Toggle state changes; preference saved | ☐ |
| 16.3 | Background and reopen app | App reopens WITHOUT biometric prompt | ☐ |
| 16.4 | Toggle biometric lock back ON | Toggle state changes; preference saved | ☐ |
| 16.5 | Background and reopen app | Biometric prompt appears again | ☐ |
| 16.6 | Open Settings → Storage section | Shows encrypted vault size and used percentage | ☐ |
| 16.7 | Verify storage bar / display | Correct byte count displayed | ☐ |

---

## UAT-17 · Vault Integrity Check

**Priority:** MEDIUM  
**Precondition:** At least 3 documents in vault.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 17.1 | Open Settings → Storage section | "Check Integrity" button visible | ☐ |
| 17.2 | Tap "Check Integrity" | Loading state; scan in progress | ☐ |
| 17.3 | Wait for scan to complete | Result shown: "X of Y documents verified. No corruption found." | ☐ |
| 17.4 | Verify no false positives | Normal, readable documents should all pass | ☐ |

---

## UAT-18 · Multi-Vault Management

**Priority:** MEDIUM  
**Precondition:** Premium account (required for multiple vaults).

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 18.1 | Open Settings → "Manage Vaults" | Vault Manager screen opens in a modal | ☐ |
| 18.2 | Verify default vault | "My Vault" shown with a "Default" badge | ☐ |
| 18.3 | Tap "Create New Vault" (dashed card) | Name input dialog appears | ☐ |
| 18.4 | Enter "Work Documents" and create | New vault appears in list | ☐ |
| 18.5 | Tap "Work Documents" vault | "Active" badge moves to Work Documents vault | ☐ |
| 18.6 | Go to Documents tab | Library is empty (new vault has no documents) | ☐ |
| 18.7 | Add a document to Work Documents vault | Document saved in separate vault | ☐ |
| 18.8 | Switch back to "My Vault" | Original documents reappear in library | ☐ |
| 18.9 | Long-press "Work Documents" vault | Rename dialog appears | ☐ |
| 18.10 | Rename vault to "Business Docs" | Vault name updated | ☐ |
| 18.11 | Try to delete "My Vault" (default) | Error shown: "Cannot delete the default vault" | ☐ |
| 18.12 | Delete "Business Docs" vault | Confirmation alert shown; vault deleted after confirm | ☐ |
| 18.13 | Attempt to create a 6th vault (create 5 total first) | Error shown: "Maximum of 5 vaults reached" | ☐ |

---

## UAT-19 · Help & FAQ Screen

**Priority:** LOW  
**Precondition:** Onboarding complete.  
**Note (v4.0):** The Account & Subscription FAQ section has been updated with correct free tier limits and new pricing Q&A.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 19.1 | Open Settings → "Help & FAQ" | Help screen opens in a modal | ☐ |
| 19.2 | Verify 5 FAQ sections visible | Security & Privacy, Recovery & Backup, Documents & Vault, Account & Subscription, The .afterme Format | ☐ |
| 19.3 | Tap a question | Answer expands inline (accordion); chevron rotates | ☐ |
| 19.4 | Tap the question again | Answer collapses | ☐ |
| 19.5 | Open "Is there a storage limit?" in Documents & Vault | Answer reads "The free tier allows up to **5 documents**…" (not 10) | ☐ |
| 19.6 | Open "What do I get with Premium?" in Account & Subscription | Answer mentions **5-document** free tier limit, **£34.99/year** annual, **£79.99** lifetime | ☐ |
| 19.7 | Verify new "What is the difference between annual and lifetime?" question exists | Answer explains break-even in 2.5 years and upgrade path | ☐ |
| 19.8 | Scroll to bottom | "Contact Support" button and privacy/terms links visible | ☐ |
| 19.9 | Tap "Contact Support" | Mail app opens with `support@myafterme.co.uk` pre-filled | ☐ |
| 19.10 | Tap "Privacy Policy" | Safari opens `https://myafterme.co.uk/privacy` | ☐ |
| 19.11 | Tap "Terms of Service" | Safari opens `https://myafterme.co.uk/terms` | ☐ |
| 19.12 | Tap "Done" | Modal dismisses; back in Settings | ☐ |

---

## UAT-20 · Restore My Vault (Device Loss Recovery)

**Priority:** CRITICAL  
**Precondition:** A Personal Recovery Kit `.afterme` file and its QR code are available (from UAT-14). Fresh install.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 20.1 | Fresh install; launch app | Welcome screen shows 3 buttons | ☐ |
| 20.2 | Verify "Restore My Vault" button is visible | Third button below "I Have a Legacy Kit" | ☐ |
| 20.3 | Tap "Restore My Vault" | Survivor/Import flow opens | ☐ |
| 20.4 | Scan the Personal Recovery Kit QR code | Access key scanned | ☐ |
| 20.5 | Select the `.afterme` Recovery Kit file | Decryption begins | ☐ |
| 20.6 | Wait for restore to complete | Success; all documents restored | ☐ |
| 20.7 | Verify documents in library | All original documents present | ☐ |

---

## UAT-21 · Accessibility

**Priority:** HIGH  
**Precondition:** Enable VoiceOver (Settings → Accessibility → VoiceOver) for steps 21.1–21.6. Enable Large Text for 21.7–21.11.

### VoiceOver

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 21.1 | Enable VoiceOver; open app | VoiceOver reads the Welcome screen title and button labels | ☐ |
| 21.2 | Navigate through the new How It Works onboarding screen | Three path cards are read correctly; "I understand — continue" button announced | ☐ |
| 21.3 | Navigate to Document Library | Each document card announces title and category | ☐ |
| 21.4 | Navigate to category filter badges | Badges are announced with correct accessibility labels | ☐ |
| 21.5 | Navigate to Settings toggles | Biometric toggle announces "on/off" state | ☐ |
| 21.6 | Open Help screen | FAQ questions are announced with "button, collapsed/expanded" state | ☐ |
| 21.7 | Disable VoiceOver | — | ☐ |

### Dynamic Type

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 21.8 | Set font size to "Accessibility Extra Large" (Settings → Accessibility → Display & Text Size) | — | ☐ |
| 21.9 | Open app — check onboarding screens including new How It Works screen | Text scales up; no truncation or overflow on any card | ☐ |
| 21.10 | Open Document Library | Text in cards scales; layout remains usable | ☐ |
| 21.11 | Open Help screen | FAQ answers scale; accordion still works | ☐ |
| 21.12 | Open Settings → Support section | All links readable at large text | ☐ |
| 21.13 | Reset font size to default | — | ☐ |

---

## UAT-22 · Reset & Re-Onboarding

**Priority:** HIGH  
**Precondition:** App is fully set up with at least 3 documents.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 22.1 | Open Settings → scroll to bottom | "Reset Vault" or "Reset App" button visible | ☐ |
| 22.2 | Tap Reset | A confirmation dialog appears warning about data loss | ☐ |
| 22.3 | Cancel | App is unchanged | ☐ |
| 22.4 | Tap Reset again and confirm | All data cleared; app returns to Welcome screen | ☐ |
| 22.5 | Verify vault is empty | All documents gone; Welcome screen fresh | ☐ |
| 22.6 | Complete full onboarding again | Onboarding flows correctly from scratch including new How It Works screen | ☐ |
| 22.7 | Verify no residual data | No old documents appear | ☐ |

---

## UAT-23 · Onboarding — How It Works Screen

**Priority:** HIGH  
**Precondition:** Fresh install or reset. Reach the new explainer screen by advancing through Screens 1–4 of onboarding.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 23.1 | Advance through Screens 1–4 of onboarding | After Screen 4 (QR reveal), a new screen appears before the Legal Disclaimer | ☐ |
| 23.2 | Verify screen eyebrow text | Reads "Before you set up" in amber uppercase | ☐ |
| 23.3 | Verify headline | Reads "How your family will access this" | ☐ |
| 23.4 | Verify subhead copy | Explains the concept of no phone / no password / no Apple ID needed | ☐ |
| 23.5 | Verify Path 1 card — Family Kit | Card present; "Recommended" badge in amber; explains QR card + .afterme file; notes "Requires: QR card + .afterme file" | ☐ |
| 23.6 | Verify Path 2 card — iCloud | Card present; "For your own recovery" badge; warning note that it does NOT give family access | ☐ |
| 23.7 | Verify Path 3 card — No preparation | Card present; explains permanent inaccessibility | ☐ |
| 23.8 | Verify amber note at bottom | Reads "You'll set up your Family Kit right after finishing this setup. It takes about two minutes." | ☐ |
| 23.9 | Tap "I understand — continue" | App proceeds to Legal Disclaimer screen | ☐ |
| 23.10 | Verify progress dot count | 8 dots in total shown; dot 5 is active on this screen | ☐ |
| 23.11 | Verify animation | Cards stagger in with fade + slide; CTA fades in last | ☐ |
| 23.12 | Verify no crash on physical device | Screen loads and animates without any crash or error | ☐ |

---

## UAT-24 · Safety Net — Family Kit Path

**Priority:** CRITICAL  
**Precondition:** Reached the Safety Net screen (Screen 8) of onboarding. **Premium account required to actually create a kit** — if not premium, verify the paywall gate (see UAT-29).  
**Note (v5.0):** If the vault is empty when onboarding completes via this path, the wizard will NOT auto-launch. The dashboard will instead show the "No safety net yet" nudge card. See UAT-34 for empty-vault guard testing.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 24.1 | On Safety Net screen, tap "Create a Family Kit" (Card 1, amber border) | App completes onboarding and navigates to the main vault dashboard | ☐ |
| 24.2 | Verify the app opens to the dashboard | Onboarding marked complete; vault accessible | ☐ |
| 24.3 | If premium AND vault has at least 1 document: Family Kit Wizard launches immediately | Kit creation wizard opens without a paywall | ☐ |
| 24.3a | If premium BUT vault is empty: Wizard does NOT launch | Dashboard shown with "No safety net yet" nudge card; no wizard or error | ☐ |
| 24.4 | If not premium: Paywall appears | Paywall shown before wizard; after purchase, wizard launches (see UAT-29) | ☐ |
| 24.5 | Open Settings → iCloud Backup section | iCloud backup is **not** automatically enabled (only the Kit path was chosen) | ☐ |
| 24.6 | Verify Dashboard shows "No safety net yet" nudge card until kit is created | Dashboard card persists until a Family Kit has been successfully generated | ☐ |

---

## UAT-25 · Safety Net — iCloud Path

**Priority:** HIGH  
**Precondition:** Reached the Safety Net screen (Screen 8) of onboarding.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 25.1 | On Safety Net screen, tap "Enable iCloud Backup" (Card 2, grey border, "For you only" badge) | A loading indicator briefly shows; then app completes onboarding | ☐ |
| 25.2 | Open Settings → iCloud Backup section | Toggle shows "Auto Backup: On" | ☐ |
| 25.3 | Verify Dashboard shows a Family Kit creation prompt | Because iCloud is personal-only, the Dashboard should still encourage creating a Family Kit for family access | ☐ |
| 25.4 | Verify card 2 secondary text was accurate | Confirm that iCloud is for personal recovery — test by verifying a family member on a separate device **cannot** access the vault from iCloud without the owner's Apple ID | ☐ |

---

## UAT-26 · Safety Net — Defer Path

**Priority:** HIGH  
**Precondition:** Reached the Safety Net screen (Screen 8) of onboarding.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 26.1 | On Safety Net screen, tap "Living dangerously — remind me later" | A confirmation alert appears: "Are you sure? Without a safety net…" | ☐ |
| 26.2 | Tap "Go Back" on the alert | Alert dismisses; Safety Net screen is still showing | ☐ |
| 26.3 | Tap defer again, then tap "Continue without safety net" | App completes onboarding and enters the vault | ☐ |
| 26.4 | Check Dashboard | A warning banner/card is visible prompting to set up a safety net | ☐ |
| 26.5 | Verify iCloud backup is off | Settings → iCloud Backup toggle is off | ☐ |
| 26.6 | Verify no Family Kit exists | Family Kit tab shows no kits created | ☐ |

---

## UAT-27 · Settings → Support Content

**Priority:** HIGH  
**Precondition:** Onboarding complete.  
**Note (v3.0):** The Support section in Settings previously contained bereavement resources (Beyond Blue, Lifeline Australia, Grief Support Services). These have been removed. Only application support links should appear.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 27.1 | Open Settings → scroll to Support section | Support section is visible | ☐ |
| 27.2 | Verify the Support section heading | Reads "Support" | ☐ |
| 27.3 | Count the items in the Support section | Exactly 4 items — no more, no less | ☐ |
| 27.4 | Verify item 1: Contact Support | Label "Contact Support" with hint "support@myafterme.co.uk" | ☐ |
| 27.5 | Tap Contact Support | Mail app opens with `support@myafterme.co.uk` pre-filled | ☐ |
| 27.6 | Verify item 2: Support Centre | Label "Support Centre" with hint "FAQs, guides and help articles" | ☐ |
| 27.7 | Tap Support Centre | Safari opens `https://myafterme.co.uk/support` | ☐ |
| 27.8 | Verify item 3: Privacy Policy | Label "Privacy Policy" with hint "How we handle your data" | ☐ |
| 27.9 | Tap Privacy Policy | Safari opens `https://myafterme.co.uk/privacy` | ☐ |
| 27.10 | Verify item 4: Terms of Service | Label "Terms of Service" with hint "Your rights and our obligations" | ☐ |
| 27.11 | Tap Terms of Service | Safari opens `https://myafterme.co.uk/terms` | ☐ |
| 27.12 | **Verify bereavement links are gone** | "Beyond Blue", "Lifeline Australia", "Grief Support Services" do **not** appear anywhere in the Support section | ☐ |
| 27.13 | Verify no crisis phone numbers appear | No phone numbers (e.g. 1300 22 4636, 13 11 14) appear in the Support section | ☐ |

---

## UAT-28 · Website — How It Works Page

**Priority:** MEDIUM  
**Precondition:** Device with a browser. Internet connection. Navigate to `myafterme.co.uk`.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 28.1 | Open `https://myafterme.co.uk/how-it-works` in a browser | Page loads without errors | ☐ |
| 28.2 | Verify page title in browser tab | "How Family Access Works — After Me \| End-of-Life Vault" | ☐ |
| 28.3 | Verify hero headline | "How your loved ones will access your vault" | ☐ |
| 28.4 | Verify "The problem we set out to solve" section | Present; explains the problem without After Me | ☐ |
| 28.5 | Verify 4 access path cards | Path 1 (Family Kit — amber, "Recommended"), Path 2 (Personal Recovery Kit), Path 3 (iCloud — "Not for family access" warning in red), Path 4 (No preparation — no recovery) | ☐ |
| 28.6 | Verify iCloud warning callout | Red callout explicitly states iCloud does NOT give family access and explains Apple's Digital Legacy process | ☐ |
| 28.7 | Verify step-by-step walkthrough | Two sections: "What you do today" (6 steps) and "What your family does when they need it" (4 steps) | ☐ |
| 28.8 | Verify "What to tell your family right now" checklist | 6 checklist items covering app download, QR card location, file location, both needed, no phone needed, when last updated | ☐ |
| 28.9 | Verify comparison table | 4 rows: Family Kit, Personal Recovery Kit, iCloud, No preparation — with Yes/No/Partial for family access and personal restore | ☐ |
| 28.10 | Verify FAQ accordion | 5 questions; click each to expand and collapse | ☐ |
| 28.11 | Click "Download on the App Store" CTA | Link navigates to App Store (or placeholder URL) | ☐ |
| 28.12 | Verify footer links | "How It Works" highlighted as current page; Privacy Policy, Terms, Support, Format Spec, Contact all present | ☐ |
| 28.13 | Verify the page is linked from all other web pages | Footer on index.html, privacy.html, terms.html, support.html all include "How It Works" link | ☐ |
| 28.14 | Check page on mobile viewport (375px width) | Page is fully responsive; no horizontal overflow | ☐ |

---

## UAT-29 · Premium Gate — Family Kit from Onboarding

**Priority:** CRITICAL  
**Precondition:** Onboarding just completed via the Family Kit path on Safety Net screen (UAT-24). User is NOT yet premium.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 29.1 | Complete onboarding via "Create a Family Kit" on Safety Net screen, without premium | App transitions to vault | ☐ |
| 29.2 | Verify the experience | A paywall appears before the Family Kit wizard, OR the app gracefully routes to the Family Kit tab with an upgrade prompt | ☐ |
| 29.3 | Verify no crash or dead end | The non-premium user is never left on a broken or empty screen | ☐ |
| 29.4 | Dismiss paywall | Returns to Dashboard or Family Kit tab cleanly | ☐ |
| 29.5 | Purchase Premium (see UAT-11) | Premium is activated | ☐ |
| 29.6 | Navigate to Family Kit tab and tap Create | Family Kit wizard opens without paywall | ☐ |
| 29.7 | Complete the Family Kit wizard | Kit created successfully; QR code shown | ☐ |
| 29.8 | Verify Dashboard family kit prompt resolves | Dashboard no longer shows a "create your kit" warning after kit is created | ☐ |

---

## UAT-30 · Paywall UX — Lifetime Hero, Break-Even & Death-Risk

**Priority:** CRITICAL  
**Precondition:** Free tier user. Open paywall from any trigger.  
**Note (v4.0):** The paywall layout has been completely rebuilt. Lifetime is the hero product, shown first. Annual is secondary, shown below a break-even maths strip.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 30.1 | Open paywall from any trigger | Paywall loads; Lifetime card appears **first and largest** | ☐ |
| 30.2 | Verify death-risk callout | Amber callout card visible near top: *"With an annual plan, your family may need to manage a renewal after you're gone. With lifetime, they never will."* | ☐ |
| 30.3 | Verify Lifetime card content | "BEST VALUE · RECOMMENDED" badge (amber); large price (£79.99); "Pay once. Then never again." tagline; 7 feature bullets including "No renewal risk at death" | ☐ |
| 30.4 | Verify break-even maths strip | Between the two cards: "Annual × 3 years = £104.97 · Lifetime = £79.99 · Break even in under 2.5 years" | ☐ |
| 30.5 | Verify Annual card is below maths strip | Annual card shows £34.99/year; labelled "Annual — start smaller"; 5 feature bullets; note about upgrading to lifetime from Settings | ☐ |
| 30.6 | Verify Lifetime is pre-selected by default | Lifetime radio is filled; amber border on lifetime card | ☐ |
| 30.7 | Verify CTA button with Lifetime selected | Button reads "Get Lifetime — £79.99" | ☐ |
| 30.8 | Tap Annual card to select it | Annual card highlights; radio fills; CTA changes to "Start Annual — £34.99/yr" | ☐ |
| 30.9 | Tap Lifetime card to re-select it | Lifetime card re-highlights; CTA reverts to "Get Lifetime — £79.99" | ☐ |
| 30.10 | Verify legal text changes | Legal text below CTA shows "One-time payment. No subscription. No renewal. Ever." when Lifetime is selected; shows subscription renewal text when Annual is selected | ☐ |
| 30.11 | Verify "Restore Purchases" button present | Visible below CTA for non-upgrade flows | ☐ |
| 30.12 | Verify no crash when products fail to load | If StoreKit unavailable (simulator), a graceful "Products temporarily unavailable" message appears | ☐ |

---

## UAT-31 · Annual Plan Purchase via Paywall

**Priority:** CRITICAL  
**Precondition:** Sandbox tester account configured. IAP annual product `com.afterme.app.premium.annual` exists in App Store Connect.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 31.1 | Open paywall; tap Annual card | Annual card selected; CTA reads "Start Annual — £34.99/yr" | ☐ |
| 31.2 | Tap CTA | StoreKit subscription sheet appears (iOS system UI) | ☐ |
| 31.3 | Confirm purchase with sandbox account | Purchase completes; paywall dismisses | ☐ |
| 31.4 | Verify premium status in Settings | Settings → Subscription shows "Annual subscription active" | ☐ |
| 31.5 | Verify upgrade card is visible | An amber "Switch to Lifetime" upgrade card appears below the subscription status | ☐ |
| 31.6 | Verify upgrade card content | Badge: "UPGRADE AVAILABLE"; Title: "Switch to Lifetime"; Body: "Pay once. Then never again — including for your family after you're gone."; "See offer →" link | ☐ |
| 31.7 | Verify no "Upgrade to Premium" button shown | The main amber "Upgrade to Premium" button is hidden (user is already premium) | ☐ |
| 31.8 | Verify document limit removed | Can add a 6th document without paywall | ☐ |
| 31.9 | Verify Family Kit unlocked | Family Kit wizard opens without paywall | ☐ |

---

## UAT-32 · Settings — Annual Subscriber Upgrade Card

**Priority:** HIGH  
**Precondition:** Annual plan purchased (from UAT-31 or sandbox). User is in Settings.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 32.1 | Open Settings → scroll to Subscription section | Amber upgrade card visible below "Annual subscription active" text | ☐ |
| 32.2 | Verify upgrade card copy exactly | "UPGRADE AVAILABLE" badge · "Switch to Lifetime" title · "Pay once. Then never again — including for your family after you're gone." · "See offer →" | ☐ |
| 32.3 | Tap the upgrade card | Paywall opens in **upgrade mode** | ☐ |
| 32.4 | Verify upgrade paywall layout | Single card showing lifetime only — no annual option shown | ☐ |
| 32.5 | Verify upgrade paywall headline | "Switch to lifetime. Pay once. Never again." | ☐ |
| 32.6 | Verify upgrade paywall price | Shows upgrade price (£54.99 or the configured price) | ☐ |
| 32.7 | Verify upgrade paywall features list | Shows full lifetime feature list including "No renewal risk at death" | ☐ |
| 32.8 | Verify no "Restore Purchases" button in upgrade mode | Restore button not shown for the upgrade trigger | ☐ |
| 32.9 | Tap upgrade CTA | StoreKit sheet appears for lifetime product | ☐ |
| 32.10 | Complete purchase | Purchase completes; paywall dismisses | ☐ |
| 32.11 | Verify upgrade card is now gone | Settings Subscription section shows "Lifetime access — no renewals, ever" · No upgrade card | ☐ |

---

## UAT-33 · Website — Pricing Section

**Priority:** HIGH  
**Precondition:** Browser with internet access. Navigate to `https://myafterme.co.uk`.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 33.1 | Navigate to `myafterme.co.uk` and scroll to Pricing section | Pricing section loads | ☐ |
| 33.2 | Verify section headline | "Pay once. Then never again." | ☐ |
| 33.3 | Verify **Lifetime card is shown first** (left/top) with featured styling | Lifetime card has amber border, "RECOMMENDED" badge, appears before Annual card | ☐ |
| 33.4 | Verify Lifetime price | "£79.99" displayed prominently | ☐ |
| 33.5 | Verify Lifetime subheading | "one-time · then never again" | ☐ |
| 33.6 | Verify break-even note on Lifetime card | "Annual × 3 years = £104.97 · break even in under 2.5 years" | ☐ |
| 33.7 | Verify "No renewal risk at death" bullet | Lifetime feature list includes "No renewal risk at death — your family inherits access, not the invoice" | ☐ |
| 33.8 | Verify Annual card is secondary (right/below) | Annual card shown with £34.99/year price; no featured styling | ☐ |
| 33.9 | Verify "Upgrade to lifetime any time from Settings" note on Annual card | Text present on annual card | ☐ |
| 33.10 | Verify **no Family plan** is shown | Only two products: Lifetime and Annual. No £149 Family plan card. | ☐ |
| 33.11 | Verify "Family plan coming soon" note in footer of pricing section | Small grey note: "Family plan coming soon · Built for individuals at launch" | ☐ |
| 33.12 | Verify free tier note | "Up to 5 documents, read-only after 7-day full trial · Your data is always yours to export" | ☐ |
| 33.13 | Verify "Get early access" buttons on both cards | Both CTA buttons link to `#waitlist` | ☐ |

---

## UAT-34 · Family Kit — Empty Vault Guard *(new)*

**Priority:** CRITICAL  
**Precondition:** Premium account. Vault must have **zero documents**.  
**Note (v5.0):** The kit wizard now has a pre-flight guard — it dismisses immediately if no documents exist and shows a clear alert. This test verifies the guard from multiple entry points.

| Step | Action | Expected Result | Result |
|---|---|---|---|
| 34.1 | Complete fresh install + onboarding. Choose "Create a Family Kit" on Safety Net screen. Ensure vault is empty. | App completes onboarding and shows the vault dashboard | ☐ |
| 34.2 | Verify the Family Kit wizard does NOT auto-open | Dashboard is shown. No wizard, no error screen. "No safety net yet" nudge card visible. | ☐ |
| 34.3 | Tap the "No safety net yet" nudge card on the dashboard (vault still empty) | Alert shown: "Add documents first — your Family Kit is an encrypted snapshot of your vault. Add at least one document before generating your kit." | ☐ |
| 34.4 | Dismiss the alert. Add at least 1 document to the vault. | Document added successfully | ☐ |
| 34.5 | Tap the "No safety net yet" nudge card again (vault now has 1 document) | Family Kit wizard opens at Step 1: Introduction | ☐ |
| 34.6 | Tap "Family Kit" tab → "Create Family Kit" button with empty vault (reset vault if needed) | Alert shown: "Add documents first..." | ☐ |
| 34.7 | Verify alert message is clear and actionable | Alert body explains: "Your Family Kit is an encrypted snapshot of your vault. Add at least one document before generating your kit." | ☐ |
| 34.8 | Dismiss alert | Wizard is closed; user is back on the previous screen | ☐ |
| 34.9 | Verify Safety Net card copy on onboarding screen 8 | Card 1 secondary text reads: "The only way your loved ones can access this vault. Add documents first, then generate your kit." | ☐ |

---

## Pass/Fail Summary Sheet

**Tester Name:** ___________________________  
**Device:** ___________________________  
**iOS Version:** ___________________________  
**App Version:** ___________________________  
**Test Date:** ___________________________  
**Build Type:** Release / Debug

---

| Suite | Test ID | Test Name | Result | Notes |
|---|---|---|---|---|
| Onboarding | UAT-01 | First Launch & Onboarding (8 screens) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Auth | UAT-02 | Biometric Authentication | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Legal | UAT-03 | Legal Disclaimer & Privacy (`myafterme.co.uk/privacy`) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Safety Net | UAT-04 | Safety Net Screen — Content & Messaging | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Dashboard | UAT-05 | Vault Dashboard | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Scanning | UAT-06 | Document Scanning | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Import | UAT-07 | Document Import | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Library | UAT-08 | Search, Sort & Filter | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Viewer | UAT-09 | Document Viewer & Editing | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Free Tier | UAT-10 | Free Tier & Paywall | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Purchases | UAT-11 | In-App Purchase | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Family Kit | UAT-12 | Family Kit Creation | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Survivor | UAT-13 | Survivor Import (no support links) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Recovery Kit | UAT-14 | Personal Recovery Kit | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| iCloud | UAT-15 | iCloud Backup & Restore | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Security | UAT-16 | Biometric Lock & Security | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Integrity | UAT-17 | Vault Integrity Check | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Multi-Vault | UAT-18 | Multi-Vault Management | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Help | UAT-19 | Help & FAQ Screen | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Device Loss | UAT-20 | Restore My Vault | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Accessibility | UAT-21 | VoiceOver & Dynamic Type | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Reset | UAT-22 | Reset & Re-Onboarding | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| How It Works | UAT-23 | Onboarding — How It Works Screen | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Safety Net — Kit | UAT-24 | Safety Net: Family Kit Path | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Safety Net — iCloud | UAT-25 | Safety Net: iCloud Path (personal only) | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Safety Net — Defer | UAT-26 | Safety Net: Defer Path | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Support Content | UAT-27 | Settings → Support — Correct Links Only | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Website | UAT-28 | Website — How It Works Page | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Premium Gate | UAT-29 | Premium Gate — Family Kit from Onboarding | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Paywall UX | UAT-30 | Paywall Layout — Lifetime Hero, Break-Even, Death-Risk | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Annual Purchase | UAT-31 | Annual Plan Purchase via Paywall | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Upgrade Card | UAT-32 | Settings → Upgrade Card for Annual Subscribers | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Website Pricing | UAT-33 | Website Pricing Section — Lifetime Hero + Annual | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |
| Family Kit Guard | UAT-34 | Family Kit — Empty Vault Guard | ☐ PASS / ☐ FAIL / ☐ BLOCKED | |

---

### Overall Result

| Metric | Count |
|---|---|
| Total test suites | 34 |
| PASS | |
| FAIL | |
| BLOCKED | |
| **Go / No-Go** | |

**Signed off by:** ___________________________  
**Date:** ___________________________

---

## Defect Log

| # | Suite | Test ID | Step | Description | Severity | Status |
|---|---|---|---|---|---|---|
| 1 | | | | | Critical / High / Medium / Low | Open / Fixed |

---

*After Me UAT v5.0 — Covers Phases 1–6 plus all post-launch changes: Safety Net redesign, onboarding How It Works explainer, survivor flow clean-up, support content corrections, website how-it-works page, premium gate verification, free tier reduced to 5 documents, paywall rebuild (lifetime hero, break-even maths, death-risk callout), annual plan and upgrade path, Family Kit empty-vault guard (wizard blocks and alerts if no documents exist).*
