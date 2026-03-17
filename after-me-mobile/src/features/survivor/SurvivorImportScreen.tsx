import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface SurvivorImportScreenProps {
  onBack?: () => void;
}

/**
 * Phase 4: QR code scan and Family Kit import.
 * Placeholder for now - core flow in Phase 4.
 */
export function SurvivorImportScreen({ onBack }: SurvivorImportScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>I Have a Legacy Kit</Text>
      <Text style={styles.subtitle}>
        Point your camera at the QR code from the Family Kit
      </Text>

      {onBack && (
        <Pressable
          onPress={onBack}
          style={[styles.backButton, { top: insets.top + 12 }]}
          collapsable={false}
          hitSlop={16}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.amWhite,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 12,
    zIndex: 9999,
  },
  backText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.amAmber,
  },
});
