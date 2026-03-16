import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Button, ActivityIndicator, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CryptoService } from './src/core/crypto/CryptoService';
import { KeyManager } from './src/core/auth/KeyManager';
import { EncryptedStorageService } from './src/core/storage/EncryptedStorageService';
import * as StoreKit from 'storekit';
import { Buffer } from 'buffer';

// Polyfill Buffer if needed (though usually handled by metro config or global)
global.Buffer = global.Buffer || Buffer;

type TestResult = {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message?: string;
};

export default function App() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Crypto Service (AES-256)', status: 'pending' },
    { name: 'Key Manager (Secure Enclave)', status: 'pending' },
    { name: 'Encrypted Storage', status: 'pending' },
    { name: 'StoreKit (Native Module)', status: 'pending' },
  ]);
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message?: string) => {
    setTests(prev => prev.map(t => t.name === name ? { ...t, status, message } : t));
  };

  const runTests = async () => {
    setRunning(true);
    
    // Reset statuses
    setTests(prev => prev.map(t => ({ ...t, status: 'pending', message: undefined })));

    // 1. Crypto Service Test
    try {
      const key = CryptoService.generateKey();
      const data = Buffer.from('Hello Phase 1');
      const encrypted = CryptoService.encrypt(data, key);
      const decrypted = CryptoService.decrypt(encrypted, key);
      
      if (decrypted.toString() === 'Hello Phase 1') {
        updateTest('Crypto Service (AES-256)', 'success', 'Encryption/Decryption verified');
      } else {
        updateTest('Crypto Service (AES-256)', 'error', 'Decrypted data mismatch');
      }
    } catch (e: any) {
      updateTest('Crypto Service (AES-256)', 'error', e.message);
    }

    // 2. Key Manager Test
    let keyManagerSuccess = false;
    try {
      const isInit = await KeyManager.isInitialized();
      if (!isInit) {
        try {
            await KeyManager.initializeKeys();
            updateTest('Key Manager (Secure Enclave)', 'success', 'Keys initialized successfully');
            keyManagerSuccess = true;
        } catch (initError: any) {
            if (initError.message.includes('Biometric')) {
                updateTest('Key Manager (Secure Enclave)', 'warning', 'Biometrics missing (Simulator? Enroll FaceID)');
            } else {
                throw initError;
            }
        }
      } else {
        updateTest('Key Manager (Secure Enclave)', 'success', 'Keys already initialized');
        keyManagerSuccess = true;
      }
    } catch (e: any) {
      updateTest('Key Manager (Secure Enclave)', 'error', e.message);
    }

    // 3. Encrypted Storage Test
    if (keyManagerSuccess) {
      try {
        await EncryptedStorageService.initializeVault();
        const testFile = 'test_phase1';
        const content = Buffer.from('Secure Content Phase 1');
        
        await EncryptedStorageService.saveFile(testFile, content);
        const readBack = await EncryptedStorageService.readFile(testFile);
        
        if (readBack.toString() === 'Secure Content Phase 1') {
          updateTest('Encrypted Storage', 'success', 'Read/Write verified');
          // Cleanup
          await EncryptedStorageService.deleteFile(testFile);
        } else {
          updateTest('Encrypted Storage', 'error', 'Content mismatch');
        }
      } catch (e: any) {
        updateTest('Encrypted Storage', 'error', e.message);
      }
    } else {
      updateTest('Encrypted Storage', 'warning', 'Skipped (KeyManager failed)');
    }

    // 4. StoreKit Test
    try {
      // Just check if we can call a method on the native module
      const products = await StoreKit.getPurchasedProducts();
      updateTest('StoreKit (Native Module)', 'success', `Module loaded. Entitlements: ${products.length}`);
    } catch (e: any) {
      updateTest('StoreKit (Native Module)', 'error', e.message);
    }

    setRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Phase 1 Verification</Text>
        <Text style={styles.subtitle}>Core Systems Check</Text>
        
        <ScrollView style={styles.list}>
          {tests.map((test, index) => (
            <View key={index} style={styles.item}>
              <View style={styles.header}>
                <Text style={styles.name}>{test.name}</Text>
                <StatusBadge status={test.status} />
              </View>
              {test.message && <Text style={styles.message}>{test.message}</Text>}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          {running ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Button title="Run Verification" onPress={runTests} />
          )}
        </View>
        <StatusBar style="auto" />
      </View>
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
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  item: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
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
    marginTop: 20,
    alignItems: 'center',
  },
});
