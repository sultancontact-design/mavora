/**
 * Mavora Mobile App - Main Entry Point
 * React Native application for Mavora marketplace
 * 
 * @module App
 */

import React from 'react';
import { StatusBar, LogBox, I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Context
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

// Services
import { notificationService } from './src/services/NotificationService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Force RTL for Arabic (can be toggled based on user preference)
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const App: React.FC = () => {
  // Initialize services
  React.useEffect(() => {
    notificationService.initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar
                barStyle="light-content"
                backgroundColor="#1a1a2e"
                translucent={false}
              />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
