/**
 * Onboarding state persistence — survives app restarts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  SAFETY_NET_DEFERRED: 'safetyNetDeferred',
  SAFETY_NET_DEFERRED_DATE: 'safetyNetDeferredDate',
  SAFETY_NET_ICLOUD_ENABLED: 'safetyNetIcloudEnabled',
  SHOW_FAMILY_KIT_CREATION_IMMEDIATELY: 'showFamilyKitCreationImmediately',
} as const;

export const OnboardingStorage = {
  async hasCompletedOnboarding(): Promise<boolean> {
    const v = await AsyncStorage.getItem(KEYS.HAS_COMPLETED_ONBOARDING);
    return v === 'true';
  },

  async setHasCompletedOnboarding(value: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.HAS_COMPLETED_ONBOARDING, value ? 'true' : 'false');
  },

  async isSafetyNetDeferred(): Promise<boolean> {
    const v = await AsyncStorage.getItem(KEYS.SAFETY_NET_DEFERRED);
    return v === 'true';
  },

  async setSafetyNetDeferred(value: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.SAFETY_NET_DEFERRED, value ? 'true' : 'false');
  },

  async getSafetyNetDeferredDate(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SAFETY_NET_DEFERRED_DATE);
  },

  async setSafetyNetDeferredDate(value: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SAFETY_NET_DEFERRED_DATE, value);
  },

  async isIcloudBackupEnabled(): Promise<boolean> {
    const v = await AsyncStorage.getItem(KEYS.SAFETY_NET_ICLOUD_ENABLED);
    return v === 'true';
  },

  async setIcloudBackupEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.SAFETY_NET_ICLOUD_ENABLED, value ? 'true' : 'false');
  },

  async getShowFamilyKitCreationImmediately(): Promise<boolean> {
    const v = await AsyncStorage.getItem(KEYS.SHOW_FAMILY_KIT_CREATION_IMMEDIATELY);
    return v === 'true';
  },

  async setShowFamilyKitCreationImmediately(value: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.SHOW_FAMILY_KIT_CREATION_IMMEDIATELY, value ? 'true' : 'false');
  },

  async clearShowFamilyKitCreationImmediately(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SHOW_FAMILY_KIT_CREATION_IMMEDIATELY);
  },

  /** Clears all onboarding state — use for dev reset to see onboarding again */
  async resetOnboarding(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.HAS_COMPLETED_ONBOARDING),
      AsyncStorage.removeItem(KEYS.SAFETY_NET_DEFERRED),
      AsyncStorage.removeItem(KEYS.SAFETY_NET_DEFERRED_DATE),
      AsyncStorage.removeItem(KEYS.SAFETY_NET_ICLOUD_ENABLED),
      AsyncStorage.removeItem(KEYS.SHOW_FAMILY_KIT_CREATION_IMMEDIATELY),
    ]);
  },
};
