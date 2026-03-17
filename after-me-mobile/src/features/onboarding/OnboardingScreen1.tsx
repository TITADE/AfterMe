/**
 * Onboarding Screen 1: "The Honest Opener"
 * First screen after tapping "I'm Planning My Legacy" on the welcome screen.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface OnboardingScreen1Props {
  onContinue: () => void;
}

export function OnboardingScreen1({ onContinue }: OnboardingScreen1Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const circleSize = width * 0.8;
  const circleCenterFromTop = height * 0.35;

  const circleOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineY = useRef(new Animated.Value(12)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyY = useRef(new Animated.Value(8)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(12)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const circleAnim = Animated.timing(circleOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    });

    const iconAnim = Animated.spring(iconScale, {
      toValue: 1,
      delay: 100,
      useNativeDriver: true,
      speed: 2,
      bounciness: 4,
    });

    const headlineAnim = Animated.parallel([
      Animated.timing(headlineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(headlineY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    const bodyAnim = Animated.parallel([
      Animated.timing(bodyOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(bodyY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    const buttonAnim = Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    const dotsAnim = Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });

    Animated.sequence([
      circleAnim,
      Animated.parallel([
        iconAnim,
        Animated.sequence([
          Animated.delay(100),
          headlineAnim,
        ]),
      ]),
      Animated.delay(100),
      bodyAnim,
      Animated.delay(50),
      buttonAnim,
      Animated.delay(100),
      dotsAnim,
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top section — illustration area (upper 45%) */}
      <View style={[styles.illustrationSection, { height: '45%' }]}>
        <Animated.View
          style={[
            styles.circle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              top: circleCenterFromTop - circleSize / 2,
            },
            {
              opacity: circleOpacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              top: circleCenterFromTop - 36,
              opacity: circleOpacity,
              transform: [{ scale: iconScale }],
            },
          ]}
          accessible
          accessibilityLabel="Thought bubble illustration"
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={72}
            color="rgba(250,249,246,0.85)"
          />
        </Animated.View>
      </View>

      {/* Headline text block */}
      <View style={styles.headlineSection}>
        <Animated.View style={{ opacity: headlineOpacity, transform: [{ translateY: headlineY }] }}>
          <Text style={styles.headlineLine1} maxFontSizeMultiplier={1.5}>
            We need to talk
          </Text>
          <Text style={styles.headlineLine2} maxFontSizeMultiplier={1.5}>
            about something.
          </Text>
        </Animated.View>
        <View style={styles.headlineSpacer} />
        <Animated.View style={{ opacity: bodyOpacity, transform: [{ translateY: bodyY }] }}>
          <Text style={styles.bodyCopy} maxFontSizeMultiplier={1.5}>
            "If something happened to you today, could your{'\n'}family find everything they needed?"
          </Text>
        </Animated.View>
      </View>

      {/* Middle breathing space — flex spacer */}
      <View style={styles.spacer} />

      {/* Primary CTA button */}
      <Animated.View style={[styles.buttonSection, { opacity: buttonOpacity, transform: [{ translateY: buttonY }] }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
          accessible
          accessibilityLabel="Begin setup, takes approximately 20 minutes"
          accessibilityRole="button"
        >
          <Text style={styles.ctaLine1} maxFontSizeMultiplier={1.5}>
            Let's fix that
          </Text>
          <Text style={styles.ctaLine2} maxFontSizeMultiplier={1.5}>
            It takes 20 minutes
          </Text>
        </Pressable>
      </Animated.View>

      {/* Progress dots */}
      <Animated.View style={[styles.dotsSection, { opacity: dotsOpacity }]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3142',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#252840',
    alignSelf: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineSection: {
    alignItems: 'center',
  },
  headlineLine1: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '700',
    color: '#FAF9F6',
    textAlign: 'center',
    lineHeight: 34,
  },
  headlineLine2: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '700',
    color: '#C9963A',
    textAlign: 'center',
    lineHeight: 34,
    marginTop: 2,
  },
  headlineSpacer: {
    height: 16,
  },
  bodyCopy: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(250,249,246,0.52)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 0,
  },
  spacer: {
    flex: 1,
  },
  buttonSection: {
    width: '100%',
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  ctaButton: {
    width: '100%',
    height: 58,
    borderRadius: 14,
    backgroundColor: '#C9963A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonPressed: {
    opacity: 0.9,
  },
  ctaLine1: {
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3142',
  },
  ctaLine2: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(45,49,66,0.65)',
    marginTop: 2,
  },
  dotsSection: {
    paddingBottom: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#C9963A',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(250,249,246,0.22)',
  },
});
