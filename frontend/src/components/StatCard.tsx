import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow, spacing, typography } from '../theme';

/**
 * KPI tile. The numeric value is the hero; the label and delta are
 * supporting context. Each tile carries a soft-coloured icon so the
 * dashboard reads as scannable categories rather than a wall of numbers.
 */

type Props = {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Soft background color for the icon container. */
  tint: string;
  /** Icon foreground color. */
  tintFg: string;
  /** Optional delta string, e.g. "+6 vs yesterday". */
  delta?: string;
  /** Pass true if the delta is good (green); false (red); undefined = neutral. */
  deltaPositive?: boolean;
};

export function StatCard({
  label,
  value,
  icon,
  tint,
  tintFg,
  delta,
  deltaPositive,
}: Props) {
  const deltaColor =
    deltaPositive === undefined
      ? colors.textTertiary
      : deltaPositive
      ? colors.success
      : colors.statusEscalated;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={18} color={tintFg} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {delta ? <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  value: {
    ...typography.title,
    color: colors.textPrimary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  delta: {
    ...typography.tiny,
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },
});
