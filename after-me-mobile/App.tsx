import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Buffer } from 'buffer';

import { initSentry } from './src/services/SentryService';
import { AppProvider } from './src/context/AppContext';
import { PurchaseProvider } from './src/context/PurchaseContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

global.Buffer = global.Buffer || Buffer;

initSentry();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <PurchaseProvider>
          <View style={styles.container}>
            <AppNavigator />
          </View>
          <StatusBar style="light" />
        </PurchaseProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
  },
});
