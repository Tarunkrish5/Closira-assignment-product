import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '../theme';
import type { EnquiryStatus } from '../types';

/**
 * Status pill. The visual hierarchy is intentional:
 *   - New: blue (incoming, neutral)
 *   - Qualified: green (success)
 *   - Escalated: red (needs attention)
 * Everything else uses a muted palette so the eye is drawn to the three
 * that actually matter to a business owner scanning the dashboard.
 */

type Props = {
  status: EnquiryStatus;
  size?: 'sm' | 'md';
};

const META: Record<EnquiryStatus, { label: string; fg: string; bg: string }> = {
  new: { label: 'New', fg: colors.statusNew, bg: colors.statusNewSoft },
  processing: {
    label: 'Processing',
    fg: colors.statusProcessing,
    bg: colors.statusProcessingSoft,
  },
  qualified: { label: 'Qualified', fg: colors.statusQualified, bg: colors.statusQualifiedSoft },
  escalated: { label: 'Escalated', fg: colors.statusEscalated, bg: colors.statusEscalatedSoft },
  resolved: { label: 'Resolved', fg: colors.statusResolved, bg: colors.statusResolvedSoft },
};

export function StatusPill({ status, size = 'md' }: Props) {
  const meta = META[status];
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: meta.bg,
          paddingVertical: small ? 2 : 4,
          paddingHorizontal: small ? 8 : 10,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: meta.fg }]} />
      <Text style={[styles.label, { color: meta.fg, fontSize: small ? 11 : 12 }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  label: {
    ...typography.captionMedium,
    letterSpacing: 0.2,
  },
});
