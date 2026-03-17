import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { KeyManager } from '../../core/auth/KeyManager';
import { OnboardingStorage } from '../../services/OnboardingStorage';
import { useApp } from '../../context/AppContext';
import { colors } from '../../theme/colors';

export function SettingsScreen() {
  const { refreshInit, setShowPhase1 } = useApp();
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleResetVault = () => {
    Alert.alert(
      'Reset Vault & Onboarding',
      'This will clear keys and onboarding state. You will see the full onboarding flow again. Encrypted documents will become unreadable.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await OnboardingStorage.resetOnboarding();
              await KeyManager.resetKeys();
              await refreshInit();
              // refreshInit sets hasCompletedOnboarding=false → AppNavigator shows onboarding
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Biometric Lock</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: colors.border, true: colors.amAmber }}
            thumbColor={biometricEnabled ? colors.amBackground : colors.textMuted}
          />
        </View>

        <Text style={styles.rowHint}>
          Face ID / Touch ID required to access your vault
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encryption</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>AES-256-GCM</Text>
          <Text style={styles.infoText}>
            All documents are encrypted with keys stored in device secure storage
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>
        <TouchableOpacity
          style={styles.devRow}
          onPress={() => setShowPhase1(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.devRowText}>Phase 1 Verification</Text>
          <Text style={styles.devRowHint}>Run core systems check</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleResetVault}
          disabled={loading}
        >
          <Text style={styles.dangerButtonText}>Reset Vault & Onboarding</Text>
          <Text style={styles.dangerButtonHint}>Shows full onboarding flow again</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.amCard,
    padding: 16,
    borderRadius: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.amWhite,
  },
  rowHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: colors.amCard,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amWhite,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  dangerButton: {
    backgroundColor: colors.amCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.amDanger,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amDanger,
  },
  dangerButtonHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  devRow: {
    backgroundColor: colors.amCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  devRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amWhite,
  },
  devRowHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
});
