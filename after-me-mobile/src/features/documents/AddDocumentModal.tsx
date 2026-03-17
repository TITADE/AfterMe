import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { DocumentService } from '../../services/DocumentService';
import {
  DOCUMENT_CATEGORIES,
  CATEGORY_LABELS,
  type DocumentCategory,
} from '../../models/DocumentCategory';
import { colors } from '../../theme/colors';

interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onDocumentAdded: () => void;
}

type Step = 'source' | 'category';

export function AddDocumentModal({
  visible,
  onClose,
  onDocumentAdded,
}: AddDocumentModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [step, setStep] = useState<Step>('source');
  const [pendingSource, setPendingSource] = useState<'scan' | 'files' | 'photos' | null>(null);

  const reset = () => {
    setLoading(false);
    setSelectedCategory(null);
    setStep('source');
    setPendingSource(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const showCategoryPicker = (source: 'scan' | 'files' | 'photos') => {
    setPendingSource(source);
    setStep('category');
  };

  const executeImport = async () => {
    if (!selectedCategory || !pendingSource) return;

    try {
      setLoading(true);

      if (pendingSource === 'scan') {
        const result = await DocumentScanner.scanDocument({
          croppedImageQuality: 90,
        });

        if (result.status === 'cancel') {
          setLoading(false);
          return;
        }

        if (!result.scannedImages?.length) {
          Alert.alert('Error', 'No images were scanned.');
          setLoading(false);
          return;
        }

        for (let i = 0; i < result.scannedImages.length; i++) {
          const img = result.scannedImages[i];
          const isBase64 = typeof img === 'string' && !img.startsWith('file') && !img.startsWith('/');
          const title = result.scannedImages.length > 1 ? `Scan ${i + 1}` : 'Scanned Document';

          if (isBase64) {
            await DocumentService.importFromBase64(img, selectedCategory, title);
          } else {
            await DocumentService.importFromFilePath(img as string, selectedCategory, title);
          }
        }
      } else if (pendingSource === 'files') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          setLoading(false);
          return;
        }

        const file = result.assets[0];
        await DocumentService.importFromFilePath(
          file.uri,
          selectedCategory,
          file.name || 'Imported Document',
          { format: file.mimeType?.includes('pdf') ? 'pdf' : 'jpeg' }
        );
      } else if (pendingSource === 'photos') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.9,
        });

        if (result.canceled) {
          setLoading(false);
          return;
        }

        const asset = result.assets[0];
        await DocumentService.importFromFilePath(
          asset.uri,
          selectedCategory,
          'Photo from Library'
        );
      }

      onDocumentAdded();
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Import failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryConfirm = () => {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please choose a category for your document.');
      return;
    }
    executeImport();
  };

  if (step === 'category') {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Choose Category</Text>
            <Text style={styles.subtitle}>
              {pendingSource === 'scan'
                ? 'Select category for scanned document'
                : 'Select category for imported document'}
            </Text>
            <ScrollView style={styles.categoryList}>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === cat && styles.categoryLabelSelected,
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleClose}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, !selectedCategory && styles.primaryButtonDisabled]}
                onPress={handleCategoryConfirm}
                disabled={!selectedCategory || loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.amBackground} />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {pendingSource === 'scan' ? 'Scan Document' : 'Import'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Add Document</Text>
          <Text style={styles.subtitle}>Choose how to add your document</Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => showCategoryPicker('scan')}
            disabled={loading}
          >
            <Text style={styles.optionIcon}>📷</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Scan with Camera</Text>
              <Text style={styles.optionHint}>Use VisionKit to scan documents</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => showCategoryPicker('files')}
            disabled={loading}
          >
            <Text style={styles.optionIcon}>📁</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Pick from Files</Text>
              <Text style={styles.optionHint}>Import from Files app or cloud storage</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => showCategoryPicker('photos')}
            disabled={loading}
          >
            <Text style={styles.optionIcon}>🖼️</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Pick from Photos</Text>
              <Text style={styles.optionHint}>Import from Photo Library</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.amBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.amWhite,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.amCard,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.amWhite,
  },
  optionHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  categoryList: {
    maxHeight: 280,
    marginBottom: 16,
  },
  categoryButton: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: colors.amCard,
  },
  categoryButtonSelected: {
    backgroundColor: colors.amCard,
    borderWidth: 2,
    borderColor: colors.amAmber,
  },
  categoryLabel: {
    fontSize: 16,
    color: colors.amWhite,
  },
  categoryLabelSelected: {
    fontWeight: '600',
    color: colors.amWhite,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.amAmber,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.amBackground,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.amCard,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.amWhite,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
