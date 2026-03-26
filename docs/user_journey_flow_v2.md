# After Me — user journey & routes (Updated for UX Rework)

This document reflects the **updated app navigation and UX copy** in `after-me-mobile` following the UI/UX Rework for accessibility, clarity, and trust.

---

## 1. Cold start → first meaningful screen

```mermaid
flowchart TD
  A[App launch] --> B{AppContext init done?}
  B -->|no| L[Loading screen]
  B -->|yes| C{hasCompletedOnboarding?}
  C -->|no| D{showSurvivorFlow?}
  D -->|yes| S[SurvivorImportScreen]
  D -->|no| E{onboardingStep}
  E -->|welcome| W[WelcomeScreen]
  E -->|onboarding1–6, howItWorks, legalDisclaimer| O[OnboardingScreen N]
  C -->|yes| M[Main app: Tab navigator]
```

---

## 2. Welcome — three entry paths (Updated Copy)

The Welcome screen has been updated for extreme clarity, removing marketing jargon.

```mermaid
flowchart LR
  W[WelcomeScreen]
  W -->|Start My Legacy Vault| P[Onboarding 1]
  W -->|I need to open a Family Vault| K[SurvivorImport mode kit]
  W -->|Restore My Vault| R[SurvivorImport mode restore]
  K -->|Back| W
  R -->|Back| W
  K -->|import success| I[refreshInit → may land in main app]
  R -->|import success| I
```

---

## 3. “Start My Legacy Vault” — linear onboarding

```mermaid
flowchart LR
  O1[1 Values] --> O2[2 Trusted contacts]
  O2 --> O3[3 Documents]
  O3 --> O4[4 Categories]
  O4 --> HI[How it works]
  HI --> LD[Legal disclaimer]
  LD --> O5[5 Biometrics]
  O5 --> O6[6 Safety net]
```

---

## 4. Onboarding 6 — safety net outcomes

```mermaid
flowchart TD
  S6[Onboarding 6] --> A[Enable cloud backup]
  S6 --> B[Create Family Kit now]
  S6 --> C[I'll set this up later]
  A --> D[Mark onboarding complete → Main app]
  B --> D
  B --> E[Flag: show kit wizard soon when docs exist]
  C --> D
```

---

## 5. Survivor / import flow (With Contextual Help)

This flow now includes a specific Help branch for users struggling to find the `.afterme` file in the iOS file system.

```mermaid
flowchart TD
  SW[Sub-flow welcome copy] --> SC[Scan QR]
  SC --> ME[Manual key entry]
  SC --> SF[Select backup file]
  ME --> SF
  SF -->|Need help finding file?| H[Help Modal: iOS Files Guide]
  H --> SF
  SF --> IM[Importing]
  IM --> VI[Vault intro]
  VI --> DONE[onImportComplete → refreshInit]
```

---

## 6. Main app — bottom tabs

```mermaid
flowchart TB
  subgraph Tabs[Bottom tabs]
    V[Vault dashboard]
    D[Documents]
    F[Family Kit]
    ST[Settings]
  end
  M[Main stack] --> Tabs
```

---

## 7. Dynamic Progress & Tiers (New UX Logic)

The Vault Dashboard and Document Library now dynamically alter their UI based on the user's subscription tier to maintain honesty and prevent bait-and-switch friction.

*   **Free Tier:** Dashboard target is `5`. UI shows "X of 5 essential documents". Empty states act as direct buttons to add documents.
*   **Premium Tier:** Dashboard target expands to `24`. UI shows "X of 24 key documents". 
