/**
 * Centralised color palette.
 *
 * The product has three classes of color:
 *   1. Neutrals — slate scale, used for backgrounds, surfaces, borders, text.
 *   2. Brand — a single indigo accent, used sparingly (active states, links).
 *   3. Semantic — channel + status colors, used consistently across every
 *      screen so a quick visual scan always means the same thing.
 *
 * Every color has both a solid value and a translucent "soft" companion for
 * pill backgrounds, which keeps the UI looking soft and modern instead of
 * primary-color heavy.
 */

export const colors = {
  // Neutrals — slate scale
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Brand
  brand: '#4F46E5',
  brandSoft: '#EEF2FF',
  brandTextOnSoft: '#4338CA',

  // Channel — WhatsApp green, email blue, call amber
  whatsapp: '#16A34A',
  whatsappSoft: '#DCFCE7',
  email: '#2563EB',
  emailSoft: '#DBEAFE',
  call: '#D97706',
  callSoft: '#FEF3C7',

  // Status — new blue, qualified green, escalated red
  statusNew: '#2563EB',
  statusNewSoft: '#DBEAFE',
  statusQualified: '#16A34A',
  statusQualifiedSoft: '#DCFCE7',
  statusEscalated: '#DC2626',
  statusEscalatedSoft: '#FEE2E2',
  statusProcessing: '#7C3AED',
  statusProcessingSoft: '#EDE9FE',
  statusResolved: '#475569',
  statusResolvedSoft: '#F1F5F9',

  // Urgency
  urgencyHigh: '#DC2626',
  urgencyHighSoft: '#FEE2E2',
  urgencyMedium: '#D97706',
  urgencyMediumSoft: '#FEF3C7',
  urgencyLow: '#475569',
  urgencyLowSoft: '#F1F5F9',

  // Misc
  success: '#16A34A',
  successSoft: '#DCFCE7',
  shadow: 'rgba(15, 23, 42, 0.06)',
} as const;

export type ColorKey = keyof typeof colors;
