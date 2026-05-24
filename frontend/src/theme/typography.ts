/**
 * Typography scale.
 *
 * Five sizes is enough hierarchy for a product like this. Line heights are
 * tuned for mobile reading; weights stay in three buckets (regular, medium,
 * semibold) so titles feel weighty without going full-bold-everywhere.
 */
import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heading: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  captionMedium: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  tiny: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof typography;
