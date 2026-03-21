import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { VAULT_STORAGE_CAP_PERSONAL_BYTES } from '../../../constants/storage';
import { settingsStyles as styles } from '../settingsStyles';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

interface VaultSectionProps {
  vaultSizeBytes: number;
  totalDocuments: number;
  integrityLoading: boolean;
  corruptedIds: string[] | null;
  onCheckIntegrity: () => void;
  onOpenVaultSwitcher: () => void;
  onOpenRecoveryWizard: () => void;
}

export function VaultSection({
  vaultSizeBytes,
  totalDocuments,
  integrityLoading,
  corruptedIds,
  onCheckIntegrity,
  onOpenVaultSwitcher,
  onOpenRecoveryWizard,
}: VaultSectionProps) {
  const usagePercent =
    VAULT_STORAGE_CAP_PERSONAL_BYTES > 0
      ? (vaultSizeBytes / VAULT_STORAGE_CAP_PERSONAL_BYTES) * 100
      : 0;
  const isOver80Percent = usagePercent >= 80;

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.4}>Encryption</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle} maxFontSizeMultiplier={1.4}>AES-256-GCM</Text>
          <Text style={styles.infoText} maxFontSizeMultiplier={1.4}>
            All documents are encrypted with keys stored in device secure storage
            (iOS Secure Enclave / Android Keystore).
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.4}>Vault Information</Text>
        <View style={styles.storageCard}>
          <Text style={styles.storageLabel} maxFontSizeMultiplier={1.4}>
            Storage: {formatBytes(vaultSizeBytes)} of {formatBytes(VAULT_STORAGE_CAP_PERSONAL_BYTES)}
          </Text>
          <View style={styles.progressTrack} accessibilityLabel={`Storage ${Math.round(usagePercent)}% used`}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: isOver80Percent ? colors.amDanger : colors.amAmber,
                },
              ]}
            />
          </View>
          <Text style={styles.storageHint} maxFontSizeMultiplier={1.4}>
            {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} stored
          </Text>

          {isOver80Percent && (
            <Text style={styles.storageWarning} maxFontSizeMultiplier={1.4}>
              Vault is over 80% full. Consider deleting unused documents to free space.
            </Text>
          )}

          <View style={styles.vaultInfoGrid}>
            <View style={styles.vaultInfoItem}>
              <Text style={styles.vaultInfoLabel} maxFontSizeMultiplier={1.4}>Encryption</Text>
              <Text style={styles.vaultInfoValue} maxFontSizeMultiplier={1.4}>AES-256-GCM</Text>
            </View>
            <View style={styles.vaultInfoItem}>
              <Text style={styles.vaultInfoLabel} maxFontSizeMultiplier={1.4}>Key Derivation</Text>
              <Text style={styles.vaultInfoValue} maxFontSizeMultiplier={1.4}>PBKDF2-SHA256</Text>
            </View>
            <View style={styles.vaultInfoItem}>
              <Text style={styles.vaultInfoLabel} maxFontSizeMultiplier={1.4}>Key Storage</Text>
              <Text style={styles.vaultInfoValue} maxFontSizeMultiplier={1.4}>
                {Platform.OS === 'ios' ? 'Secure Enclave' : 'Android Keystore'}
              </Text>
            </View>
            <View style={styles.vaultInfoItem}>
              <Text style={styles.vaultInfoLabel} maxFontSizeMultiplier={1.4}>Metadata</Text>
              <Text style={styles.vaultInfoValue} maxFontSizeMultiplier={1.4}>Encrypted at rest</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.integrityButton, integrityLoading && styles.integrityButtonDisabled]}
            onPress={onCheckIntegrity}
            disabled={integrityLoading}
            accessibilityRole="button"
            accessibilityLabel="Check document integrity"
            accessibilityHint="Scans all documents for corruption"
          >
            {integrityLoading ? (
              <ActivityIndicator size="small" color={colors.amAmber} />
            ) : (
              <Text style={styles.integrityButtonText} maxFontSizeMultiplier={1.4}>Check Integrity</Text>
            )}
          </TouchableOpacity>

          {corruptedIds !== null && corruptedIds.length > 0 && (
            <Text style={styles.corruptedHint} maxFontSizeMultiplier={1.4}>
              {corruptedIds.length} corrupted document(s) found
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.4}>Personal Recovery</Text>
        <TouchableOpacity
          style={styles.kitButton}
          onPress={onOpenRecoveryWizard}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Create Personal Recovery Kit"
          accessibilityHint="Generate an encrypted backup for device loss recovery"
        >
          <Text style={styles.kitButtonIcon}>🛡️</Text>
          <View style={styles.kitButtonContent}>
            <Text style={styles.kitButtonText} maxFontSizeMultiplier={1.4}>Personal Recovery Kit</Text>
            <Text style={styles.kitButtonHint} maxFontSizeMultiplier={1.4}>
              Encrypted backup for your own device loss recovery
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.4}>Manage Vaults</Text>
        <TouchableOpacity
          style={styles.kitButton}
          onPress={onOpenVaultSwitcher}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Manage vaults"
        >
          <Text style={styles.kitButtonIcon}>🗂️</Text>
          <View style={styles.kitButtonContent}>
            <Text style={styles.kitButtonText} maxFontSizeMultiplier={1.4}>Vault Manager</Text>
            <Text style={styles.kitButtonHint} maxFontSizeMultiplier={1.4}>
              Create and switch between multiple vaults
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
}
