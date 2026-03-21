import { StyleSheet, Platform } from 'react-native';

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3142',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  ctaText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3142',
  },
  headline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontWeight: '700',
    color: '#FAF9F6',
    textAlign: 'center',
    lineHeight: 34,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: '#C9963A',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  subhead: {
    fontSize: 15,
    color: 'rgba(250,249,246,0.6)',
    lineHeight: 23,
    marginBottom: 8,
  },
});
