import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow, spacing, typography } from '../theme';
import type { Escalation } from '../types';
import { relativeTime } from '../utils/time';
import { ChannelBadge } from './ChannelBadge';
import { UrgencyPill } from './UrgencyPill';

type Props = {
  escalation: Escalation;
  resolved?: boolean;
  onPress?: () => void;
  onResolve?: () => void;
};

/**
 * Escalation card.
 *
 * High-urgency cards get a thin red top border so the most important items
 * are visible on a fast scroll — a small piece of "scannability" detail.
 * Resolved cards stay visible but are dimmed and the action button
 * disappears, so the screen still feels productive after action.
 */

export function EscalationCard({ escalation, resolved, onPress, onResolve }: Props) {
  const highUrgency = escalation.urgency === 'high';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        highUrgency && styles.highUrgencyAccent,
        pressed && styles.pressed,
        resolved && styles.resolved,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Escalation from ${escalation.customer}`}
    >
      <View style={styles.topRow}>
        <Text style={styles.customer} numberOfLines={1}>
          {escalation.customer}
        </Text>
        <Text style={styles.time}>{relativeTime(escalation.receivedAt)}</Text>
      </View>

      <Text style={styles.reason} numberOfLines={1}>
        {escalation.reason}
      </Text>
      <Text style={styles.summary} numberOfLines={3}>
        {escalation.summary}
      </Text>

      <View style={styles.metaRow}>
        <ChannelBadge channel={escalation.channel} size="sm" />
        <UrgencyPill urgency={escalation.urgency} />
      </View>

      {!resolved ? (
        <Pressable
          onPress={onResolve}
          style={({ pressed }) => [styles.resolveBtn, pressed && styles.resolveBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Resolve escalation"
        >
          <Ionicons name="checkmark" size={16} color={colors.textInverse} />
          <Text style={styles.resolveLabel}>Mark resolved</Text>
        </Pressable>
      ) : (
        <View style={styles.resolvedBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.resolvedLabel}>Resolved</Text>
        </View>
      )}
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
  highUrgencyAccent: {
    borderTopWidth: 3,
    borderTopColor: colors.statusEscalated,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  resolved: { opacity: 0.6 },
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
  reason: {
    ...typography.bodyMedium,
    color: colors.statusEscalated,
  },
  summary: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  resolveBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.textPrimary,
    paddingVertical: 10,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resolveBtnPressed: { opacity: 0.85 },
  resolveLabel: {
    ...typography.bodyMedium,
    color: colors.textInverse,
  },
  resolvedBanner: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  resolvedLabel: {
    ...typography.captionMedium,
    color: colors.success,
  },
});
