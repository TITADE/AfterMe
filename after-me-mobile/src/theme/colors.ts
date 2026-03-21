/**
 * After Me — Global Dark Slate palette.
 * Every screen uses this palette. No hardcoded hex values elsewhere.
 */
export const colors = {
  // Semantic tokens (single source of truth)
  amBackground: '#2D3142',  // every screen bg
  amDeep: '#252840',        // circle illustrations
  amCard: '#1E2235',        // every card and row
  amAmber: '#C9963A',       // primary action / accent
  amWhite: '#FAF9F6',       // all text
  amDanger: '#E24B4A',     // destructive only

  // Aliases for migration — map to dark palette
  primary: '#2D3142',
  accent: '#C9963A',
  background: '#2D3142',
  surface: '#1E2235',
  surfaceMuted: '#252840',
  text: '#FAF9F6',
  textMuted: 'rgba(250,249,246,0.6)',
  textSecondary: 'rgba(250,249,246,0.55)',
  border: 'rgba(250,249,246,0.18)',
  borderAccent: 'rgba(201,150,58,0.4)',
  success: '#34C759',
  warning: '#C9963A',
  error: '#E24B4A',
  overlay: 'rgba(0,0,0,0.5)',
} as const;
