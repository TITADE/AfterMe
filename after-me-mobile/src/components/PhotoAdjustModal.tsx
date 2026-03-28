import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import { colors } from '../theme/colors';

interface PhotoAdjustModalProps {
  visible: boolean;
  uri: string;
  onCancel: () => void;
  /** Called with the final image URI (may be a new file after edits). */
  onConfirm: (finalUri: string) => void;
}

export function PhotoAdjustModal({ visible, uri, onCancel, onConfirm }: PhotoAdjustModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [workingUri, setWorkingUri] = useState(uri);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setWorkingUri(uri);
  }, [visible, uri]);

  const run = useCallback(async (actions: Parameters<typeof manipulateAsync>[1]) => {
    setBusy(true);
    try {
      const result = await manipulateAsync(workingUri, actions, {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });
      setWorkingUri(result.uri);
    } finally {
      setBusy(false);
    }
  }, [workingUri]);

  const previewHeight = Math.min(height * 0.55, 520);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title} maxFontSizeMultiplier={3.0}>
          Adjust photo
        </Text>
        <Text style={styles.hint} maxFontSizeMultiplier={3.0}>
          Rotate or flip using the buttons below. They stay visible on any background.
        </Text>

        <View style={[styles.previewWrap, { height: previewHeight, maxWidth: width - 32 }]}>
          <Image
            source={{ uri: workingUri }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Photo preview"
          />
          {busy && (
            <View style={styles.busyOverlay}>
              <ActivityIndicator size="large" color={colors.amAmber} />
            </View>
          )}
        </View>

        <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => void run([{ rotate: -90 }])}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Rotate left"
            >
              <Text style={styles.toolBtnText} maxFontSizeMultiplier={3.0}>Rotate left</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => void run([{ rotate: 90 }])}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Rotate right"
            >
              <Text style={styles.toolBtnText} maxFontSizeMultiplier={3.0}>Rotate right</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => void run([{ flip: FlipType.Horizontal }])}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Flip horizontally"
            >
              <Text style={styles.toolBtnText} maxFontSizeMultiplier={3.0}>Flip horizontal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => void run([{ flip: FlipType.Vertical }])}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Flip vertically"
            >
              <Text style={styles.toolBtnText} maxFontSizeMultiplier={3.0}>Flip vertical</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              style={[styles.toolBtn, styles.cancelOutline]}
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText} maxFontSizeMultiplier={3.0}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, styles.primaryBtn]}
              onPress={() => onConfirm(workingUri)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Use this photo"
            >
              <Text style={styles.primaryText} maxFontSizeMultiplier={3.0}>Use photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.amBackground,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.amWhite,
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  previewWrap: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: colors.amCard,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    backgroundColor: 'rgba(30,34,53,0.98)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: 'rgba(250,249,246,0.12)',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  toolBtnText: {
    color: '#FAF9F6',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(250,249,246,0.35)',
  },
  cancelText: {
    color: 'rgba(250,249,246,0.85)',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: colors.amAmber,
  },
  primaryText: {
    color: colors.amBackground,
    fontSize: 16,
    fontWeight: '700',
  },
});
