# After Me - iOS Implementation Plan

## Phase 1: Foundation & Security Core
**Priority: CRITICAL - Must be completed first**

### Core Tasks
1. **Finalize .afterme Format Specification** (BLOCKING)
   - Document complete file structure and encryption scheme
   - Publish format spec at https://afterme.app/format-spec
   - Create open-source decoder reference implementation
   - This MUST be completed before any encryption code is written

2. **Secure Enclave Key Lifecycle Definition**
   - Define key creation, rotation, and backup procedures
   - Implement Secure Enclave key generation with biometric binding
   - Create key backup to CloudKit Keychain for device migration
   - Build key rotation mechanism for security updates
   - Document key recovery procedures for estate scenarios

3. **Project Setup & Architecture**
   - Initialize SwiftUI project with iOS 17+ target
   - Configure MVVM architecture with Combine
   - Set up SwiftData/CoreData persistence layer
   - Implement biometric authentication framework

4. **Security Foundation**
   - Implement CryptoKit AES-256-GCM encryption engine
   - Integrate Secure Enclave for key storage (primary)
   - Implement Keychain fallback for older devices
   - Create key derivation flow (PBKDF2)
   - Build encryption/decryption service layer

5. **Biometric Fallback Logic**
   - Define Face ID/Touch ID failure handling (5+ attempts)
   - Implement estate access procedures for incapacitated users
   - Create emergency access protocols with trusted contacts
   - Build fallback authentication pathways
   - Document biometric failure scenarios and recovery

6. **Versioned Migration Strategy**
   - Design schema versioning system for v1.0 → v1.1+ updates
   - Implement encrypted vault migration procedures
   - Create backup and rollback mechanisms
   - Build version compatibility checks
   - Document migration failure recovery protocols

7. **Legal & Privacy Foundation**
   - Draft privacy policy for GDPR compliance
   - Create terms of service for app usage
   - Design legal disclaimer screen content
   - Document data handling procedures for App Store review
   - Engage solicitor for legal document review

### Primary Frameworks
- **CryptoKit**: AES-256-GCM encryption
- **LocalAuthentication**: Biometric authentication
- **SwiftData/CoreData**: Local persistence
- **SwiftUI**: UI framework
- **Combine**: Reactive programming

### Deliverables
- Working encryption/decryption pipeline
- Secure Enclave key lifecycle system
- Biometric authentication with fallback logic
- Versioned migration strategy
- Legal foundation documents
- Basic SwiftData schema for vault structure

---

## Phase 2: Ingestion & Local Storage
**Priority: HIGH - Core functionality**

### Core Tasks
1. **Document Scanning System**
   - Implement VisionKit document scanner
   - Add edge detection and auto-crop functionality
   - Build perspective correction and image enhancement
   - Create scanning UI with real-time preview
   - Handle VisionKit edge cases (glare, skew, low light, torn documents)
   - Implement multi-page document scanning

2. **Import Methods**
   - Implement drag & drop from other iOS apps
   - Add Files app integration
   - Build Photo Library import
   - Create import validation and file type checking
   - Handle corrupted/partial import scenarios
   - Build import failure recovery mechanisms

3. **Storage Limits & Validation**
   - Define maximum single document size (50MB)
   - Set total vault storage cap (5GB personal, 25GB family)
   - Implement storage usage tracking and warnings
   - Create storage limit enforcement with graceful degradation
   - Build storage optimization suggestions

4. **Local Storage System**
   - Build encrypted file storage using FileManager
   - Implement document metadata handling
   - Create thumbnail generation system
   - Add document categorization (8 categories)
   - Implement file integrity validation
   - Build corruption detection and recovery

5. **Document Management**
   - Build document viewer with PDFKit
   - Implement document metadata editing
   - Add expiry date tracking system
   - Create "Keep It Current" alert system
   - Handle document version conflicts

### Primary Frameworks
- **VisionKit**: Document scanning
- **PDFKit**: Document viewing
- **FileManager**: Encrypted file storage
- **SwiftData**: Document metadata persistence

### Deliverables
- Robust document scanner with edge case handling
- Multiple import methods with corruption recovery
- Defined storage limits and enforcement
- Encrypted local storage with integrity validation
- Document categorization and management UI

---

## Phase 3: The Vault & UI/UX
**Priority: HIGH - User-facing core**

### Core Tasks
1. **Explicit Category Definitions**
   - Define 8 core categories: Identity, Property, Finance, Health, Legal, Digital, Insurance, Personal
   - Create category descriptions and examples
   - Implement category-specific document templates
   - Build category completeness scoring system
   - Design category icons and visual identity

2. **Vault Dashboard**
   - Build main dashboard with 8 category cards
   - Implement progress rings for each category completeness
   - Create document count displays per category
   - Add "Keep It Current" alert cards
   - Design overall vault completeness score

3. **Document Library**
   - Build 2-column document grid
   - Implement search and filtering
   - Add long-press context menus
   - Create document detail views
   - Build document version history

4. **Empty State Design**
   - Design empty state for new user vault
   - Create category-specific empty states
   - Build progressive disclosure for first-time users
   - Implement guided document addition flows
   - Design empty state illustrations and copy

5. **Accessibility Audit**
   - Implement Dynamic Type support (larger text sizes)
   - Add VoiceOver labels for all interactive elements
   - Ensure minimum 44pt tap targets for 45-65 demographic
   - Test color contrast ratios for visual impairment
   - Implement accessibility shortcuts and gestures

6. **UI/UX Implementation**
   - Apply Warm Slate (#2D3142) primary color
   - Implement Warm Amber-Gold (#C9963A) accent
   - Use New York font for headings
   - Apply SF Pro for body text
   - Create card-based layout with generous spacing

7. **Settings & Authentication**
   - Build settings screen with biometric options
   - Implement FaceID/TouchID configuration
   - Add encryption status display
   - Create vault information screen

### Primary Frameworks
- **SwiftUI**: Complete UI implementation
- **SF Symbols**: Icon system
- **New York/SF Pro**: Typography system

### Deliverables
- Explicit 8-category system with definitions
- Complete vault dashboard with progress rings
- Document library with comprehensive search
- Empty state designs for all screens
- Accessibility audit compliance
- Full visual design system implemented

---

## Phase 4: The Family Kit & Export
**Priority: HIGH - Core value proposition**

### Core Tasks
1. **Family Kit Generation**
   - Build one-tap kit creation wizard
   - Implement .afterme file generation
   - Create QR code generation for access key
   - Add kit validation and testing
   - Implement kit versioning system

2. **Kit Versioning & Stale Kit Warnings**
   - Track kit generation timestamp and document versions
   - Implement "Your kit is outdated" notifications
   - Build kit freshness scoring system
   - Create re-engagement prompts for kit updates
   - Design version comparison UI

3. **Open-Format README.txt Generation**
   - Generate human-readable README.txt inside every kit
   - Include "This file can be opened without After Me app" disclaimer
   - Provide step-by-step access instructions
   - List kit contents and categories
   - Include emergency contact information

4. **Survivor Onboarding Flow**
   - Design "I Have a Legacy Kit" first-time experience
   - Create emotionally-sensitive onboarding for grieving users
   - Implement QR code scanning for kit access
   - Build gentle introduction to vault contents
   - Provide support resources and guidance

5. **Export & Sharing**
   - Implement "Print Everything" PDF generation
   - Build iOS Share Sheet integration
   - Create separate "Key Card" image generation
   - Add export validation and confirmation
   - Generate printer-friendly formats

6. **QR Code Durability Testing**
   - Test QR codes at minimum printable sizes
   - Validate scanning after photocopying
   - Test on aged/yellowed paper conditions
   - Verify low-light scanning performance
   - Ensure scanning by emotionally distressed users

7. **Kit Distribution**
   - Build print workflow with instructions
   - Implement digital sharing options
   - Create kit verification system
   - Add kit history tracking
   - Design kit storage recommendations

### Primary Frameworks
- **CoreImage**: QR code generation
- **PDFKit**: PDF generation for printing
- **UIActivityViewController**: iOS Share Sheet
- **CryptoKit**: .afterme file encryption

### Deliverables
- Working Family Kit generation with versioning
- Stale kit warning system
- Open-format README.txt in every kit
- Complete survivor onboarding flow
- QR code durability validated
- Print and digital sharing options

---

## Phase 5: Onboarding, CloudKit & Monetization
**Priority: CRITICAL - Revenue and safety critical**

### Core Tasks
1. **Encrypted CloudKit Backup (MOVED FROM PHASE 6)**
   - Implement opt-in iCloud backup with encryption
   - Build encrypted CloudKit sync for vault data
   - Create backup status tracking and notifications
   - Add restore from backup functionality
   - Ensure backup encryption keys never leave device
   - **CRITICAL: Must be functional for Phase 5 Safety Net onboarding**

2. **Mandatory Safety Net Onboarding**
   - Implement "Amber Step" - forced safety net choice
   - Create onboarding flow with iCloud/Kit options (REQUIRES WORKING CLOUDKIT)
   - Build persistent warning system
   - Add completion tracking
   - Ensure safety net choice is functional at launch - **CloudKit backup must work**

3. **Legal Disclaimer Onboarding Screen**
   - Create "After Me is not a substitute for professional legal or financial advice" screen
   - Implement mandatory acceptance before app usage
   - Design sensitive content warnings
   - Include privacy and data usage explanations
   - Ensure App Store compliance for sensitive content

4. **StoreKit Integration - FIXED PRICING**
   - Register App Store Connect product IDs immediately:
     - `com.afterme.lifetime.personal` - $79.99 - One vault, unlimited docs
     - `com.afterme.lifetime.family` - $149.99 - Up to 5 vaults
   - Implement 10-document free tier limit
   - Build paywall at 11th document attempt
   - Create Family Kit creation paywall
   - Add proper pricing display (fix [objectObject] bug)

5. **Purchase Flow**
   - Build purchase screens with value messaging
   - Implement StoreKit 2 for in-app purchases
   - Add purchase validation and receipt handling
   - Create upgrade path from Personal to Family
   - Implement family sharing for Family plan

6. **TestFlight Beta Programme**
   - Recruit 20-30 target demographic users (45-65)
   - Create beta testing onboarding and feedback system
   - Implement usage analytics (privacy-safe, no document content)
   - Build beta user communication channels
   - Conduct survivor flow testing with real users

7. **App Store Submission Preparation**
   - Create App Store screenshots for all device sizes
   - Produce preview video demonstrating core features
   - Complete App Store privacy nutrition label (biometric data, death documents)
   - Add biometric usage strings (`NSFaceIDUsageDescription`)
   - Prepare data collection declarations for App Review
   - Review against Apple's sensitive content guidelines
   - **Budget 2 weeks for App Review back-and-forth iteration**

### Primary Frameworks
- **StoreKit**: In-app purchases
- **SwiftUI**: Purchase UI
- **UserDefaults**: Purchase tracking

### Deliverables
- Working encrypted CloudKit backup system
- Complete onboarding with functional safety net
- Fixed StoreKit integration with proper product IDs
- Legal disclaimer onboarding screen
- TestFlight beta programme launched
- App Store submission materials ready

---

## Phase 6: Polish, Recovery & Launch Readiness
**Priority: HIGH - Final launch preparation**

### Core Tasks
1. **Personal Recovery Kit System**
   - Build personal Recovery Kit generation for device loss
   - Implement QR code-based restoration
   - Create recovery workflow UI
   - Add device migration support
   - Design kit storage recommendations

2. **Crash Reporting & Analytics**
   - Implement privacy-safe crash reporting (Sentry with PII stripping)
   - Add usage analytics that never touch document content
   - Create performance monitoring for encryption operations
   - Build error telemetry for vault operations
   - Ensure zero document content in telemetry

3. **Final App Store Review & Submission**
   - Conduct pre-submission review against Apple guidelines
   - Test sensitive content compliance (death, biometric data)
   - Verify privacy policy and legal disclaimer adequacy
   - Submit app for App Store review
   - Prepare for Apple review iteration cycles

4. **Press Kit & Launch Assets**
   - Create press kit with app description and screenshots
   - Prepare launch website content
   - Design social media launch materials
   - Create user guide and help documentation
   - Prepare launch email campaigns

5. **Solicitor Partnership Outreach**
   - Identify and contact estate planning solicitors
   - Create partnership program materials
   - Design solicitor onboarding process
   - Build professional referral system
   - Create solicitor-specific app documentation

6. **Multi-Device Support**
   - Implement vault switching for Family plan
   - Build vault creation/management UI
   - Add multi-vault navigation
   - Create vault usage statistics
   - Design vault sharing workflows

### Primary Frameworks
- **CloudKit**: Encrypted backup sync
- **Vision**: QR code scanning for recovery
- **SwiftData**: Multi-vault data management

### Deliverables
- Personal Recovery Kit system
- Privacy-safe crash reporting and analytics
- App Store submission and review completion
- Launch-ready press kit and assets
- Solicitor partnership program
- Multi-device vault management

---

## Implementation Timeline

**Phase 1**: 4-5 weeks (Foundation with Secure Enclave lifecycle)
**Phase 2**: 3-4 weeks (Ingestion with edge cases and limits)
**Phase 3**: 3-4 weeks (Vault UI with accessibility and empty states)
**Phase 4**: 3-4 weeks (Family Kit with versioning and survivor flow)
**Phase 5**: 4-5 weeks (Onboarding with CloudKit, fixed pricing, beta testing)
**Phase 6**: 3-4 weeks (Launch readiness with App Store submission)

**Total Estimated Timeline**: 
- **Optimistic (full focus)**: 17-19 weeks to App Store submission
- **Realistic (part-time/interruptions)**: 22-26 weeks to submission
- **Add 2-3 weeks for Apple review and iteration**
- **Add 2-week buffer for sensitive content App Review (biometric + death docs)**

## Critical Dependencies

1. **.afterme Format Specification** must be finalized before Phase 1 encryption work
2. **StoreKit Setup** required for Phase 5 monetization
3. **CloudKit Container** setup needed for Phase 6 backup
4. **App Store Connect** configuration for testing purchases

## Testing Strategy

- Unit tests for encryption/decryption
- Integration tests for document scanning
- UI tests for critical flows
- Security audit of key storage
- Performance testing with large documents
- Family Kit end-to-end testing