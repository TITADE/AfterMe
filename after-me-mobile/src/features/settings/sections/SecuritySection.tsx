import React from 'react';
import { View, Text, Switch } from 'react-native';
import { colors } from '../../../theme/colors';
import { settingsStyles as styles } from '../settingsStyles';

interface SecuritySectionProps {
  biometricEnabled: boolean;
  onBiometricToggle: (value: boolean) => void;
}

export function SecuritySection({ biometricEnabled, onBiometricToggle }: SecuritySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.4}>Security</Text>

      <View style={styles.row} accessibilityRole="switch" accessibilityState={{ checked: biometricEnabled }}>
        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.4}>Biometric Lock</Text>
        <Switch
          value={biometricEnabled}
          onValueChange={onBiometricToggle}
          trackColor={{ false: colors.border, true: colors.amAmber }}
          thumbColor={biometricEnabled ? colors.amBackground : colors.textMuted}
          accessibilityLabel="Biometric Lock"
        />
      </View>

      <Text style={styles.rowHint} maxFontSizeMultiplier={1.4}>
        {biometricEnabled
          ? 'Face ID / Touch ID required to access your vault'
          : 'Biometric lock is disabled — vault access uses device passcode only'}
      </Text>
    </View>
  );
}
