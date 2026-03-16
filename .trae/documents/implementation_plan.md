# After Me - React Native (Expo) Implementation Plan

## Phase 1: Foundation & Core Infrastructure (Weeks 1-3)

### 1.1 Expo Project Setup
- Initialize Expo SDK 50+ project with TypeScript
- Configure development environment for iOS/Android
- Set up EAS Build for cloud builds
- Configure app signing and provisioning profiles

### 1.2 Custom StoreKit Module Development
- Create native Expo module wrapper for StoreKit 2 APIs
- Implement in-app purchase flows (Personal: $79.99, Family: $149.99)
- Set up receipt validation and purchase restoration
- Test sandbox purchases and subscription management

### 1.3 Crypto Engine Implementation
- Integrate `react-native-quick-crypto` for AES-256-GCM encryption
- Implement key derivation using PBKDF2
- Create encryption/decryption service layer
- Set up secure random number generation
- Implement file integrity verification (checksums)

### 1.4 Security Foundation
- Configure `expo-secure-store` for keychain/keystore access
- Implement biometric authentication with `expo-local-authentication`
- Set up Android biometric fallback (fingerprint/pattern/PIN)
- Create secure key storage and retrieval mechanisms
- Implement key rotation and backup strategies

## Phase 2: Document Ingestion (Weeks 4-6)

### 2.1 Document Scanner Integration
- Integrate `react-native-document-scanner-plugin`
- Configure VisionKit (iOS) and MLKit (Android) backends
- Implement edge detection and perspective correction
- Add auto-crop and image enhancement features
- Create scanning UI with real-time preview

### 2.2 File System Management
- Set up `expo-file-system` for encrypted blob storage
- Implement document categorization (8 predefined categories)
- Create metadata storage in `expo-sqlite`
- Build document import/export pipeline
- Implement thumbnail generation and caching

### 2.3 Document Processing Pipeline
- Create document validation and format detection
- Implement PDF generation for Family Kit exports
- Add image compression and optimization
- Build document viewer with zoom and annotation
- Create search and filtering capabilities

## Phase 3: Vault UI & User Experience (Weeks 7-9)

### 3.1 Navigation Architecture
- Implement React Navigation with stack and tab navigators
- Create welcome flow with "Planning Legacy" vs "Have Kit" paths
- Build vault dashboard with document category cards
- Set up settings screen with biometric configuration
- Implement survivor import flow

### 3.2 UI Component Development
- Create design system with warm slate/amber color palette
- Build reusable card components for document categories
- Implement progress indicators and completion rings
- Create alert system for "Keep It Current" notifications
- Build modal components for scanner and sharing

### 3.3 State Management
- Set up React Context for app-wide state
- Implement document and vault state management
- Create authentication and security state handlers
- Build purchase and subscription state tracking
- Implement offline-first data synchronization

## Phase 4: Family Kit & Sharing (Weeks 10-12)

### 4.1 Family Kit Generation
- Implement `.afterme` file format creation
- Build QR code generation for access keys
- Create PDF generation for print instructions
- Implement Share Sheet integration for digital sharing
- Add kit versioning and compatibility checks

### 4.2 QR Code System
- Generate QR codes containing decryption keys
- Implement QR code scanning for kit import
- Create backup QR code generation for Recovery Kit
- Build QR code validation and error handling
- Test cross-device QR code compatibility

### 4.3 Sharing & Export Features
- Implement iOS Share Sheet integration
- Configure Android sharing intents
- Create email/SMS sharing workflows
- Build print-ready PDF generation
- Implement file attachment handling

## Phase 5: Onboarding & System Backup (Weeks 13-15)

### 5.1 Mandatory Safety Net Onboarding
- Create "Choose Your Safety Net" onboarding step
- Implement "Enable System Backup" vs "Create Kit Now" decision flow
- Build persistent dashboard warnings for incomplete setup
- Create emergency state handling for "No Family Kit"
- Implement user education screens

### 5.2 System Backup Implementation
- Build Share Sheet-based backup system
- Create `.afterme` file export functionality
- Implement import via Share Sheet on new devices
- Add backup verification and integrity checks
- Build restoration workflow with biometric setup

### 5.3 Recovery Kit Features
- Create personal Recovery Kit generation
- Implement device restoration via QR code scan
- Build vault export/import functionality
- Add restoration validation and error handling
- Create restoration success/failure flows

## Phase 6: Testing & Polish (Weeks 16-18)

### 6.1 Cross-Platform Testing
- Test on iOS devices (iPhone 12+ recommended)
- Test on Android devices (Pixel series baseline)
- Verify biometric authentication across devices
- Test Share Sheet functionality on both platforms
- Validate QR code scanning compatibility

### 6.2 Security Testing
- Conduct penetration testing on encryption
- Verify key storage security on both platforms
- Test biometric fallback scenarios
- Validate zero-knowledge architecture compliance
- Perform data integrity and corruption testing

### 6.3 Performance Optimization
- Optimize image processing and compression
- Improve app startup and navigation performance
- Reduce memory usage for large document libraries
- Optimize encryption/decryption performance
- Implement lazy loading for document thumbnails

## Phase 7: Launch Preparation (Weeks 19-20)

### 7.1 App Store Preparation
- Create App Store screenshots and metadata
- Write app description emphasizing privacy and ownership
- Prepare privacy policy and terms of service
- Set up app store analytics and crash reporting
- Configure app store pricing and availability

### 7.2 Documentation & Support
- Create user onboarding tutorials
- Write technical documentation for open-source decoder
- Prepare FAQ and support materials
- Create video tutorials for key features
- Set up customer support channels

### 7.3 Launch Strategy
- Plan soft launch with beta testers
- Coordinate with estate planning professionals
- Prepare marketing materials emphasizing privacy
- Set up social media presence
- Plan post-launch feature updates

## Key Technical Considerations

### Android-Specific Requirements
- Handle runtime permissions for camera and storage
- Implement Android biometric fallback (fingerprint/pattern/PIN)
- Test across various Android manufacturers and OS versions
- Optimize for Android's file system differences
- Handle Android-specific Share Sheet behaviors

### Cross-Platform Compatibility
- Ensure consistent encryption across iOS/Android
- Maintain QR code compatibility between platforms
- Test biometric authentication variations
- Verify Share Sheet behavior consistency
- Validate document format compatibility

### Security & Privacy
- Maintain zero-knowledge architecture across platforms
- Ensure encryption keys never leave device secure storage
- Implement proper key rotation and backup strategies
- Validate biometric authentication security
- Test for potential data leakage scenarios

### Performance Targets
- App startup: < 2 seconds on modern devices
- Document scanning: < 3 seconds per page
- Encryption/decryption: < 1 second per document
- QR code generation: < 500ms
- Share Sheet presentation: < 1 second