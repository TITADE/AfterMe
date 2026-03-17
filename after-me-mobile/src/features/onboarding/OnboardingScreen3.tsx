/**
 * Onboarding Screen 3: "The Vault Explained"
 * Follows Screen 2 in the onboarding flow.
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

const CATEGORIES = [
  'Will',
  'Insurance',
  'Identity',
  'Property',
  'Finance',
  'Medical',
  'Digital',
  'Personal',
];

interface OnboardingScreen3Props {
  onContinue: () => void;
}

export function OnboardingScreen3({ onContinue }: OnboardingScreen3Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const circleSize = width * 0.8;
  const circleCenterFromTop = height * 0.35;

  const circleOpacity = useRef(new Animated.Value(0)).current;
  const gridOpacity = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(CATEGORIES.map(() => new Animated.Value(0))).current;
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

    const gridAnim = Animated.timing(gridOpacity, {
      toValue: 1,
      duration: 400,
      delay: 100,
      useNativeDriver: true,
    });

    const cardStagger = Animated.stagger(
      40,
      cardAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 2,
          bounciness: 4,
        })
      )
    );

    const headlineAnim = Animated.parallel([
      Animated.timing(headlineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headlineY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);

    const bodyAnim = Animated.parallel([
      Animated.timing(bodyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(bodyY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);

    const buttonAnim = Animated.parallel([
      Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(buttonY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);

    const dotsAnim = Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });

    Animated.sequence([
      circleAnim,
      gridAnim,
      Animated.sequence([
        Animated.delay(150),
        cardStagger,
      ]),
      Animated.sequence([
        Animated.delay(50),
        headlineAnim,
      ]),
      Animated.delay(100),
      bodyAnim,
      Animated.delay(100),
      buttonAnim,
      Animated.delay(100),
      dotsAnim,
    ]).start();
  }, []);

  const renderCard = (label: string, index: number) => {
    const highlighted = label === 'Will';
    const anim = cardAnims[index];

    return (
      <Animated.View
        key={label}
        style={[
          styles.card,
          highlighted ? styles.cardHighlighted : styles.cardNormal,
          {
            opacity: anim,
            transform: [
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.cardLabel, highlighted ? styles.cardLabelHighlighted : styles.cardLabelNormal]}>
          {label}
        </Text>
        {highlighted && <View style={styles.amberDot} />}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Top section — illustration */}
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
            { opacity: circleOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.gridWrapper,
            {
              top: circleCenterFromTop - 95,
              opacity: gridOpacity,
            },
          ]}
          accessible
          accessibilityLabel="8 document categories grid"
        >
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              {CATEGORIES.slice(0, 2).map((label, i) => (
                <Animated.View key={label} style={styles.cardWrapper}>
                  {renderCard(label, i)}
                </Animated.View>
              ))}
            </View>
            <View style={styles.gridRow}>
              {CATEGORIES.slice(2, 4).map((label, i) => (
                <Animated.View key={label} style={styles.cardWrapper}>
                  {renderCard(label, i + 2)}
                </Animated.View>
              ))}
            </View>
            <View style={styles.gridRow}>
              {CATEGORIES.slice(4, 6).map((label, i) => (
                <Animated.View key={label} style={styles.cardWrapper}>
                  {renderCard(label, i + 4)}
                </Animated.View>
              ))}
            </View>
            <View style={styles.gridRow}>
              {CATEGORIES.slice(6, 8).map((label, i) => (
                <Animated.View key={label} style={styles.cardWrapper}>
                  {renderCard(label, i + 6)}
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Headline text block */}
      <View style={styles.headlineSection}>
        <Animated.View style={{ opacity: headlineOpacity, transform: [{ translateY: headlineY }] }}>
          <Text style={styles.headlineLine1} maxFontSizeMultiplier={1.5}>
            Scan your documents.
          </Text>
          <Text style={styles.headlineLine2} maxFontSizeMultiplier={1.5}>
            8 categories. Done.
          </Text>
        </Animated.View>
        <View style={styles.headlineSpacer} />
        <Animated.View style={{ opacity: bodyOpacity, transform: [{ translateY: bodyY }] }}>
          <Text style={styles.bodyCopy} maxFontSizeMultiplier={1.5}>
            Will · Insurance · Identity · Property{'\n'}
            Finance · Medical · Digital · Personal
          </Text>
          <Text style={styles.bodySecondary} maxFontSizeMultiplier={1.5}>
            Use your camera or import from Files
          </Text>
        </Animated.View>
      </View>

      <View style={styles.spacer} />

      {/* Primary CTA button */}
      <Animated.View style={[styles.buttonSection, { opacity: buttonOpacity, transform: [{ translateY: buttonY }] }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          accessible
          accessibilityLabel="Makes sense. I'll start scanning when I'm ready"
          accessibilityRole="button"
        >
          <Text style={styles.ctaLine1} maxFontSizeMultiplier={1.5}>
            Makes sense
          </Text>
          <Text style={styles.ctaLine2} maxFontSizeMultiplier={1.5}>
            I'll start scanning when I'm ready
          </Text>
        </Pressable>
      </Animated.View>

      {/* Progress dots — position 3 active */}
      <Animated.View style={[styles.dotsSection, { opacity: dotsOpacity }]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
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
  gridWrapper: {
    position: 'absolute',
    alignSelf: 'center',
  },
  gridContainer: {
    width: 200,
    height: 186,
    borderRadius: 12,
    backgroundColor: '#1E2235',
    padding: 12,
    justifyContent: 'space-between',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cardWrapper: {
    width: 44,
    height: 36,
  },
  card: {
    width: 44,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHighlighted: {
    backgroundColor: 'rgba(201,150,58,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(201,150,58,0.6)',
  },
  cardNormal: {
    backgroundColor: 'rgba(250,249,246,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(250,249,246,0.18)',
  },
  cardLabel: {
    fontSize: 9,
  },
  cardLabelHighlighted: {
    color: 'rgba(250,249,246,0.8)',
  },
  cardLabelNormal: {
    color: 'rgba(250,249,246,0.5)',
  },
  amberDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9963A',
  },
  headlineSection: {
    alignItems: 'center',
  },
  headlineLine1: {
    fontFamily: 'Georgia',
    fontSize: 26,
    fontWeight: '700',
    color: '#FAF9F6',
    textAlign: 'center',
    lineHeight: 32,
  },
  headlineLine2: {
    fontFamily: 'Georgia',
    fontSize: 26,
    fontWeight: '700',
    color: '#C9963A',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 2,
  },
  headlineSpacer: {
    height: 16,
  },
  bodyCopy: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(250,249,246,0.55)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(250,249,246,0.35)',
    textAlign: 'center',
    marginTop: 10,
  },
  spacer: {
    flex: 1,
  },
  buttonSection: {
    width: '100%',
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
    fontSize: 12,
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
