# Bug Report — Implementation Plan

**Date:** 17 March 2026
**Source:** After Me — Mobile App Bug Report (9 issues)
**Tested on:** iPhone 14 (iOS 26.2.1), development build

---

## Issue #1 — Reset button overlapping with onboarding buttons

### Root Cause
The dev Reset button in `AppNavigator.tsx` (lines 160–168) is absolutely positioned at `bottom: insets.bottom + 24, left: 20` with `zIndex: 9999`. This overlaps with CTA buttons and progress dots at the bottom of every onboarding screen.

The button is correctly gated behind `__DEV__` so it won't appear in production, but it blocks UI interaction during development and testing.

### Proposed Fix
**File:** `src/navigation/AppNavigator.tsx`

Move the dev button from bottom-left to top-left, above all onboarding content:

```typescript
// Change style from:
devButton: {
  position: 'absolute',
  left: 20,
  // bottom: insets.bottom + 24,  ← overlaps CTAs
  ...
}

// To:
devButton: {
  position: 'absolute',
  top: insets.top + 8,    // ← sits above status bar, clear of content
  left: 16,
  ...
}
```

This ensures the Reset button never overlaps with CTA buttons, progress dots, or any other interactive elements at the bottom of onboarding screens.

### Risk: Low
Dev-only UI change. No logic or flow affected.

---

## Issue #2 — Reset button persists + progress dots misalignment

### Root Cause (Reset persistence)
The dev button renders for all onboarding steps because it sits outside the step-conditional ternary chain (lines 160–168). This is intentional design for dev builds. Resolved by fixing Issue #1 positioning so it no longer obstructs.

### Root Cause (Progress dots misalignment)
The onboarding flow has **8 screens** after Welcome, but progress dots are inconsistent:

| Screen | File | Dots rendered | Active position |
|--------|------|:---:|:---:|
| Screen 1 | `OnboardingScreen1.tsx` | 7 | 1 |
| Screen 2 | `OnboardingScreen2.tsx` | 7 | 2 |
| Screen 3 | `OnboardingScreen3.tsx` | 7 | 3 |
| Screen 4 | `OnboardingScreen4.tsx` | 7 | 4 |
| How It Works | `OnboardingHowItWorksScreen.tsx` | **8** | 5 |
| Legal Disclaimer | `LegalDisclaimerScreen.tsx` | 7 | **5** (duplicate) |
| Biometric Setup | `OnboardingScreen5.tsx` | 7 | 6 |
| Safety Net | `OnboardingScreen6.tsx` | 7 | 7 |

Problems:
1. `OnboardingHowItWorksScreen` renders **8 dots** while all others render 7
2. `LegalDisclaimerScreen` shows position 5 — same as HowItWorks (should be 6)
3. The flow has 8 steps but only 7 dots — when LegalDisclaimer was added, the total was not updated

### Proposed Fix
**Files:** All 8 onboarding screens

Standardise to **8 dots** across all screens with sequential active positions:

| Screen | Total Dots | Active Position |
|--------|:---:|:---:|
| Screen 1 | 8 | 1 |
| Screen 2 | 8 | 2 |
| Screen 3 | 8 | 3 |
| Screen 4 | 8 | 4 |
| How It Works | 8 | 5 |
| Legal Disclaimer | 8 | 6 |
| Biometric Setup | 8 | 7 |
| Safety Net | 8 | 8 |

For each file, update the dots section to render exactly 8 `<View>` dots with the correct one marked `dotActive`. Example for Screen 1:

```tsx
<View style={styles.dotsRow}>
  <View style={[styles.dot, styles.dotActive]} />
  <View style={[styles.dot, styles.dotInactive]} />
  <View style={[styles.dot, styles.dotInactive]} />
  <View style={[styles.dot, styles.dotInactive]} />
  <View style={[styles.dot, styles.dotInactive]} />
  <View style={[styles.dot, styles.dotInactive]} />
  <View style={[styles.dot, styles.dotInactive]} />
  <View style={[styles.dot, styles.dotInactive]} />
</View>
```

Update the comments on each screen to say "position N of 8".

### Risk: Low
Visual-only change. No logic affected.

---

## Issue #3 — Category search bar not working

### Root Cause
There is **no search/filter functionality** on the category picker in `AddDocumentModal.tsx`. The only `TextInput` on the category step (lines 196–204) is the document title field, which only appears when `pendingSource === 'scan'`. It sets `scanTitle`, not a filter.

The tester likely saw this title input, interpreted it as a search field, typed a category name, and saw no filtering occur.

### Proposed Fix
**File:** `src/features/documents/AddDocumentModal.tsx`

Add a category filter input above the category list:

1. Add a `categorySearch` state variable:

```typescript
const [categorySearch, setCategorySearch] = useState('');
```

2. Reset it in the `reset()` function.

3. Filter the categories list:

```typescript
const filteredCategories = DOCUMENT_CATEGORIES.filter((cat) => {
  if (!categorySearch.trim()) return true;
  const query = categorySearch.toLowerCase();
  return (
    CATEGORY_LABELS[cat].toLowerCase().includes(query) ||
    CATEGORY_DESCRIPTIONS[cat].toLowerCase().includes(query)
  );
});
```

4. Add a search `TextInput` above the category `ScrollView` (before line 206):

```tsx
<TextInput
  style={styles.searchInput}
  placeholder="Search categories..."
  placeholderTextColor={colors.textMuted}
  value={categorySearch}
  onChangeText={setCategorySearch}
  autoCorrect={false}
  clearButtonMode="while-editing"
  accessibilityLabel="Search categories"
/>
```

5. Change line 207 from `DOCUMENT_CATEGORIES.map` to `filteredCategories.map`.

6. Add `searchInput` style (similar to `titleInput` but with a search icon or smaller padding).

7. Move the existing scan title `TextInput` (lines 195–204) so it appears clearly separated from the search, with a label like "Document Title" above it for clarity.

### Risk: Low
Additive UI change. Existing category selection logic unchanged.

---

## Issue #4 — FaceID appearing twice on app open

### Root Cause
`KeyManager.getVaultKey()` (lines 72–88) has no promise deduplication. On app launch:

1. `AppContext.refreshInit()` calls `refreshDocuments()` → `DocumentService.getAllDocuments()` → `DocumentRepository.getAllDocuments()` → `KeyManager.getVaultKey()`
2. Simultaneously, `DocumentLibraryScreen.loadDocuments()` → `DocumentService.getAllDocuments()` → `KeyManager.getVaultKey()`

Both calls find `cachedVaultKey === null` and both invoke `SecureStore.getItemAsync` with `requireAuthentication: true`, triggering **two separate FaceID prompts**.

### Proposed Fix
**File:** `src/core/auth/KeyManager.ts`

Add a pending promise variable to deduplicate concurrent calls:

```typescript
let pendingKeyPromise: Promise<Buffer> | null = null;

static async getVaultKey(): Promise<Buffer> {
  ensureAppStateListener();

  if (cachedVaultKey) return cachedVaultKey;

  if (pendingKeyPromise) return pendingKeyPromise;

  pendingKeyPromise = (async () => {
    try {
      const keyBase64 = await SecureStore.getItemAsync(VAULT_KEY_TAG, {
        requireAuthentication: true,
        authenticationPrompt: 'Unlock your After Me vault',
      });

      if (!keyBase64) {
        throw new Error('Vault Key not found. Please re-initialize.');
      }

      cachedVaultKey = Buffer.from(keyBase64, 'base64');
      return cachedVaultKey;
    } finally {
      pendingKeyPromise = null;
    }
  })();

  return pendingKeyPromise;
}
```

This ensures only one biometric prompt fires at a time. All concurrent callers share the same promise and receive the same resolved key.

Also clear `pendingKeyPromise` in the AppState listener when the app backgrounds:

```typescript
appStateSubscription = AppState.addEventListener('change', (state) => {
  if (state !== 'active') {
    cachedVaultKey = null;
    pendingKeyPromise = null;
  }
});
```

### Risk: Low
Purely additive concurrency control. All callers receive the same result they would have before — just without the duplicate prompt.

---

## Issue #5 — Extra space at top of Family Kit popup

### Root Cause
`KitCreationWizard.tsx` line 504 applies `paddingTop: insets.top` to the container inside a `presentationStyle="pageSheet"` modal:

```tsx
<Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
  <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
```

On iOS, `pageSheet` modals are presented as a sheet that does **not** extend under the status bar. The OS handles safe area internally. `insets.top` still reports the full status bar height (~50px on notched devices), so applying it as padding creates a redundant blank gap.

### Proposed Fix
**File:** `src/features/familykit/KitCreationWizard.tsx`

Remove `paddingTop: insets.top` from the container when using `pageSheet`. Keep `paddingBottom` for the home indicator:

```tsx
<View style={[styles.container, { paddingBottom: insets.bottom }]}>
```

If cross-platform support requires the top padding on Android (where `pageSheet` behaviour differs), conditionally apply it:

```tsx
<View style={[
  styles.container,
  { paddingBottom: insets.bottom },
  Platform.OS === 'android' && { paddingTop: insets.top },
]}>
```

### Risk: Low
Visual-only change. Affects modal layout on iOS. Test on both notched (iPhone 14/15) and non-notched devices.

---

## Issue #6 — Kit History & Distribution button not working

### Root Cause
In `SettingsScreen.tsx`, the button at line 588 sets `showKitHistory = true`, and the `KitHistoryScreen` component renders at lines 691–699:

```tsx
{showKitHistory && (
  <KitHistoryScreen
    onCreateKit={() => { setShowKitHistory(false); setShowKitWizard(true); }}
    onBack={() => setShowKitHistory(false)}
  />
)}
```

Unlike `VaultSwitcherScreen` (lines 712–724) and `HelpScreen` (lines 726–738), which are wrapped in `<Modal>`, `KitHistoryScreen` is rendered **inline inside a `ScrollView`**. Since `KitHistoryScreen` is a full-screen component with `flex: 1`, it collapses to zero height inside a `ScrollView` — it's invisible.

### Proposed Fix
**File:** `src/features/settings/SettingsScreen.tsx`

Wrap `KitHistoryScreen` in a `<Modal>`, matching the pattern used by VaultSwitcher and Help:

```tsx
{showKitHistory && (
  <Modal animationType="slide" presentationStyle="pageSheet">
    <View style={{ flex: 1, backgroundColor: colors.amBackground }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.amWhite }}>
          Kit History
        </Text>
        <TouchableOpacity
          onPress={() => setShowKitHistory(false)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ fontSize: 16, color: colors.amAmber }}>Done</Text>
        </TouchableOpacity>
      </View>
      <KitHistoryScreen
        onCreateKit={() => {
          setShowKitHistory(false);
          setShowKitWizard(true);
        }}
        onBack={() => setShowKitHistory(false)}
      />
    </View>
  </Modal>
)}
```

### Risk: Low
Structural change to how the component is presented. The `KitHistoryScreen` component itself is unchanged — only its container changes from inline to modal.

---

## Issue #7 — Selected filter persists after deleting document from vault

### Root Cause
When a user taps a category card on the Dashboard:
1. `VaultDashboardWithNav.handleCategoryPress` (AppNavigator line 90–93) sets `categoryFilter` and navigates to Documents tab
2. `DocumentLibraryScreen` loads documents filtered by that category

When a document is deleted (via DocumentViewerModal line 171–192 or DocumentLibraryScreen line 139–155), the flow calls `loadDocuments()` which re-fetches with the **still-active** `categoryFilter`. Nobody calls `setCategoryFilter(null)`.

If the last document in a category is deleted, the user sees an empty filtered view with the category badge still showing. They must manually tap the "X" on the filter badge to clear it.

### Proposed Fix
**File:** `src/features/documents/DocumentLibraryScreen.tsx`

After a successful deletion, check if the filtered category is now empty and clear the filter automatically:

In the `confirmDelete` handler (around line 149), after `loadDocuments()`:

```typescript
onPress: async () => {
  try {
    await DocumentService.deleteDocument(doc.id);
    const updatedDocs = categoryFilter
      ? await DocumentService.getDocumentsByCategory(categoryFilter)
      : await DocumentService.getAllDocuments();
    setDocuments(updatedDocs);
    if (categoryFilter && updatedDocs.length === 0) {
      setCategoryFilter(null);
    }
    refreshDocuments();
  } catch (e) {
    Alert.alert('Error', (e as Error).message);
  }
},
```

Similarly, in `DocumentViewerModal.tsx`, the `onDocumentUpdated` callback should trigger the same check. The simplest approach is to handle it in `loadDocuments` itself — after fetching, if the filter is active and results are empty, clear it:

```typescript
const loadDocuments = useCallback(async () => {
  setLoadError(null);
  try {
    const docs = categoryFilter
      ? await DocumentService.getDocumentsByCategory(categoryFilter)
      : await DocumentService.getAllDocuments();
    setDocuments(docs);

    if (categoryFilter && docs.length === 0) {
      setCategoryFilter(null);
    }

    refreshDocuments();
  } catch (e) {
    // ...
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [categoryFilter, refreshDocuments, setCategoryFilter]);
```

This handles both deletion paths (inline delete and viewer modal delete) since both call `loadDocuments` after deletion.

### Risk: Low
Additive logic. Existing filter behaviour unchanged when documents remain in the category. Also add try/catch to the delete handlers to surface errors.

---

## Issue #8 — Vault requires biometric even when toggle is off

### Root Cause
The biometric toggle in `SettingsScreen.tsx` (lines 78–81) only writes a preference to AsyncStorage:

```typescript
const handleBiometricToggle = async (value: boolean) => {
  setBiometricEnabled(value);
  await AsyncStorage.setItem(BIOMETRIC_PREF_KEY, String(value));
};
```

`KeyManager.getVaultKey()` (lines 77–80) **hardcodes** `requireAuthentication: true`:

```typescript
const keyBase64 = await SecureStore.getItemAsync(VAULT_KEY_TAG, {
  requireAuthentication: true,  // ← ignores user preference
  authenticationPrompt: 'Unlock your After Me vault',
});
```

The toggle is cosmetic. `KeyManager` never reads the AsyncStorage preference.

### Proposed Fix
**Files:** `src/core/auth/KeyManager.ts`, `src/features/settings/SettingsScreen.tsx`

**Step 1:** Add a method to `KeyManager` to read the biometric preference:

```typescript
const BIOMETRIC_PREF_KEY = 'afterme_biometric_enabled';

private static async isBiometricEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(BIOMETRIC_PREF_KEY);
  return val !== 'false'; // default to true
}
```

**Step 2:** Update `getVaultKey()` to respect the preference:

```typescript
static async getVaultKey(): Promise<Buffer> {
  ensureAppStateListener();
  if (cachedVaultKey) return cachedVaultKey;

  const biometricEnabled = await this.isBiometricEnabled();

  const keyBase64 = await SecureStore.getItemAsync(VAULT_KEY_TAG, {
    requireAuthentication: biometricEnabled,
    authenticationPrompt: 'Unlock your After Me vault',
  });

  if (!keyBase64) {
    throw new Error('Vault Key not found. Please re-initialize.');
  }

  cachedVaultKey = Buffer.from(keyBase64, 'base64');
  return cachedVaultKey;
}
```

**Step 3:** When the toggle is switched OFF, re-store the key without biometric requirement (and vice versa). In `SettingsScreen.tsx`, update the toggle handler:

```typescript
const handleBiometricToggle = async (value: boolean) => {
  try {
    // Read current key (will prompt biometric if currently enabled)
    const currentKey = await KeyManager.getVaultKey();

    // Delete old key entry
    await SecureStore.deleteItemAsync(VAULT_KEY_TAG);

    // Re-store with new authentication requirement
    await SecureStore.setItemAsync(VAULT_KEY_TAG, currentKey.toString('base64'), {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      requireAuthentication: value,
      authenticationPrompt: 'Unlock your After Me vault',
    });

    // Clear cache so next access uses new setting
    KeyManager.clearCache();

    setBiometricEnabled(value);
    await AsyncStorage.setItem(BIOMETRIC_PREF_KEY, String(value));
  } catch (e) {
    Alert.alert('Error', 'Could not change biometric setting. Please try again.');
  }
};
```

**Important:** The key must be retrieved BEFORE changing the setting (while biometric is still enabled), then re-stored with the new `requireAuthentication` value. This requires exposing `VAULT_KEY_TAG` and the SecureStore logic, or adding a `setBiometricProtection(enabled: boolean)` method on `KeyManager` to encapsulate this.

A cleaner approach — add to `KeyManager`:

```typescript
static async setBiometricProtection(enabled: boolean): Promise<void> {
  const key = await this.getVaultKey(); // prompts biometric if currently enabled
  await SecureStore.deleteItemAsync(VAULT_KEY_TAG);
  await SecureStore.setItemAsync(VAULT_KEY_TAG, key.toString('base64'), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    requireAuthentication: enabled,
    authenticationPrompt: 'Unlock your After Me vault',
  });
  cachedVaultKey = null; // force re-auth on next access
  await AsyncStorage.setItem(BIOMETRIC_PREF_KEY, String(enabled));
}
```

Then the Settings handler becomes:

```typescript
const handleBiometricToggle = async (value: boolean) => {
  try {
    await KeyManager.setBiometricProtection(value);
    setBiometricEnabled(value);
  } catch (e) {
    Alert.alert('Error', 'Could not change biometric setting. Please try again.');
  }
};
```

### Risk: Medium
This changes how the vault key is stored in SecureStore. Must be tested thoroughly:
- Toggle OFF → key accessed without biometric → toggle ON → biometric required again
- App restart after toggle OFF → no biometric prompt
- Background/foreground cycle after toggle OFF → no biometric prompt
- Ensure `initializeKeys()` still works correctly for new users

---

## Issue #9 — Recovery Kit files saved in binary format

### Root Cause
The `.afterme` file is a ZIP archive containing encrypted vault data. This is correct by design. However:

1. `handleShareFile` in `PersonalRecoveryWizard.tsx` (lines 79–90) shares the raw `.afterme` binary with `mimeType: 'application/zip'` and `UTI: 'public.zip-archive'`
2. iOS does not recognise `.afterme` as a registered file extension
3. The share sheet presents it as an unknown/generic binary file
4. The PDF (printable instructions with QR code) is a separate action on a different button ("Print QR Recovery Card")
5. Testers expected a human-readable file but received binary

### Proposed Fix
**File:** `src/features/recovery/PersonalRecoveryWizard.tsx`

Two changes:

**Change 1:** Improve the share UX so both the `.afterme` file AND the PDF are offered together, with clear labelling:

Replace the current two separate buttons ("Save .afterme File" and "Print QR Recovery Card") with a combined flow:

```tsx
<TouchableOpacity
  style={styles.actionCard}
  onPress={handleShareAll}
  accessibilityRole="button"
  accessibilityLabel="Save Recovery Kit"
>
  <Text style={styles.actionIcon}>💾</Text>
  <View style={styles.actionContent}>
    <Text style={styles.actionTitle}>Save Recovery Kit</Text>
    <Text style={styles.actionHint}>
      Saves encrypted vault file and printable PDF instructions
    </Text>
  </View>
</TouchableOpacity>
```

Where `handleShareAll` generates the PDF and shares both files:

```typescript
const handleShareAll = useCallback(async () => {
  if (!result) return;
  try {
    // Generate PDF alongside the .afterme file
    let qrImage: string | undefined;
    if (qrDataUri) {
      const { readAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
      const b64 = await readAsStringAsync(qrDataUri, { encoding: EncodingType.Base64 });
      qrImage = `data:image/png;base64,${b64}`;
    }
    const pdfUri = await PdfExportService.generateKitPdf({
      accessKey: result.accessKey,
      ownerName: null,
      documentCount: result.documentCount,
      kitVersion: 1,
      qrDataUri: qrImage ?? '',
    });

    // Share the .afterme file first (the essential item)
    await shareAsync(result.filePath, {
      mimeType: 'application/zip',
      UTI: 'public.zip-archive',
      dialogTitle: 'Save Recovery Kit (.afterme file)',
    });

    // Then offer the PDF
    await shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save Recovery Instructions (PDF)',
      UTI: 'com.adobe.pdf',
    });
  } catch {
    Alert.alert('Share Error', 'Could not share the recovery files.');
  }
}, [result, qrDataUri]);
```

**Change 2:** Keep "Print QR Recovery Card" as a standalone option for users who just want the printable PDF:

```tsx
<TouchableOpacity
  style={styles.actionCardSecondary}
  onPress={handlePrintPdf}
  accessibilityRole="button"
  accessibilityLabel="Print instructions only"
>
  <Text style={styles.actionIcon}>🖨️</Text>
  <View style={styles.actionContent}>
    <Text style={styles.actionTitle}>Print Instructions Only</Text>
    <Text style={styles.actionHint}>
      Printable PDF with QR code and recovery steps
    </Text>
  </View>
</TouchableOpacity>
```

**Change 3:** Add a brief explainer text above the action cards:

```tsx
<Text style={styles.explainerText}>
  Your recovery kit has two parts: an encrypted .afterme file (your vault data)
  and a PDF with your access key QR code. Save both to a secure location.
</Text>
```

### Risk: Low
UX flow change only. The underlying `.afterme` file generation and PDF generation are unchanged.

---

## Implementation Order

Recommended order based on severity, risk, and dependencies:

| Priority | Issue | Effort | Risk |
|:---:|---|---|---|
| 1 | **#4 — Double FaceID** | Small | Low |
| 2 | **#6 — Kit History button** | Small | Low |
| 3 | **#1 — Reset button position** | Small | Low |
| 4 | **#2 — Progress dots** | Small | Low |
| 5 | **#5 — Kit popup spacing** | Small | Low |
| 6 | **#7 — Stale filter** | Small | Low |
| 7 | **#3 — Category search** | Medium | Low |
| 8 | **#9 — Recovery file UX** | Medium | Low |
| 9 | **#8 — Biometric toggle** | Medium | Medium |

Issues #1–#6 are quick, isolated fixes. Issue #8 is last because it touches SecureStore key storage and requires the most thorough testing.

### Estimated Total Effort
- Quick fixes (#1, #2, #3, #4, #5, #6): ~2–3 hours
- Medium fixes (#7, #9): ~1–2 hours
- Careful fix (#8): ~2–3 hours
- Testing all fixes: ~2 hours

**Total: approximately 1 working day**

### Testing Checklist

After all fixes are applied, verify:

- [ ] Dev Reset button no longer overlaps onboarding CTAs
- [ ] Progress dots show 8 dots on every screen with correct active position
- [ ] Category search filters the list correctly; title input is clearly labelled
- [ ] FaceID appears exactly once on app open (test with multiple screens loading simultaneously)
- [ ] Family Kit creation modal has no extra space at the top on iPhone 14/15
- [ ] Kit History & Distribution opens as a full-screen modal from Settings
- [ ] Deleting the last document in a filtered category clears the filter automatically
- [ ] Biometric toggle OFF → vault accessible without FaceID
- [ ] Biometric toggle ON → vault requires FaceID again
- [ ] Biometric setting persists across app restart
- [ ] Recovery Kit "Save" flow explains both files and offers PDF alongside .afterme
- [ ] Regression: onboarding flow completes end-to-end without errors
- [ ] Regression: documents can be added, viewed, and deleted normally
- [ ] Regression: Family Kit creation still works
- [ ] Regression: iCloud backup still works (if applicable)
