import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing, typography } from '../theme';
import type { Channel } from '../types';

/**
 * Channel badge — small pill that pairs an icon with a label.
 *
 * Colors are pulled from the theme so changes propagate everywhere at once:
 * WhatsApp = green, Email = blue, Call = amber.
 */

type Props = {
  channel: Channel;
  /** Smaller variant for dense rows. */
  size?: 'sm' | 'md';
  /** Hide the label for very tight layouts. */
  iconOnly?: boolean;
};

const CHANNEL_META: Record<
  Channel,
  { label: string; icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string }
> = {
  whatsapp: {
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    fg: colors.whatsapp,
    bg: colors.whatsappSoft,
  },
  email: {
    label: 'Email',
    icon: 'mail',
    fg: colors.email,
    bg: colors.emailSoft,
  },
  call: {
    label: 'Call',
    icon: 'call',
    fg: colors.call,
    bg: colors.callSoft,
  },
};

export function ChannelBadge({ channel, size = 'md', iconOnly = false }: Props) {
  const meta = CHANNEL_META[channel];
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: meta.bg,
          paddingVertical: small ? 2 : 4,
          paddingHorizontal: iconOnly ? (small ? 6 : 8) : small ? 8 : 10,
        },
      ]}
    >
      <Ionicons name={meta.icon} size={small ? 12 : 14} color={meta.fg} />
      {!iconOnly && (
        <Text style={[styles.label, { color: meta.fg, fontSize: small ? 11 : 12 }]}>
          {meta.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.captionMedium,
    letterSpacing: 0.2,
  },
});
