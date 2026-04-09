import { DefaultTheme } from '@react-navigation/native';
import { colors, fontWeight, radius, shadows, spacing, touch, typography } from './tokens';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  fontWeight,
  shadows,
  touch,
} as const;

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export type StatusTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export function toneColors(tone: StatusTone) {
  switch (tone) {
    case 'primary':
      return { background: colors.primarySoft, foreground: colors.primaryStrong, border: colors.borderStrong };
    case 'success':
      return { background: colors.successSoft, foreground: colors.success, border: '#BFE6CE' };
    case 'warning':
      return { background: colors.warningSoft, foreground: colors.warning, border: '#F4D59C' };
    case 'danger':
      return { background: colors.dangerSoft, foreground: colors.danger, border: '#F3B8B8' };
    case 'info':
      return { background: colors.infoSoft, foreground: colors.info, border: '#B8DBEE' };
    default:
      return { background: colors.surfaceMuted, foreground: colors.textMuted, border: colors.border };
  }
}
