import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme';
import type { MessageRole } from '../types';
import { formatClock } from '../utils/time';

/**
 * Message bubble. Three visual identities:
 *   - customer: light grey bubble on the left (incoming)
 *   - ai / agent: brand-tinted bubble on the right (outgoing)
 *   - system: centered slate badge (audit log entries)
 */

type Props = {
  role: MessageRole;
  content: string;
  createdAt: string;
};

export function MessageBubble({ role, content, createdAt }: Props) {
  if (role === 'system') {
    return (
      <View style={styles.systemWrap}>
        <View style={styles.systemBubble}>
          <Ionicons name="information-circle" size={14} color={colors.textSecondary} />
          <Text style={styles.systemText}>{content}</Text>
        </View>
      </View>
    );
  }

  const outgoing = role === 'ai' || role === 'agent';

  return (
    <View style={[styles.row, outgoing && styles.rowOutgoing]}>
      <View style={[styles.bubble, outgoing ? styles.bubbleOut : styles.bubbleIn]}>
        {role === 'ai' ? (
          <View style={styles.aiTag}>
            <Ionicons name="sparkles" size={11} color={colors.brand} />
            <Text style={styles.aiTagLabel}>Closira AI</Text>
          </View>
        ) : null}
        <Text style={[styles.text, outgoing && styles.textOut]}>{content}</Text>
        <Text style={[styles.time, outgoing && styles.timeOut]}>
          {formatClock(createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  rowOutgoing: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: 4,
  },
  bubbleIn: {
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: 4,
  },
  bubbleOut: {
    backgroundColor: colors.brand,
    borderTopRightRadius: 4,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
  textOut: { color: colors.textInverse },
  time: {
    ...typography.tiny,
    color: colors.textTertiary,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  timeOut: { color: 'rgba(255,255,255,0.75)' },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  aiTagLabel: {
    ...typography.tiny,
    color: colors.textInverse,
    letterSpacing: 0.4,
  },
  systemWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  systemText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
