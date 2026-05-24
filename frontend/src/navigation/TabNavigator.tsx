import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import {
  DashboardScreen,
  EscalationsScreen,
  FollowupsScreen,
  LeadsScreen,
} from '../screens';
import { mockEscalations, mockFollowups } from '../mock';
import { colors, radius, spacing, typography } from '../theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Bottom-tab navigator.
 *
 * Subtle touches that make this feel "real":
 *  - Escalations and Follow-ups tabs show count badges (driven by mock
 *    data today, by API state in production).
 *  - The active icon swaps to its filled variant — a small detail that
 *    makes the bar feel responsive.
 *  - The label uses semibold weight only when active so the tab bar reads
 *    as a hierarchy, not a row of equal-weight buttons.
 */

type IconBaseName = 'home' | 'people' | 'flame' | 'time';

const ICONS: Record<keyof TabParamList, IconBaseName> = {
  Home: 'home',
  Leads: 'people',
  Escalations: 'flame',
  Followups: 'time',
};

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={badgeStyles.wrap}>
      <Text style={badgeStyles.text}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export function TabNavigator() {
  const openEscalations = mockEscalations.length;
  const dueFollowups = mockFollowups.length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const base = ICONS[route.name];
          const name = focused ? base : (`${base}-outline` as const);
          return <Ionicons name={name} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen
        name="Leads"
        component={LeadsScreen}
        options={{ title: 'Leads' }}
      />
      <Tab.Screen
        name="Escalations"
        component={EscalationsScreen}
        options={{
          tabBarBadge: openEscalations > 0 ? openEscalations : undefined,
          tabBarBadgeStyle: badgeStyles.rnBadge,
        }}
      />
      <Tab.Screen
        name="Followups"
        component={FollowupsScreen}
        options={{
          title: 'Follow-ups',
          tabBarBadge: dueFollowups > 0 ? dueFollowups : undefined,
          tabBarBadgeStyle: badgeStyles.rnBadge,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabLabel: {
    ...typography.tiny,
    letterSpacing: 0.4,
    marginTop: 2,
  },
});

const badgeStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.statusEscalated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.tiny,
    color: colors.textInverse,
    fontWeight: '700',
  },
  // React Navigation's bottom-tabs uses a flat style for tabBarBadge:
  rnBadge: {
    backgroundColor: colors.statusEscalated,
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
    minWidth: 18,
  },
});
