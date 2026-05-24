import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { EnquiryStatus, TimelineEntry as TimelineEntryType } from '../types';
import { formatDateTime } from '../utils/time';

/**
 * Visual: a vertical "string" of dots with each transition labelled. The
 * last entry is highlighted to draw the eye to the current state.
 */

type Props = {
  entry: TimelineEntryType;
  isLast: boolean;
};

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  processing: 'Processing',
  qualified: 'Qualified',
  escalated: 'Escalated',
  resolved: 'Resolved',
};

const STATUS_FG: Record<EnquiryStatus, string> = {
  new: colors.statusNew,
  processing: colors.statusProcessing,
  qualified: colors.statusQualified,
  escalated: colors.statusEscalated,
  resolved: colors.statusResolved,
};

export function TimelineEntry({ entry, isLast }: Props) {
  const fg = STATUS_FG[entry.toStatus];

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: fg, borderColor: fg }]} />
        {!isLast ? <View style={styles.line} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.header}>
          {entry.fromStatus ? (
            <Text style={styles.transition}>
              <Text style={styles.muted}>{STATUS_LABELS[entry.fromStatus]}</Text>
              <Text style={styles.muted}> → </Text>
              <Text style={[styles.toStatus, { color: fg }]}>
                {STATUS_LABELS[entry.toStatus]}
              </Text>
            </Text>
          ) : (
            <Text style={[styles.toStatus, { color: fg }]}>
              {STATUS_LABELS[entry.toStatus]}
            </Text>
          )}
        </View>
        {entry.reason ? <Text style={styles.reason}>{entry.reason}</Text> : null}
        <Text style={styles.time}>{formatDateTime(entry.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  rail: {
    alignItems: 'center',
    width: 18,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  body: { flex: 1, paddingBottom: spacing.lg, gap: 2 },
  header: { flexDirection: 'row', alignItems: 'center' },
  transition: { flexDirection: 'row' },
  muted: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
  },
  toStatus: {
    ...typography.bodyMedium,
  },
  reason: {
    ...typography.body,
    color: colors.textSecondary,
  },
  time: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
