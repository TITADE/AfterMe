/**
 * Onboarding Screen 5: Placeholder
 * Shown after OnboardingScreen4 CTA tap. To be designed per spec.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OnboardingScreen5Props {
  onContinue: () => void;
}

export function OnboardingScreen5({ onContinue }: OnboardingScreen5Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.placeholder}>Onboarding Screen 5</Text>
      <Text style={styles.hint}>Placeholder — to be designed</Text>
      <Pressable onPress={onContinue} style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3142',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FAF9F6',
    marginBottom: 8,
  },
  hint: {
    fontSize: 16,
    color: 'rgba(250,249,246,0.6)',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#C9963A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3142',
  },
});
