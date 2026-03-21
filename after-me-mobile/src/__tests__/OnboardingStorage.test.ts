import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingStorage } from '../services/OnboardingStorage';

describe('OnboardingStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('hasCompletedOnboarding', () => {
    it('returns false by default', async () => {
      expect(await OnboardingStorage.hasCompletedOnboarding()).toBe(false);
    });

    it('returns true after setting', async () => {
      await OnboardingStorage.setHasCompletedOnboarding(true);
      expect(await OnboardingStorage.hasCompletedOnboarding()).toBe(true);
    });

    it('returns false after unsetting', async () => {
      await OnboardingStorage.setHasCompletedOnboarding(true);
      await OnboardingStorage.setHasCompletedOnboarding(false);
      expect(await OnboardingStorage.hasCompletedOnboarding()).toBe(false);
    });
  });

  describe('isSafetyNetDeferred', () => {
    it('returns false by default', async () => {
      expect(await OnboardingStorage.isSafetyNetDeferred()).toBe(false);
    });

    it('roundtrips correctly', async () => {
      await OnboardingStorage.setSafetyNetDeferred(true);
      expect(await OnboardingStorage.isSafetyNetDeferred()).toBe(true);
    });
  });

  describe('icloud backup preference', () => {
    it('returns false by default', async () => {
      expect(await OnboardingStorage.isIcloudBackupEnabled()).toBe(false);
    });

    it('roundtrips correctly', async () => {
      await OnboardingStorage.setIcloudBackupEnabled(true);
      expect(await OnboardingStorage.isIcloudBackupEnabled()).toBe(true);
    });
  });

  describe('safety net deferred date', () => {
    it('returns null by default', async () => {
      expect(await OnboardingStorage.getSafetyNetDeferredDate()).toBeNull();
    });

    it('stores and retrieves date string', async () => {
      const date = '2025-06-15T10:00:00.000Z';
      await OnboardingStorage.setSafetyNetDeferredDate(date);
      expect(await OnboardingStorage.getSafetyNetDeferredDate()).toBe(date);
    });
  });

  describe('showFamilyKitCreationImmediately', () => {
    it('returns false by default', async () => {
      expect(await OnboardingStorage.getShowFamilyKitCreationImmediately()).toBe(false);
    });

    it('roundtrips correctly', async () => {
      await OnboardingStorage.setShowFamilyKitCreationImmediately(true);
      expect(await OnboardingStorage.getShowFamilyKitCreationImmediately()).toBe(true);
    });

    it('clears correctly', async () => {
      await OnboardingStorage.setShowFamilyKitCreationImmediately(true);
      await OnboardingStorage.clearShowFamilyKitCreationImmediately();
      expect(await OnboardingStorage.getShowFamilyKitCreationImmediately()).toBe(false);
    });
  });

  describe('resetOnboarding', () => {
    it('clears all onboarding state', async () => {
      await OnboardingStorage.setHasCompletedOnboarding(true);
      await OnboardingStorage.setSafetyNetDeferred(true);
      await OnboardingStorage.setIcloudBackupEnabled(true);
      await OnboardingStorage.setShowFamilyKitCreationImmediately(true);

      await OnboardingStorage.resetOnboarding();

      expect(await OnboardingStorage.hasCompletedOnboarding()).toBe(false);
      expect(await OnboardingStorage.isSafetyNetDeferred()).toBe(false);
      expect(await OnboardingStorage.isIcloudBackupEnabled()).toBe(false);
      expect(await OnboardingStorage.getShowFamilyKitCreationImmediately()).toBe(false);
    });
  });
});
