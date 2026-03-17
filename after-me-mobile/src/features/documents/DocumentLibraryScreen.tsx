import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { DocumentService } from '../../services/DocumentService';
import { useApp } from '../../context/AppContext';
import type { Document } from '../../models/Document';
import { colors } from '../../theme/colors';
import { CATEGORY_LABELS } from '../../models/DocumentCategory';
import { AddDocumentModal } from './AddDocumentModal';
import { DocumentViewerModal } from './DocumentViewerModal';

export function DocumentLibraryScreen() {
  const { categoryFilter, setCategoryFilter, refreshDocuments } = useApp();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);

  const loadDocuments = async () => {
    try {
      const docs = categoryFilter
        ? await DocumentService.getDocumentsByCategory(categoryFilter)
        : await DocumentService.getAllDocuments();
      setDocuments(docs);
      refreshDocuments();
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [categoryFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.docCard}
      onPress={() => setViewerDoc(item)}
      activeOpacity={0.7}
    >
      <View style={styles.docThumbnail}>
        <DocumentThumbnail doc={item} />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.docCategory}>{CATEGORY_LABELS[item.category]}</Text>
        {item.expiryDate && (
          <Text style={styles.docExpiry}>Expires: {formatDate(item.expiryDate)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Document Library</Text>
          {categoryFilter && (
            <TouchableOpacity
              onPress={() => setCategoryFilter(null)}
              style={styles.filterBadge}
            >
              <Text style={styles.filterBadgeText}>
                {CATEGORY_LABELS[categoryFilter]} ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          {documents.length} document{documents.length !== 1 ? 's' : ''}
          {categoryFilter ? ` in ${CATEGORY_LABELS[categoryFilter]}` : ' in vault'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.amAmber} />
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptyHint}>
            Tap the button below to scan or import your first document
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderDocumentItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amAmber} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddDocumentModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onDocumentAdded={loadDocuments}
      />

      {viewerDoc && (
        <DocumentViewerModal
          document={viewerDoc}
          visible={!!viewerDoc}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Placeholder thumbnail - does not decrypt to avoid repeated biometric prompts
 * when scrolling the document list. Full content loads on tap in DocumentViewerModal.
 */
function DocumentThumbnail({ doc }: { doc: Document }) {
  return (
    <View style={styles.thumbnailPlaceholder}>
      <Text style={styles.thumbnailIcon}>{doc.format === 'pdf' ? '📄' : '🖼️'}</Text>
      <Text style={styles.thumbnailFormat}>{doc.format.toUpperCase()}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  filterBadge: {
    backgroundColor: colors.amCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  filterBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.amWhite,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.amWhite,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  docCard: {
    flexDirection: 'row',
    backgroundColor: colors.amCard,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  docThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: colors.amDeep,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.amDeep,
  },
  thumbnailIcon: {
    fontSize: 24,
  },
  thumbnailFormat: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  pdfPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.amDeep,
  },
  pdfIcon: {
    fontSize: 24,
  },
  pdfLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  docInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amWhite,
  },
  docCategory: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  docExpiry: {
    fontSize: 12,
    color: colors.amAmber,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.amWhite,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amAmber,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: colors.amBackground,
    fontWeight: '300',
    lineHeight: 36,
  },
});
