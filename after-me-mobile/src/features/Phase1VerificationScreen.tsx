import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Button,
  ActivityIndicator,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CryptoService } from '../core/crypto/CryptoService';
import { KeyManager } from '../core/auth/KeyManager';
import { EncryptedStorageService } from '../core/storage/EncryptedStorageService';
import { OnboardingStorage } from '../services/OnboardingStorage';
import * as StoreKit from 'storekit';
import { Buffer } from 'buffer';

type TestResult = {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message?: string;
};

interface Phase1VerificationScreenProps {
  onBack: () => void;
}

export function Phase1VerificationScreen({ onBack }: Phase1VerificationScreenProps) {
  const insets = useSafeAreaInsets();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Crypto Service (AES-256)', status: 'pending' },
    { name: 'Key Manager (Secure Enclave)', status: 'pending' },
    { name: 'Encrypted Storage', status: 'pending' },
    { name: 'StoreKit (Native Module)', status: 'pending' },
  ]);
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetOnboarding = async () => {
    setResetting(true);
    try {
      await OnboardingStorage.resetOnboarding();
      await KeyManager.resetKeys();
      // Navigate back — AppProvider will remount and refreshInit will see fresh state
      onBack();
    } catch (e) {
      console.error('Reset onboarding failed:', e);
    } finally {
      setResetting(false);
    }
  };

  const updateTest = (name: string, status: TestResult['status'], message?: string) => {
    setTests((prev) =>
      prev.map((t) => (t.name === name ? { ...t, status, message } : t))
    );
  };

  const runTests = async () => {
    setRunning(true);

    setTests((prev) =>
      prev.map((t) => ({ ...t, status: 'pending', message: undefined }))
    );

    try {
      const key = CryptoService.generateKey();
      const data = Buffer.from('Hello Phase 1');
      const encrypted = CryptoService.encrypt(data, key);
      const decrypted = CryptoService.decrypt(encrypted, key);

      if (decrypted.toString() === 'Hello Phase 1') {
        updateTest(
          'Crypto Service (AES-256)',
          'success',
          'Encryption/Decryption verified'
        );
      } else {
        updateTest('Crypto Service (AES-256)', 'error', 'Decrypted data mismatch');
      }
    } catch (e: unknown) {
      updateTest('Crypto Service (AES-256)', 'error', (e as Error).message);
    }

    let keyManagerSuccess = false;
    try {
      const isInit = await KeyManager.isInitialized();
      if (!isInit) {
        try {
          await KeyManager.initializeKeys();
          updateTest(
            'Key Manager (Secure Enclave)',
            'success',
            'Keys initialized successfully'
          );
          keyManagerSuccess = true;
        } catch (initError: unknown) {
          if ((initError as Error).message.includes('Biometric')) {
            updateTest(
              'Key Manager (Secure Enclave)',
              'warning',
              'Biometrics missing (Simulator? Enroll FaceID)'
            );
          } else {
            throw initError;
          }
        }
      } else {
        updateTest(
          'Key Manager (Secure Enclave)',
          'success',
          'Keys already initialized'
        );
        keyManagerSuccess = true;
      }
    } catch (e: unknown) {
      updateTest(
        'Key Manager (Secure Enclave)',
        'error',
        (e as Error).message
      );
    }

    if (keyManagerSuccess) {
      try {
        await EncryptedStorageService.initializeVault();
        const testFile = 'test_phase1';
        const content = Buffer.from('Secure Content Phase 1');

        await EncryptedStorageService.saveFile(testFile, content);
        const readBack = await EncryptedStorageService.readFile(testFile);

        if (readBack.toString() === 'Secure Content Phase 1') {
          updateTest('Encrypted Storage', 'success', 'Read/Write verified');
          await EncryptedStorageService.deleteFile(testFile);
        } else {
          updateTest('Encrypted Storage', 'error', 'Content mismatch');
        }
      } catch (e: unknown) {
        updateTest('Encrypted Storage', 'error', (e as Error).message);
      }
    } else {
      updateTest('Encrypted Storage', 'warning', 'Skipped (KeyManager failed)');
    }

    try {
      const products = await StoreKit.getPurchasedProducts();
      updateTest(
        'StoreKit (Native Module)',
        'success',
        `Module loaded. Entitlements: ${products.length}`
      );
    } catch (e: unknown) {
      updateTest('StoreKit (Native Module)', 'error', (e as Error).message);
    }

    setRunning(false);
  };

  useEffect(() => {
    runTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Phase 1 Verification</Text>
        <Text style={styles.subtitle}>Core Systems Check</Text>
      </View>

      <ScrollView style={styles.list}>
        {tests.map((test, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text style={styles.name}>{test.name}</Text>
              <StatusBadge status={test.status} />
            </View>
            {test.message && <Text style={styles.message}>{test.message}</Text>}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {running ? (
          <ActivityIndicator size="large" color="#C9963A" />
        ) : (
          <>
            <Button title="Run Verification" onPress={runTests} color="#C9963A" />
            <Pressable
              onPress={handleResetOnboarding}
              disabled={resetting}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>
                {resetting ? 'Resetting…' : 'Reset onboarding (clear keys & storage)'}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable
        onPress={onBack}
        style={[styles.backButton, { top: insets.top + 12 }]}
        collapsable={false}
        hitSlop={16}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const StatusBadge = ({ status }: { status: TestResult['status'] }) => {
  const colors = {
    pending: '#8E8E93',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[status] }]}>
      <Text style={styles.badgeText}>{status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 12,
    zIndex: 9999,
  },
  backText: {
    fontSize: 17,
    color: '#C9963A',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3142',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  item: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3142',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#C9963A',
    fontWeight: '500',
  },
});
