import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState, LeadCard, ScreenHeader } from '../components';
import { mockLeads } from '../mock';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';
import type { EnquiryStatus } from '../types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Leads'>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterValue = 'all' | EnquiryStatus;

/**
 * Leads screen — paginated, filterable list of inbound conversations.
 *
 * Filters are tabs across the top instead of a dropdown because the
 * business owner usually only cares about one slice at a time
 * (e.g. "what's new", "what's escalated") — tabs make the choice obvious.
 */
const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'escalated', label: 'Escalated' },
];

export function LeadsScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? mockLeads : mockLeads.filter((l) => l.status === filter)),
    [filter],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Leads"
        subtitle={`${mockLeads.length} inbound conversations`}
      />

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && { flex: 1 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            onPress={() =>
              navigation.navigate('ConversationDetail', { id: item.id })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="filter"
            title="No leads in this view"
            description="Try a different filter, or wait — new enquiries appear here in real time."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  chipLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  chipLabelActive: { color: colors.textInverse },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
  },
});
