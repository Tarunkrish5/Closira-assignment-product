import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme';
import type { ActivityItem as ActivityItemType } from '../types';
import { relativeTime } from '../utils/time';
import { ChannelBadge } from './ChannelBadge';

/**
 * Single row in the recent-activity feed. Visual hierarchy:
 *   - Icon (left)  : tells you *what kind* of event this was
 *   - Customer name: the human you'd recognise
 *   - Description  : the actual event in plain English
 *   - Channel + time (right): supporting metadata
 */

type Props = {
  item: ActivityItemType;
  onPress?: () => void;
  showDivider?: boolean;
};

const KIND_META: Record<
  ActivityItemType['kind'],
  { icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string }
> = {
  lead: { icon: 'person-add', fg: colors.statusNew, bg: colors.statusNewSoft },
  qualified: { icon: 'checkmark-circle', fg: colors.statusQualified, bg: colors.statusQualifiedSoft },
  escalation: { icon: 'alert-circle', fg: colors.statusEscalated, bg: colors.statusEscalatedSoft },
  followup: { icon: 'time', fg: colors.brand, bg: colors.brandSoft },
};

export function ActivityItem({ item, onPress, showDivider }: Props) {
  const meta = KIND_META[item.kind];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={[styles.icon, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={16} color={meta.fg} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.customer} numberOfLines={1}>
            {item.customer}
          </Text>
          <Text style={styles.time}>{relativeTime(item.occurredAt)}</Text>
        </View>
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.bottomRow}>
          <ChannelBadge channel={item.channel} size="sm" />
        </View>
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: { flex: 1, gap: 4 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customer: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomRow: { flexDirection: 'row', marginTop: 2 },
  divider: {
    position: 'absolute',
    left: spacing.lg + 32 + spacing.md,
    right: spacing.lg,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
