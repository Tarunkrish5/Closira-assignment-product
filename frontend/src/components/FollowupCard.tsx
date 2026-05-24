import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow, spacing, typography } from '../theme';
import type { Followup } from '../types';
import { formatClock, relativeTime } from '../utils/time';
import { ChannelBadge } from './ChannelBadge';

type Props = {
  followup: Followup;
  done?: boolean;
  onPress?: () => void;
  onMarkDone?: () => void;
};

/**
 * Follow-up task card. Layout choices:
 *   - Clock time on the right gives an at-a-glance "when";
 *   - Relative time underneath gives "how soon" without math;
 *   - Message preview shows agents what's queued without opening the convo;
 *   - Done state collapses the action into a calm "Marked done" pill.
 */

export function FollowupCard({ followup, done, onPress, onMarkDone }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        done && styles.cardDone,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Follow-up for ${followup.customer}`}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[styles.customer, done && styles.strikethrough]}
            numberOfLines={1}
          >
            {followup.customer}
          </Text>
          <ChannelBadge channel={followup.channel} size="sm" />
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.clock}>{formatClock(followup.dueAt)}</Text>
          <Text style={styles.relative}>{relativeTime(followup.dueAt)}</Text>
        </View>
      </View>

      <Text
        style={[styles.preview, done && styles.strikethroughSubtle]}
        numberOfLines={2}
      >
        {followup.messagePreview}
      </Text>

      {!done ? (
        <Pressable
          onPress={onMarkDone}
          style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Mark follow-up as done"
        >
          <Ionicons name="checkmark-done" size={16} color={colors.brand} />
          <Text style={styles.doneLabel}>Mark as done</Text>
        </Pressable>
      ) : (
        <View style={styles.doneBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.doneBannerLabel}>Marked done</Text>
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
  pressed: { backgroundColor: colors.surfaceMuted },
  cardDone: { opacity: 0.7 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  customer: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  strikethrough: { textDecorationLine: 'line-through', color: colors.textSecondary },
  strikethroughSubtle: { color: colors.textTertiary },
  timeBlock: { alignItems: 'flex-end' },
  clock: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  relative: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brandSoft,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  doneBtnPressed: { opacity: 0.85 },
  doneLabel: {
    ...typography.bodyMedium,
    color: colors.brandTextOnSoft,
  },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  doneBannerLabel: {
    ...typography.captionMedium,
    color: colors.success,
  },
});
