import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, typography } from '../theme';
import type { Lead } from '../types';
import { relativeTime } from '../utils/time';
import { ChannelBadge } from './ChannelBadge';
import { StatusPill } from './StatusPill';

type Props = {
  lead: Lead;
  onPress?: () => void;
};

export function LeadCard({ lead, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${lead.customer}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.customer} numberOfLines={1}>
          {lead.customer}
        </Text>
        <Text style={styles.time}>{relativeTime(lead.receivedAt)}</Text>
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {lead.preview}
      </Text>

      <View style={styles.bottomRow}>
        <ChannelBadge channel={lead.channel} size="sm" />
        <StatusPill status={lead.status} size="sm" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
    gap: spacing.sm,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customer: {
    ...typography.heading,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  time: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
});
