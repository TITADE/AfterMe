/**
 * Onboarding Screen 6: "The Safety Net"
 * Final screen after biometric setup. Three choices: iCloud backup, create kit, or defer.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Animated as RNAnimated } from 'react-native';

const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { BackupService } from '../../services/BackupService';
import { OnboardingStorage } from '../../services/OnboardingStorage';

type SafetyNetChoice = 'icloud' | 'kit' | 'defer';

interface OnboardingScreen6Props {
  onComplete: (choice: SafetyNetChoice) => Promise<void>;
}

const RING_SIZE = 80;
const RING_STROKE = 2.5;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

export function OnboardingScreen6({ onComplete }: OnboardingScreen6Props) {
  const insets = useSafeAreaInsets();
  const horizPad = 32;

  const ringTrim = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0.8)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineY = useRef(new Animated.Value(8)).current;
  const subheadOpacity = useRef(new Animated.Value(0)).current;
  const subheadY = useRef(new Animated.Value(8)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyY = useRef(new Animated.Value(8)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Y = useRef(new Animated.Value(20)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Y = useRef(new Animated.Value(20)).current;
  const deferOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ringAnim = Animated.timing(ringTrim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    });

    const checkmarkAnim = Animated.parallel([
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 2,
        bounciness: 4,
      }),
    ]);

    const headlineAnim = Animated.parallel([
      Animated.timing(headlineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headlineY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);
    const subheadAnim = Animated.parallel([
      Animated.timing(subheadOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(subheadY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);
    const bodyAnim = Animated.parallel([
      Animated.timing(bodyOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(bodyY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);

    const card1YSpring = Animated.spring(card1Y, {
      toValue: 0,
      useNativeDriver: true,
      speed: 0.5,
      bounciness: 0.8,
    });
    const card1Anim = Animated.parallel([
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(card1Opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.sequence([Animated.delay(700), card1YSpring]),
    ]);

    const card2YSpring = Animated.spring(card2Y, {
      toValue: 0,
      useNativeDriver: true,
      speed: 0.5,
      bounciness: 0.8,
    });
    const card2Anim = Animated.parallel([
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(card2Opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.sequence([Animated.delay(800), card2YSpring]),
    ]);

    const deferAnim = Animated.timing(deferOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });

    const dotsAnim = Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    });

    const hapticTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 700);

    Animated.sequence([
      ringAnim,
      Animated.delay(400),
      checkmarkAnim,
      Animated.delay(100),
      headlineAnim,
      Animated.delay(100),
      subheadAnim,
      Animated.delay(50),
      bodyAnim,
      Animated.delay(50),
      Animated.parallel([
        Animated.sequence([Animated.delay(200), card1Anim]),
        Animated.sequence([Animated.delay(250), card2Anim]),
      ]),
      Animated.sequence([Animated.delay(200), deferAnim]),
      Animated.delay(50),
      dotsAnim,
    ]).start();

    return () => clearTimeout(hapticTimer);
  }, []);

  const ringStrokeOffset = ringTrim.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_CIRCUMFERENCE, 0],
  });

  const handleChoice = async (choice: SafetyNetChoice) => {
    if (choice === 'icloud') {
      await BackupService.enableIcloudBackup();
    } else if (choice === 'defer') {
      await OnboardingStorage.setSafetyNetDeferred(true);
      await OnboardingStorage.setSafetyNetDeferredDate(new Date().toISOString());
    } else if (choice === 'kit') {
      await OnboardingStorage.setShowFamilyKitCreationImmediately(true);
    }

    await OnboardingStorage.setHasCompletedOnboarding(true);
    await onComplete(choice);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top section — completion confirmation */}
        <View style={styles.topSection}>
          <View style={styles.checkmarkWrapper}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                fill="none"
                stroke="rgba(201,150,58,0.7)"
                strokeWidth={RING_STROKE}
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={ringStrokeOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <Animated.View
              style={[
                styles.checkmarkInner,
                {
                  opacity: checkmarkOpacity,
                  transform: [{ scale: checkmarkScale }],
                },
              ]}
            >
              <Ionicons name="checkmark" size={32} color="#C9963A" />
            </Animated.View>
          </View>

          <View style={styles.headlineGap} />
          <Animated.View style={{ opacity: headlineOpacity, transform: [{ translateY: headlineY }] }}>
            <Text style={styles.headline}>You're protected.</Text>
          </Animated.View>
          <View style={styles.subheadGap} />
          <Animated.View style={{ opacity: subheadOpacity, transform: [{ translateY: subheadY }] }}>
            <Text style={styles.subhead}>Now choose your safety net.</Text>
          </Animated.View>
          <View style={styles.bodyGap} />
          <Animated.View
            style={[
              styles.bodyWrap,
              { paddingHorizontal: horizPad, opacity: bodyOpacity, transform: [{ translateY: bodyY }] },
            ]}
          >
            <Text style={styles.bodyCopy}>
              What happens to your vault if this{'\n'}phone is lost or destroyed?
            </Text>
          </Animated.View>
        </View>

        {/* Choice cards */}
        <View style={[styles.cardsSection, { paddingHorizontal: horizPad }]}>
          {/* Card 1 — iCloud backup */}
          <Animated.View
            style={{
              opacity: card1Opacity,
              transform: [{ translateY: card1Y }],
            }}
          >
            <Pressable
              onPress={() => handleChoice('icloud')}
              style={({ pressed }) => [
                styles.card,
                styles.cardRecommended,
                pressed && styles.cardPressed,
              ]}
              accessible
              accessibilityLabel="Enable iCloud backup. Recommended. Encrypted — Apple cannot read it"
              accessibilityRole="button"
            >
              <View style={styles.cardAccentBar} />
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>Recommended</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardPrimary}>Enable iCloud backup</Text>
                <Text style={styles.cardSecondary}>Encrypted — Apple cannot read it</Text>
              </View>
            </Pressable>
          </Animated.View>

          <View style={styles.cardGap} />

          {/* Card 2 — Create kit first */}
          <Animated.View
            style={{
              opacity: card2Opacity,
              transform: [{ translateY: card2Y }],
            }}
          >
            <Pressable
              onPress={() => handleChoice('kit')}
              style={({ pressed }) => [
                styles.card,
                styles.cardKit,
                pressed && styles.cardPressedKit,
              ]}
              accessible
              accessibilityLabel="Create my kit first. Print or share before leaving setup"
              accessibilityRole="button"
            >
              <View style={styles.cardContentKit}>
                <Text style={styles.cardPrimary}>Create my kit first</Text>
                <Text style={styles.cardSecondary}>Print or share before leaving setup</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* Defer option */}
        <Animated.View style={[styles.deferSection, { opacity: deferOpacity }]}>
          <Pressable
            onPress={() => handleChoice('defer')}
            style={styles.deferTouchable}
            accessible
            accessibilityLabel="Living dangerously — remind me later"
            accessibilityRole="button"
          >
            <Text style={styles.deferText}>Living dangerously — remind me later</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Progress dots — position 6 active */}
      <View style={[styles.dotsSection, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3142',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  topSection: {
    minHeight: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  checkmarkWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  checkmarkInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineGap: { height: 16 },
  headline: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    color: '#FAF9F6',
    textAlign: 'center',
  },
  subheadGap: { height: 8 },
  subhead: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    color: '#C9963A',
    textAlign: 'center',
  },
  bodyGap: { height: 10 },
  bodyWrap: {
    alignItems: 'center',
  },
  bodyCopy: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(250,249,246,0.48)',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsSection: {
    marginTop: 24,
    gap: 12,
  },
  card: {
    height: 76,
    borderRadius: 14,
    backgroundColor: '#1E2235',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  cardRecommended: {
    borderWidth: 1.5,
    borderColor: 'rgba(201,150,58,0.5)',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    borderColor: 'rgba(201,150,58,0.9)',
  },
  cardKit: {
    borderWidth: 1,
    borderColor: 'rgba(250,249,246,0.18)',
  },
  cardPressedKit: {
    transform: [{ scale: 0.98 }],
  },
  cardAccentBar: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    backgroundColor: 'rgba(201,150,58,0.7)',
    borderRadius: 1.5,
  },
  cardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(201,150,58,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontFamily: 'System',
    fontSize: 10,
    color: '#C9963A',
  },
  cardContent: {
    paddingRight: 80,
  },
  cardContentKit: {},
  cardPrimary: {
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '700',
    color: '#FAF9F6',
  },
  cardSecondary: {
    fontFamily: 'System',
    fontSize: 13,
    color: 'rgba(250,249,246,0.48)',
    marginTop: 4,
  },
  cardGap: { height: 12 },
  deferSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  deferTouchable: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deferText: {
    fontFamily: 'System',
    fontSize: 13,
    color: 'rgba(250,249,246,0.24)',
  },
  dotsSection: {
    paddingHorizontal: 32,
    paddingTop: 12,
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
