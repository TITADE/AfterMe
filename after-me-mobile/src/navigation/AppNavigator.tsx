import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

type MainTabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Settings: undefined;
};
import { useApp } from '../context/AppContext';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { VaultDashboardScreen } from '../features/dashboard/VaultDashboardScreen';
import { DocumentLibraryScreen } from '../features/documents/DocumentLibraryScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { SurvivorImportScreen } from '../features/survivor/SurvivorImportScreen';
import { OnboardingScreen1 } from '../features/onboarding/OnboardingScreen1';
import { OnboardingScreen2 } from '../features/onboarding/OnboardingScreen2';
import { OnboardingScreen3 } from '../features/onboarding/OnboardingScreen3';
import { OnboardingScreen4 } from '../features/onboarding/OnboardingScreen4';
import { OnboardingScreen5 } from '../features/onboarding/OnboardingScreen5';
import { OnboardingScreen6 } from '../features/onboarding/OnboardingScreen6';
import { KeyManager } from '../core/auth/KeyManager';
import type { DocumentCategory } from '../models/DocumentCategory';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '📋',
    Documents: '📁',
    Settings: '⚙️',
  };
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      {icons[label] || '•'}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      })}
    >
      <Tab.Screen name="Dashboard" options={{ title: 'Vault' }}>
        {() => <VaultDashboardWithNav />}
      </Tab.Screen>
      <Tab.Screen
        name="Documents"
        options={{ title: 'Documents' }}
      >
        {() => <DocumentLibraryScreen />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function VaultDashboardWithNav() {
  const { setCategoryFilter } = useApp();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const handleCategoryPress = (category: DocumentCategory) => {
    setCategoryFilter(category);
    navigation?.navigate('Documents');
  };

  const handleDocumentsPress = () => {
    setCategoryFilter(null);
    navigation?.navigate('Documents');
  };

  return (
    <VaultDashboardScreen
      onCategoryPress={handleCategoryPress}
      onDocumentsPress={handleDocumentsPress}
    />
  );
}

type OnboardingStep = 'welcome' | 'onboarding1' | 'onboarding2' | 'onboarding3' | 'onboarding4' | 'onboarding5' | 'onboarding6' | 'keys';

export function AppNavigator() {
  const insets = useSafeAreaInsets();
  const { isInitialized, hasCompletedOnboarding, refreshInit, setShowPhase1 } = useApp();
  const [showSurvivorFlow, setShowSurvivorFlow] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
  const [settingUp, setSettingUp] = useState(false);

  const startKeySetup = async () => {
    setOnboardingStep('keys');
    setSettingUp(true);
    try {
      const hasKeys = await KeyManager.isInitialized();
      if (!hasKeys) {
        await KeyManager.initializeKeys();
      }
      setShowSurvivorFlow(false);
      await refreshInit();
    } catch (e) {
      console.error('Setup failed:', e);
    } finally {
      setSettingUp(false);
    }
  };

  const handlePlanningLegacy = () => {
    setOnboardingStep('onboarding1');
  };

  const handleHaveKit = () => {
    setShowSurvivorFlow(true);
  };

  if (isInitialized === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasCompletedOnboarding || settingUp) {
    const isDarkScreen = onboardingStep === 'welcome' || onboardingStep === 'onboarding1' || onboardingStep === 'onboarding2' || onboardingStep === 'onboarding3' || onboardingStep === 'onboarding4' || onboardingStep === 'onboarding5' || onboardingStep === 'onboarding6' || showSurvivorFlow;
    return (
      <View style={[styles.container, isDarkScreen && styles.welcomeContainer]}>
        <StatusBar style={isDarkScreen ? 'light' : 'dark'} />
        <Pressable
          style={[styles.devButton, { bottom: insets.bottom + 24 }]}
          onPress={() => setShowPhase1(true)}
          hitSlop={20}
          collapsable={false}
        >
          <Text style={styles.devButtonText}>Reset</Text>
        </Pressable>
        {settingUp ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Setting up your vault...</Text>
            <Text style={styles.loadingHint}>Complete Face ID / Touch ID to continue</Text>
          </View>
        ) : showSurvivorFlow ? (
          <SurvivorImportScreen onBack={() => setShowSurvivorFlow(false)} />
        ) : onboardingStep === 'onboarding1' ? (
          <OnboardingScreen1 onContinue={() => setOnboardingStep('onboarding2')} />
        ) : onboardingStep === 'onboarding2' ? (
          <OnboardingScreen2 onContinue={() => setOnboardingStep('onboarding3')} />
        ) : onboardingStep === 'onboarding3' ? (
          <OnboardingScreen3 onContinue={() => setOnboardingStep('onboarding4')} />
        ) : onboardingStep === 'onboarding4' ? (
          <OnboardingScreen4 onContinue={() => setOnboardingStep('onboarding5')} />
        ) : onboardingStep === 'onboarding5' ? (
          <OnboardingScreen5
            onContinue={async () => {
              setSettingUp(true);
              try {
                const hasKeys = await KeyManager.isInitialized();
                if (!hasKeys) {
                  try {
                    await KeyManager.initializeKeys();
                  } catch (e) {
                    // Simulator or device without biometrics — proceed to Screen 6 for dev
                    const msg = e instanceof Error ? e.message : String(e);
                    if (msg.includes('Biometric')) {
                      console.warn('Biometric not available, proceeding to safety net (dev/simulator)');
                    } else {
                      throw e;
                    }
                  }
                }
              } finally {
                setSettingUp(false);
              }
              setOnboardingStep('onboarding6');
            }}
          />
        ) : onboardingStep === 'onboarding6' ? (
          <OnboardingScreen6
            onComplete={async () => {
              await refreshInit();
            }}
          />
        ) : (
          <WelcomeScreen
            onPlanningLegacy={handlePlanningLegacy}
            onHaveKit={handleHaveKit}
          />
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.amBackground },
            headerTintColor: colors.amWhite,
            headerTitleStyle: { fontWeight: '600', fontSize: 17, color: colors.amWhite },
          }}
        >
          <Stack.Screen name="Main" options={{ headerShown: false }}>
            {() => <MainTabs />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amBackground,
  },
  welcomeContainer: {
    backgroundColor: colors.amBackground,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.amBackground,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
  },
  loadingHint: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabBar: {
    backgroundColor: colors.amCard,
    borderTopColor: colors.border,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  devButton: {
    position: 'absolute',
    left: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(201,150,58,0.4)',
    borderRadius: 8,
    zIndex: 9999,
  },
  devButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amWhite,
  },
});
