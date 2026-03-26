import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { settingsStyles as styles } from '../settingsStyles';

interface DeveloperSectionProps {
  loading: boolean;
  onShowPhase1: () => void;
  onSeedTestDocuments: () => void;
  onResetVault: () => void;
}

export function DeveloperSection({
  loading,
  onShowPhase1,
  onSeedTestDocuments,
  onResetVault,
}: DeveloperSectionProps) {
  if (!__DEV__) return null;

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={3.0}>Developer</Text>
        <TouchableOpacity
          style={styles.devRow}
          onPress={onShowPhase1}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Phase 1 Verification"
          accessibilityHint="Run core systems check"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Phase 1 Verification</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>Run core systems check</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.devRow, { marginTop: 8 }]}
          onPress={onSeedTestDocuments}
          disabled={loading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Seed test documents"
        >
          <Text style={styles.devRowText} maxFontSizeMultiplier={3.0}>Seed Test Documents</Text>
          <Text style={styles.devRowHint} maxFontSizeMultiplier={3.0}>Add 6 placeholder docs for UAT testing</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={3.0}>Danger Zone</Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={onResetVault}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Reset vault and onboarding"
          accessibilityHint="Clears all keys and encrypted data"
        >
          <Text style={styles.dangerButtonText} maxFontSizeMultiplier={3.0}>Reset Vault & Onboarding</Text>
          <Text style={styles.dangerButtonHint} maxFontSizeMultiplier={3.0}>Shows full onboarding flow again</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
