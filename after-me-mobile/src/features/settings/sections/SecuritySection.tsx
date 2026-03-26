import React from 'react';
import { View, Text, Switch, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { settingsStyles as styles } from '../settingsStyles';

interface SecuritySectionProps {
  biometricEnabled: boolean;
  onBiometricToggle: (value: boolean) => void;
}

export function SecuritySection({ biometricEnabled, onBiometricToggle }: SecuritySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={3.0}>Security</Text>

      <View style={styles.row} accessibilityRole="switch" accessibilityState={{ checked: biometricEnabled }}>
        <Text style={styles.rowLabel} maxFontSizeMultiplier={3.0}>Biometric Lock</Text>
        <Switch
          value={biometricEnabled}
          onValueChange={onBiometricToggle}
          trackColor={{ false: colors.border, true: colors.amAmber }}
          thumbColor={biometricEnabled ? colors.amBackground : colors.textMuted}
          accessibilityLabel="Biometric Lock"
        />
      </View>

      <Text style={styles.rowHint} maxFontSizeMultiplier={3.0}>
        {biometricEnabled
          ? Platform.OS === 'ios'
            ? 'Face ID / Touch ID required to access your vault'
            : 'Fingerprint or face unlock required to access your vault'
          : 'Biometric lock is disabled — vault access uses device PIN or password only'}
      </Text>
    </View>
  );
}
