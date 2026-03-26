import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { FreshnessLevel } from '../../../services/KitHistoryService';
import { colors } from '../../../theme/colors';
import { settingsStyles as styles } from '../settingsStyles';

interface FamilyKitSectionProps {
  kitFreshness: FreshnessLevel | null;
  kitWarning: string | null;
  onCreateKit: () => void;
  onViewHistory: () => void;
}

export function FamilyKitSection({
  kitFreshness,
  kitWarning,
  onCreateKit,
  onViewHistory,
}: FamilyKitSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={3.0}>Family Kit</Text>

      {kitWarning && (
        <View style={[styles.kitWarningCard, {
          borderColor: kitFreshness === 'critical' ? colors.amDanger :
                       kitFreshness === 'stale' ? '#FF9500' : colors.amAmber,
        }]}>
          <Text style={styles.kitWarningText} maxFontSizeMultiplier={3.0}>{kitWarning}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.kitButton}
        onPress={onCreateKit}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create Family Kit"
        accessibilityHint="Opens the Family Kit creation wizard"
      >
        <Text style={styles.kitButtonIcon}>📦</Text>
        <View style={styles.kitButtonContent}>
          <Text style={styles.kitButtonText} maxFontSizeMultiplier={3.0}>Create Family Kit</Text>
          <Text style={styles.kitButtonHint} maxFontSizeMultiplier={3.0}>
            Generate encrypted vault package with QR access key
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.kitButton}
        onPress={onViewHistory}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Kit History"
        accessibilityHint="View past kit versions and distribution log"
      >
        <Text style={styles.kitButtonIcon}>📋</Text>
        <View style={styles.kitButtonContent}>
          <Text style={styles.kitButtonText} maxFontSizeMultiplier={3.0}>Kit History & Distribution</Text>
          <Text style={styles.kitButtonHint} maxFontSizeMultiplier={3.0}>
            View versions, freshness status, and sharing log
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
