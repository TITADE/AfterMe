import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_LABELS,
  type DocumentCategory,
} from '../../models/DocumentCategory';
import { colors } from '../../theme/colors';

const TARGET_DOCS_PER_CATEGORY = 3;

function CategoryCard({
  category,
  count,
  onPress,
}: {
  category: DocumentCategory;
  count: number;
  onPress: () => void;
}) {
  const progress = Math.min(count / TARGET_DOCS_PER_CATEGORY, 1);
  const isComplete = progress >= 1;

  return (
    <TouchableOpacity style={styles.categoryCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: isComplete ? colors.success : colors.accent,
              },
            ]}
          />
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      </View>
      <Text style={styles.categoryName}>{CATEGORY_LABELS[category]}</Text>
      <Text style={styles.categoryHint}>
        {count} of {TARGET_DOCS_PER_CATEGORY} key documents
      </Text>
    </TouchableOpacity>
  );
}

export function VaultDashboardScreen({
  onCategoryPress,
  onDocumentsPress,
}: {
  onCategoryPress: (category: DocumentCategory) => void;
  onDocumentsPress: () => void;
}) {
  const {
    documentCountByCategory,
    totalDocuments,
    expiringSoonCount,
    refreshDocuments,
    hasSafetyNet,
    safetyNetDeferred,
    showFamilyKitCreationImmediately,
    dismissFamilyKitCreationPrompt,
  } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);
  const [familyKitModalVisible, setFamilyKitModalVisible] = React.useState(false);

  useEffect(() => {
    if (showFamilyKitCreationImmediately) {
      setFamilyKitModalVisible(true);
    }
  }, [showFamilyKitCreationImmediately]);

  const handleCloseFamilyKitModal = async () => {
    setFamilyKitModalVisible(false);
    await dismissFamilyKitCreationPrompt();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDocuments();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {!hasSafetyNet && (
        <View
          style={[
            styles.safetyNetBanner,
            safetyNetDeferred && styles.safetyNetBannerDeferred,
          ]}
        >
          <Text style={styles.safetyNetTitle}>
            {safetyNetDeferred
              ? "You chose to remind me later — set up your safety net"
              : "No safety net yet"}
          </Text>
          <Text style={styles.safetyNetText}>
            {safetyNetDeferred
              ? "Create a Family Kit or enable iCloud backup to protect your vault"
              : "Create a Family Kit or enable backup to protect your vault"}
          </Text>
        </View>
      )}

      {/* Family Kit creation sheet — opens automatically when arriving from Screen6 "Create my kit first" */}
      <Modal
        visible={familyKitModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.familyKitModal}>
          <View style={styles.familyKitModalContent}>
            <Text style={styles.familyKitModalTitle}>Create your Family Kit</Text>
            <Text style={styles.familyKitModalBody}>
              Print or share your Family Kit QR code so someone you trust can access your vault if needed.
            </Text>
            <Pressable
              style={styles.familyKitModalButton}
              onPress={handleCloseFamilyKitModal}
            >
              <Text style={styles.familyKitModalButtonText}>Maybe later</Text>
            </Pressable>
            <Pressable
              style={[styles.familyKitModalButton, styles.familyKitModalButtonPrimary]}
              onPress={handleCloseFamilyKitModal}
            >
              <Text style={styles.familyKitModalButtonTextPrimary}>
                Create Family Kit
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {expiringSoonCount > 0 && (
        <View style={styles.expiryBanner}>
          <Text style={styles.expiryTitle}>Keep It Current</Text>
          <Text style={styles.expiryText}>
            {expiringSoonCount} document{expiringSoonCount > 1 ? 's' : ''} need attention
          </Text>
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Your Vault</Text>
        <Text style={styles.summaryCount}>{totalDocuments} documents</Text>
      </View>

      <View style={styles.categoryGrid}>
        {DOCUMENT_CATEGORIES.map((cat) => (
          <CategoryCard
            key={cat}
            category={cat}
            count={documentCountByCategory[cat] ?? 0}
            onPress={() => onCategoryPress(cat)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.viewAllButton} onPress={onDocumentsPress} activeOpacity={0.8}>
        <Text style={styles.viewAllText}>View All Documents</Text>
        <Text style={styles.viewAllHint}>Open Document Library</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  safetyNetBanner: {
    backgroundColor: colors.amAmber,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  safetyNetBannerDeferred: {
    backgroundColor: colors.amAmber,
  },
  safetyNetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amWhite,
  },
  safetyNetText: {
    fontSize: 14,
    color: 'rgba(250,249,246,0.95)',
    marginTop: 4,
  },
  expiryBanner: {
    backgroundColor: colors.amCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  expiryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amWhite,
  },
  expiryText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  summary: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.amWhite,
  },
  summaryCount: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.amCard,
    padding: 16,
    borderRadius: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.amDeep,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.amAmber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amBackground,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.amWhite,
  },
  categoryHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  viewAllButton: {
    backgroundColor: colors.amAmber,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.amBackground,
  },
  viewAllHint: {
    fontSize: 13,
    color: 'rgba(45,49,66,0.9)',
    marginTop: 4,
  },
  familyKitModal: {
    flex: 1,
    backgroundColor: colors.amBackground,
    justifyContent: 'center',
    padding: 24,
  },
  familyKitModalContent: {
    gap: 16,
  },
  familyKitModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.amWhite,
  },
  familyKitModalBody: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 24,
  },
  familyKitModalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  familyKitModalButtonPrimary: {
    backgroundColor: colors.amAmber,
    borderColor: colors.amAmber,
  },
  familyKitModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amWhite,
  },
  familyKitModalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amBackground,
  },
});
