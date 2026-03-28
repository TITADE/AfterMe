# Android / Cross-Platform Critical Fixes — Implementation Plan

This document tracks the prioritized plan for addressing vault reliability, layout, and document UX issues identified in QA. Implementation proceeds in order; each tier should be verified before moving on.

---

## Tier 0 — Unblock core flows

| Order | Item | Status |
|------|------|--------|
| 1 | Vault key + `AppState` — avoid clearing cached key on transient background (pickers, short interruptions) | Done — `VaultKeyStore`: key cleared only after returning to `active` if background duration ≥ 45s |
| 2 | SQLite / `prepareAsync` — clearer errors, defensive `getDb` handling, optional dev logging | Done — `DocumentRepository.getDb`: try/catch, `__DEV__` warn, user-facing `Error` message |

## Tier 1 — Data integrity & trust

| Order | Item | Status |
|------|------|--------|
| 3 | Remove spurious `categoryFilter` clear when filtered query returns zero rows | Done — removed auto `setCategoryFilter(null)` in `DocumentLibraryScreen.loadDocuments` |
| 4 | Re-test document list / refresh after Tier 0–1 | Pending device QA |

## Tier 2 — Layout & upload UX

| Order | Item | Status |
|------|------|--------|
| 5 | Safe area insets for bottom tab bar and main document screen headers (Android) | Done — `MainTabs`: `tabBarStyle` padding with `useSafeAreaInsets`; `VaultDashboardScreen` + `DocumentLibraryScreen`: `SafeAreaView` / `edges` from `react-native-safe-area-context` |
| 6 | Top safe area for `DocumentViewerModal` header (Edit / Done) | Done — header `paddingTop: max(insets.top, 12)` |
| 7 | Pre-select category in `AddDocumentModal` when opened from a filtered category view | Done — `initialCategory` prop; Files/Photos skip category step when set; Scan pre-selects category |

## Tier 3 — Polish

| Order | Item | Status |
|------|------|--------|
| 8 | Image rotate/flip after pick (visible controls; no invisible native crop on dark images) | Done — `allowsEditing: false` on photo picker; `PhotoAdjustModal` + `expo-image-manipulator` before import |
| 9 | Date validation — ISO YYYY-MM-DD on save | Done — `dateValidation.ts`; `DocumentViewerModal.handleSave` + `DocumentService.updateDocument`; tests in `dateValidation.test.ts` and `DocumentService.test.ts` |

---

## Verification notes

After each change: run `npm run lint` in `after-me-mobile`, and `npx tsc --noEmit` if configured. Targeted Jest: `npx jest src/__tests__/dateValidation.test.ts src/__tests__/DocumentService.test.ts` (after Tier 3 date/import changes). Device testing remains required for biometrics, SQLite, safe areas, and photo adjust flow.

---

## Changelog

- **2026-03-28:** Plan created; Tier 0–2 implementation started.
- **2026-03-28:** Tier 0–2 implemented. Verification: `npx tsc --noEmit` (pass). `npm run lint` (pre-existing warnings/errors in other files). Device testing required for biometrics, SQLite NPE, and layout on physical Android.
- **2026-03-28:** Tier 3: `PhotoAdjustModal`, `dateValidation` + save guards; `npx tsc --noEmit` (pass); Jest `dateValidation` + `DocumentService` suites (pass).

## Files touched (implementation)

- `after-me-mobile/src/core/auth/VaultKeyStore.ts`
- `after-me-mobile/src/db/DocumentRepository.ts`
- `after-me-mobile/src/features/documents/DocumentLibraryScreen.tsx`
- `after-me-mobile/src/features/documents/AddDocumentModal.tsx`
- `after-me-mobile/src/features/documents/DocumentViewerModal.tsx`
- `after-me-mobile/src/components/PhotoAdjustModal.tsx`
- `after-me-mobile/src/utils/dateValidation.ts`
- `after-me-mobile/src/services/DocumentService.ts`
- `after-me-mobile/src/__tests__/dateValidation.test.ts`
- `after-me-mobile/src/navigation/AppNavigator.tsx`
- `after-me-mobile/src/features/dashboard/VaultDashboardScreen.tsx`
