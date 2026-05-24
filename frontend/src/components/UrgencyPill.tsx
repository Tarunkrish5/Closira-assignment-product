import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, typography } from '../theme';
import type { Urgency } from '../types';

type Props = {
  urgency: Urgency;
};

const META: Record<Urgency, { label: string; fg: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  high: {
    label: 'High',
    fg: colors.urgencyHigh,
    bg: colors.urgencyHighSoft,
    icon: 'flame',
  },
  medium: {
    label: 'Medium',
    fg: colors.urgencyMedium,
    bg: colors.urgencyMediumSoft,
    icon: 'alert-circle',
  },
  low: {
    label: 'Low',
    fg: colors.urgencyLow,
    bg: colors.urgencyLowSoft,
    icon: 'information-circle',
  },
};

export function UrgencyPill({ urgency }: Props) {
  const meta = META[urgency];

  return (
    <View style={[styles.base, { backgroundColor: meta.bg }]}>
      <Ionicons name={meta.icon} size={12} color={meta.fg} />
      <Text style={[styles.label, { color: meta.fg }]}>{meta.label} urgency</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.captionMedium,
    letterSpacing: 0.2,
  },
});
