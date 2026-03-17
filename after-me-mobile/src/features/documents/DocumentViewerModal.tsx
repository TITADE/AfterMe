import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { DocumentService } from '../../services/DocumentService';
import type { Document } from '../../models/Document';
import { CATEGORY_LABELS } from '../../models/DocumentCategory';
import { colors } from '../../theme/colors';

interface DocumentViewerModalProps {
  document: Document;
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function DocumentViewerModal({ document, visible, onClose }: DocumentViewerModalProps) {
  const [contentUri, setContentUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !document) return;

    let cancelled = false;
    setLoading(true);
    setContentUri(null);

    DocumentService.getDocumentContent(document)
      .then((buf) => {
        if (cancelled) return;
        if (document.format !== 'pdf') {
          setContentUri(`data:image/${document.format};base64,${buf.toString('base64')}`);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, document?.id]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {document.title}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.amAmber} />
              <Text style={styles.loadingText}>Decrypting...</Text>
            </View>
          ) : document.format === 'pdf' ? (
            <View style={styles.pdfPlaceholder}>
              <Text style={styles.pdfIcon}>📄</Text>
              <Text style={styles.pdfTitle}>{document.title}</Text>
              <Text style={styles.pdfHint}>
                PDF viewing will be enhanced in a future update.
              </Text>
              <Text style={styles.pdfHint}>Document is stored securely in your vault.</Text>
            </View>
          ) : contentUri ? (
            <Image
              source={{ uri: contentUri }}
              style={[styles.image, { width: SCREEN_WIDTH - 32 }]}
              resizeMode="contain"
            />
          ) : null}

          <View style={styles.metadata}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{CATEGORY_LABELS[document.category]}</Text>

            <Text style={styles.metaLabel}>Document Date</Text>
            <Text style={styles.metaValue}>{formatDate(document.documentDate)}</Text>

            <Text style={styles.metaLabel}>Expiry Date</Text>
            <Text style={[styles.metaValue, document.expiryDate && styles.expiryHighlight]}>
              {formatDate(document.expiryDate)}
            </Text>

            {document.providerName && (
              <>
                <Text style={styles.metaLabel}>Provider/Issuer</Text>
                <Text style={styles.metaValue}>{document.providerName}</Text>
              </>
            )}

            {document.locationOfOriginal && (
              <>
                <Text style={styles.metaLabel}>Location of Original</Text>
                <Text style={styles.metaValue}>{document.locationOfOriginal}</Text>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.amBackground,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  closeText: {
    fontSize: 17,
    color: colors.amAmber,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.amWhite,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loading: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textMuted,
  },
  image: {
    height: SCREEN_WIDTH * 1.3,
    borderRadius: 8,
    backgroundColor: colors.amDeep,
  },
  pdfPlaceholder: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.amCard,
    borderRadius: 12,
    marginBottom: 24,
  },
  pdfIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  pdfTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.amWhite,
    marginBottom: 8,
  },
  pdfHint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  metadata: {
    backgroundColor: colors.amCard,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    color: colors.amWhite,
  },
  expiryHighlight: {
    color: colors.amAmber,
    fontWeight: '500',
  },
});
