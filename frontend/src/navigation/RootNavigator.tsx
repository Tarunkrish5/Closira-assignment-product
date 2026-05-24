import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ConversationDetailScreen } from '../screens';
import { colors } from '../theme';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

/**
 * Root navigator.
 *
 * Stack at the top so the conversation detail can push from any tab (Leads,
 * Escalations, Dashboard activity feed) without rewriting routes per tab.
 * The detail screen renders its own custom header — we hide the stack header
 * to keep the look consistent across screens.
 */

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    text: colors.textPrimary,
    primary: colors.brand,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="ConversationDetail"
          component={ConversationDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
