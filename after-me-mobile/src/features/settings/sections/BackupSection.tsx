import React from 'react';
import { View, Text, Switch, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { settingsStyles as styles } from '../settingsStyles';

interface BackupSectionProps {
  icloudEnabled: boolean;
  icloudAvailable: boolean;
  lastBackupDate: string | null;
  backingUp: boolean;
  restoringBackup: boolean;
  onIcloudToggle: (value: boolean) => void;
  onBackupNow: () => void;
  onRestoreFromBackup: () => void;
}

export function BackupSection({
  icloudEnabled,
  icloudAvailable,
  lastBackupDate,
  backingUp,
  restoringBackup,
  onIcloudToggle,
  onBackupNow,
  onRestoreFromBackup,
}: BackupSectionProps) {
  if (Platform.OS !== 'ios') return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.4}>iCloud Backup</Text>
      <View style={styles.infoCard}>
        <View style={styles.row} accessibilityRole="switch" accessibilityState={{ checked: icloudEnabled }}>
          <Text style={styles.rowLabel} maxFontSizeMultiplier={1.4}>Auto Backup</Text>
          <Switch
            value={icloudEnabled}
            onValueChange={onIcloudToggle}
            trackColor={{ false: colors.border, true: colors.amAmber }}
            thumbColor={icloudEnabled ? colors.amBackground : colors.textMuted}
            accessibilityLabel="iCloud Auto Backup"
          />
        </View>

        {!icloudAvailable && (
          <Text style={styles.backupWarning} maxFontSizeMultiplier={1.4}>
            iCloud is not available. Make sure you&apos;re signed in to iCloud in Settings.
          </Text>
        )}

        {lastBackupDate && (
          <Text style={styles.backupDate} maxFontSizeMultiplier={1.4}>
            Last backup: {new Date(lastBackupDate).toLocaleDateString()} at{' '}
            {new Date(lastBackupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        <View style={styles.backupActions}>
          <TouchableOpacity
            style={[styles.backupActionButton, backingUp && styles.integrityButtonDisabled]}
            onPress={onBackupNow}
            disabled={backingUp || !icloudAvailable}
            accessibilityRole="button"
            accessibilityLabel="Back up now"
          >
            {backingUp ? (
              <ActivityIndicator size="small" color={colors.amAmber} />
            ) : (
              <Text style={styles.backupActionText} maxFontSizeMultiplier={1.4}>Back Up Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupActionButton, restoringBackup && styles.integrityButtonDisabled]}
            onPress={onRestoreFromBackup}
            disabled={restoringBackup || backingUp || !icloudAvailable}
            accessibilityRole="button"
            accessibilityLabel="Restore from iCloud backup"
          >
            {restoringBackup ? (
              <ActivityIndicator size="small" color={colors.amAmber} />
            ) : (
              <Text style={styles.backupActionText} maxFontSizeMultiplier={1.4}>Restore from Backup</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.rowHint} maxFontSizeMultiplier={1.4}>
          Backups are encrypted with your vault key. Apple cannot read them.
        </Text>
      </View>
    </View>
  );
}
