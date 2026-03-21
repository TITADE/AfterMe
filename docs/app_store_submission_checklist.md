# After Me — App Store Submission Checklist

## Pre-Submission Requirements

### App Store Connect Configuration
- [ ] Create App in App Store Connect
- [ ] Bundle ID: `com.afterme.app` (must match `app.json` — registered in App Store Connect ✓)
- [ ] Android Package: `com.afterme.app` (confirm when setting up Play Store)
- [ ] Set primary category: **Utilities**
- [ ] Set secondary category: **Productivity**
- [ ] Enable Family Sharing for in-app purchases

### In-App Purchase Setup (App Store Connect)
- [ ] Create product: `com.afterme.app.premium.lifetime` (Non-Consumable — Lifetime purchase)
- [ ] Create product: `com.afterme.app.premium.annual` (Auto-Renewable Subscription)
- [ ] Set pricing for each product
- [ ] Add product descriptions and screenshots
- [ ] Submit products for review alongside the app

### iCloud Entitlements
- [x] `ios.entitlements` added to `app.json` with iCloud services, container ID, and ubiquity container ID — **DONE**
- [ ] Enable iCloud Documents capability in Apple Developer Portal (manual — Apple Developer Console → Certificates, Identifiers & Profiles → iCloud)
- [ ] Create iCloud container: `iCloud.com.afterme.app` in Apple Developer Portal
- [ ] Verify EAS build provisions the iCloud entitlement (run `eas build --profile preview` and inspect the .ipa entitlements)

### Privacy & Legal
- [ ] Privacy Policy URL is live and accessible
- [ ] Terms of Service URL is live and accessible
- [ ] `NSFaceIDUsageDescription` set in `app.json` — **DONE**
- [ ] `ITSAppUsesNonExemptEncryption: false` set — **DONE**
- [ ] Camera permission string set — **DONE**
- [ ] Photo Library permission string set — **DONE**
- [ ] `expo-local-authentication` Face ID plugin configured — **DONE**

### App Privacy (App Store Connect)
- [ ] Complete Data Types disclosure:
  - **Data Not Collected** for most categories
  - **Diagnostics: Crash Data** — collected (Sentry), not linked to identity
  - **Diagnostics: Performance Data** — collected (Sentry), not linked to identity
- [ ] Confirm: No tracking, no advertising identifiers
- [ ] Confirm: All encryption is on-device (AES-256-GCM)
- [ ] Confirm: iCloud backup data is encrypted before upload

### Build Configuration
- [x] `eas.json` created with development/preview/production profiles — **DONE**
- [x] `eas.json` `env.production.EXPO_PUBLIC_SENTRY_DSN` placeholder added — replace with real DSN from sentry.io
- [ ] Replace `REPLACE_WITH_APP_STORE_CONNECT_APP_ID` in `eas.json` with real ASC App ID
- [ ] Replace `REPLACE_WITH_APPLE_TEAM_ID` in `eas.json` with real Apple Team ID
- [ ] Replace `REPLACE_WITH_SENTRY_DSN` in `eas.json` with real Sentry DSN
- [ ] Test production build locally before submission

## App Store Metadata

### Screenshots (Required)
- [ ] iPhone 6.7" (iPhone 15 Pro Max): 1290 × 2796 px
- [ ] iPhone 6.5" (iPhone 14 Plus): 1284 × 2778 px
- [ ] iPhone 5.5" (iPhone 8 Plus): 1242 × 2208 px
- [ ] iPad Pro 12.9": 2048 × 2732 px (if supporting tablet)

### Recommended Screenshots
1. Vault Dashboard showing document categories
2. Document scanning in progress
3. Family Kit creation with QR code
4. Settings screen showing encryption info
5. Onboarding screen showing value proposition

### App Description
```
After Me — Secure Document Vault

Keep your most important documents safe, encrypted, and accessible to your loved ones when they need them most.

After Me is a secure, privacy-first document vault designed for estate planning. Your documents are encrypted with military-grade AES-256-GCM encryption and stored locally on your device. Only you can access them.

KEY FEATURES:
• Military-grade AES-256-GCM encryption
• Biometric authentication (Face ID / Touch ID)
• Document scanning with auto edge detection
• 8 categories: Identity, Legal, Property, Finance, Insurance, Medical, Digital, Personal
• Family Kit — share encrypted vault access with trusted people
• QR-based key card for offline access recovery
• iCloud encrypted backup (Apple cannot read your data)
• Vault integrity checking
• Emotionally-sensitive survivor onboarding

PREMIUM FEATURES:
• Unlimited document storage (free tier: 10 documents)
• Family Kit creation & sharing
• iCloud encrypted backup
• Priority support

After Me was built with one mission: ensuring the people you love can access what they need, when they need it.

Your data never leaves your device unencrypted. We can't see it. We can't sell it. It's yours.
```

### Keywords
`document vault, estate planning, encrypted storage, family kit, secure documents, will, trust, end of life, digital legacy, document scanner`

### Support URL
- [ ] Set up support page or email: `support@myafterme.co.uk`

### Marketing URL (optional)
- [ ] Landing page for After Me

## TestFlight Beta

### Pre-TestFlight
- [ ] Run `eas build --profile preview --platform ios`
- [ ] Verify build succeeds
- [ ] Submit to TestFlight via `eas submit --platform ios`
- [ ] Add internal testers (up to 100)

### Beta Testing Checklist
- [ ] Onboarding flow: complete all 7 steps
- [ ] Document scanning: scan 1-page and multi-page
- [ ] Import from Files and Photos
- [ ] Category assignment and metadata editing
- [ ] Family Kit creation and QR code generation
- [ ] Survivor import flow (scan QR + select file)
- [ ] iCloud backup and restore
- [ ] Biometric lock toggle
- [ ] Free tier limit (10 documents) triggers paywall
- [ ] Purchase flow (use sandbox tester account)
- [ ] Restore purchases
- [ ] Vault integrity check
- [ ] Reset vault and re-onboard
- [ ] VoiceOver / accessibility review

## Review Notes (for App Store Review)

```
After Me is a document vault for estate planning. All documents are encrypted with AES-256-GCM on-device using keys stored in the iOS Secure Enclave.

To test:
1. Complete onboarding (7 screens)
2. Add a document via scan or file import
3. View the document in the library
4. Create a Family Kit (requires premium)
5. Check Settings for vault info, backup, and encryption details

For in-app purchase testing, please use a sandbox tester account.

The app uses Face ID solely for vault access authentication. No biometric data is stored or transmitted.

iCloud backup: Documents are encrypted with the user's vault key before upload. Apple's iCloud infrastructure cannot decrypt the contents.
```

## Post-Launch
- [ ] Monitor Sentry for crash reports
- [ ] Review App Store Connect analytics
- [ ] Respond to user reviews within 24 hours
- [ ] Plan next release based on beta feedback
