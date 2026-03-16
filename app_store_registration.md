# App Store Registration Guide - After Me App

## Part 2 — Create the App Record in App Store Connect

**appstoreconnect.apple.com → My Apps → New App**

This creates your store listing and links to the App ID you just registered.

### 1. Go to App Store Connect
Sign in at **appstoreconnect.apple.com** with the same Apple ID. Click **"My Apps"** in the top nav, then the blue **+** button → **New App**.

### 2. Fill in the New App form
- **Platform**: iOS
- **Name**: After Me (this is what users see in the App Store — you can change it later)
- **Primary language**: English (UK) or English (US) depending on your primary market
- **Bundle ID**: select **com.afterme.app** from the dropdown — it will appear because you just registered it
- **SKU**: a unique string for your own records — **AFTERME-001** works fine
- **User access**: Full Access

### 3. Create — your App Record now exists
Click **Create**. You now have an App Record with an Apple ID number (a long integer like 6743821045). Keep this — you'll need it for TestFlight, analytics, and App Review communication.

## Part 3 — Create the In-App Purchase products

**App Store Connect → Your App → Monetisation → In-App Purchases**

Do this now, before any StoreKit code is written. Product IDs are permanent.

### 1. Navigate to In-App Purchases
Inside your App Record, left sidebar: **Monetisation → In-App Purchases → press the + button**.

### 2. Select type: Non-Consumable
For a lifetime unlock, always use **Non-Consumable** — it can only be purchased once and is permanently tied to the user's Apple ID. If they delete and reinstall the app, they restore it for free. Never use Consumable or Subscription for a lifetime purchase.

### 3. Create the Personal Lifetime product
- **Reference name** (internal only): After Me Personal Lifetime
- **Product ID** — type this exactly, it is permanent:
```
com.afterme.app.lifetime.personal
```

### 4. Set pricing for Personal
Click **"Set Pricing"** → select your base territory (UK or US) → find the price tier closest to **$79.99 / £74.99**. Apple uses fixed price tiers — you can't type an arbitrary price. The closest tiers are usually around the $79.99 mark. Set availability: All Territories (or manually select if you want to restrict geography at launch).

### 5. Add localisation for Personal
Under **"Localizations"** add English.
- **Display name**: After Me — Lifetime Access
- **Description**: Unlimited documents, unlimited kit updates. One payment, yours forever. No subscription.

### 6. Save, then repeat for Family Lifetime
Create a second Non-Consumable product:
- **Product ID**: `com.afterme.app.lifetime.family`
- **Display name**: After Me — Family Lifetime
- **Price tier**: ~$149.99 / £139.99
- **Description**: Covers up to 5 vaults. Set it up for your parents too.

Both products will show as **"Missing Metadata"** until you submit a build. That's normal — you can reference the product IDs in your StoreKit code immediately regardless.

## Part 4 — Link it all to Xcode

### 1. Open your Xcode project → Signing & Capabilities
Select your target → **Signing & Capabilities** tab. Set **Team** to your Apple Developer account. Set **Bundle Identifier** to exactly **com.afterme.app** — must match what you registered.

### 2. Add capabilities in Xcode to match the portal
Click the **+ Capability** button and add:
- **In-App Purchase**
- **iCloud** (enable CloudKit)
- **Push Notifications**

Xcode will automatically generate and download the provisioning profiles that match your App ID configuration.

### 3. Add a StoreKit Configuration file for testing
**File → New → File → StoreKit Configuration File**. Name it **AfterMe.storekit**. Add your two products here with the exact same product IDs. This lets you test purchases in the simulator without hitting Apple's servers — essential for development.

### 4. Reference the product IDs in your StoreKit code
Now your code can safely reference:
```swift
let personalLifetime = "com.afterme.app.lifetime.personal"
let familyLifetime  = "com.afterme.app.lifetime.family"
```

Never hardcode product IDs as bare strings scattered through your codebase. Define them once as constants in a dedicated file — **Products.swift** — and reference that everywhere. This is what protects you from the [objectObject] class of bug.

## Summary Checklist — tick these off in order

1. ✅ Apple Developer Program enrolled and paid
2. ✅ Bundle ID decided: **com.afterme.app**
3. ✅ App ID registered at developer.apple.com with IAP + iCloud + Push + Face ID capabilities
4. ✅ App Record created at appstoreconnect.apple.com
5. ✅ Two IAP products created: `com.afterme.app.lifetime.personal` and `com.afterme.app.lifetime.family`
6. ✅ Xcode project Bundle ID set, capabilities added, provisioning profiles downloaded
7. ✅ StoreKit Configuration file created for local testing