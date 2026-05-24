import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  ActivityItem,
  QuickActionButton,
  ScreenHeader,
  SectionHeader,
  StatCard,
} from '../components';
import { mockActivity, mockStats } from '../mock';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

/**
 * Home screen for the SMB owner.
 *
 * Layout reasoning:
 *   1. Welcome header — sets context.
 *   2. Four KPI tiles (2x2 grid) — the at-a-glance status of the business.
 *   3. Quick actions — the top three things the owner most often wants to do.
 *   4. Recent activity — a live, scannable feed.
 *
 * Each section is its own component so this file stays a thin composition.
 */
export function DashboardScreen({ navigation }: Props) {
  const stats = mockStats;
  const activity = mockActivity;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Hello, Anita"
          subtitle="Here's what's happening today"
        />

        {/* KPI tiles */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Leads today"
              value={stats.leadsToday}
              icon="people"
              tint={colors.statusNewSoft}
              tintFg={colors.statusNew}
              delta={`+${stats.leadsTodayDelta} vs yesterday`}
              deltaPositive
            />
            <StatCard
              label="Missed enquiries"
              value={stats.missedEnquiries}
              icon="alert"
              tint={colors.urgencyMediumSoft}
              tintFg={colors.urgencyMedium}
              delta="needs attention"
              deltaPositive={false}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Open escalations"
              value={stats.openEscalations}
              icon="flame"
              tint={colors.statusEscalatedSoft}
              tintFg={colors.statusEscalated}
            />
            <StatCard
              label="Follow-ups due"
              value={stats.followupsDue}
              icon="time"
              tint={colors.brandSoft}
              tintFg={colors.brand}
            />
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <SectionHeader title="Quick actions" />
          <View style={styles.quickActions}>
            <QuickActionButton
              icon="alert-circle"
              label="Review escalations"
              description={`${stats.openEscalations} need attention`}
              tint={colors.statusEscalatedSoft}
              tintFg={colors.statusEscalated}
              onPress={() => navigation.navigate('Escalations')}
            />
            <QuickActionButton
              icon="time"
              label="Today's follow-ups"
              description={`${stats.followupsDue} scheduled for today`}
              tint={colors.brandSoft}
              tintFg={colors.brand}
              onPress={() => navigation.navigate('Followups')}
            />
            <QuickActionButton
              icon="people"
              label="Browse all leads"
              description="See every new conversation"
              tint={colors.statusNewSoft}
              tintFg={colors.statusNew}
              onPress={() => navigation.navigate('Leads')}
            />
          </View>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <SectionHeader title="Recent activity" />
          <View style={styles.activityCard}>
            {activity.map((item, i) => (
              <ActivityItem
                key={item.id}
                item={item}
                showDivider={i < activity.length - 1}
                onPress={() =>
                  item.enquiryId &&
                  navigation.navigate('ConversationDetail', {
                    id: item.enquiryId,
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.huge },
  statsGrid: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  section: { marginTop: spacing.xxl },
  quickActions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  activityCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
