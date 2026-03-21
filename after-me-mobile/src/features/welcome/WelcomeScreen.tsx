import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BrandLogo } from '../../components/BrandLogo';
import { colors } from '../../theme/colors';

interface WelcomeScreenProps {
  onPlanningLegacy: () => void;
  onHaveKit: () => void;
  onRestoreVault?: () => void;
}

export function WelcomeScreen({ onPlanningLegacy, onHaveKit, onRestoreVault }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.radialCircle} />
      <View style={styles.content}>
        <BrandLogo size="large" variant="dark" />
        <Text style={styles.tagline}>Your legacy. Their peace of mind.</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onPlanningLegacy}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="I'm Planning My Legacy — Create your secure vault"
        >
          <Text style={styles.primaryButtonText}>I&apos;m Planning My Legacy</Text>
          <Text style={styles.primaryButtonHint}>Create your secure vault</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onHaveKit}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="I Have a Legacy Kit — Open a shared vault with QR code"
        >
          <Text style={styles.secondaryButtonText}>I Have a Legacy Kit</Text>
          <Text style={styles.secondaryButtonHint}>Open a shared vault with QR code</Text>
        </TouchableOpacity>

        {onRestoreVault && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={onRestoreVault}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Restore My Vault — Recover from a Personal Recovery Kit"
          >
            <Text style={styles.restoreButtonText}>Restore My Vault</Text>
            <Text style={styles.restoreButtonHint}>Recover from a Personal Recovery Kit</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footer}>Your documents never leave this device</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
    padding: 24,
    justifyContent: 'space-between',
  },
  radialCircle: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.amDeep,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    fontSize: 17,
    color: colors.amWhite,
    opacity: 0.45,
    marginTop: 12,
  },
  buttons: {
    gap: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.amAmber,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.amBackground,
  },
  primaryButtonHint: {
    fontSize: 14,
    color: 'rgba(45,49,66,0.85)',
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(250,249,246,0.4)',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.amWhite,
  },
  secondaryButtonHint: {
    fontSize: 14,
    color: 'rgba(250,249,246,0.7)',
    marginTop: 4,
  },
  restoreButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250,249,246,0.2)',
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.amWhite,
    opacity: 0.7,
  },
  restoreButtonHint: {
    fontSize: 13,
    color: 'rgba(250,249,246,0.4)',
    marginTop: 3,
  },
  footer: {
    fontSize: 11,
    color: colors.amWhite,
    opacity: 0.2,
    marginTop: 8,
    textAlign: 'center',
  },
});
