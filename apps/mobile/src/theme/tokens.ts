export const colors = {
  background: '#F4F7F8',
  backgroundAccent: '#E8F5F4',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FBFB',
  surfaceStrong: '#E6F4F2',
  border: '#D6E3E1',
  borderStrong: '#A8C6C2',
  text: '#123033',
  textMuted: '#5F7578',
  textSubtle: '#7E9396',
  primary: '#0F8C84',
  primaryStrong: '#0A6E67',
  primarySoft: '#DDF4F1',
  success: '#1F9D61',
  successSoft: '#EAF8F0',
  warning: '#D18A12',
  warningSoft: '#FFF5E1',
  danger: '#D64545',
  dangerSoft: '#FDECEC',
  info: '#1D7AA8',
  infoSoft: '#E8F4FB',
  overlay: 'rgba(18, 48, 51, 0.08)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  caption: 12,
  bodySm: 14,
  body: 16,
  bodyLg: 18,
  titleSm: 20,
  title: 24,
  titleLg: 32,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadows = {
  card: {
    shadowColor: '#123033',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  lift: {
    shadowColor: '#123033',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;

export const touch = {
  minHeight: 48,
} as const;
