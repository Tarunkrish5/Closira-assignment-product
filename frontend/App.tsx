import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * App root.
 *
 * Single responsibility — wire up the SafeAreaProvider and status bar, then
 * hand off to the navigator. Anything bigger belongs in a screen or a
 * dedicated provider.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
