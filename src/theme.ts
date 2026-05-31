// Design tokens — ported 1:1 from the Quoted web prototype (navy + high-vis orange).

export const C = {
  navy: '#0F1E3C',
  navyPress: '#0A1730',
  orange: '#F97316',
  orangePress: '#E2620B',
  orangeDeep: '#C2540A',
  bg: '#F8F7F4',
  surface: '#FFFFFF',
  ink: '#111827',
  muted: '#6B7280',
  line: '#E6E2DA',
  lineWarm: '#EAE7E0',
  success: '#16A34A',
  warn: '#EAB308',
  danger: '#DC2626',
  faint: '#9A968E',
  faint2: '#B8B2A6',
  zebra: '#FAF9F6',
  fieldHover: '#F4F2EE',
};

export const FONT = {
  // Loaded via @expo-google-fonts in App.tsx
  sans: 'DMSans_400Regular',
  sansMed: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  sansHeavy: 'DMSans_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
};

// status -> label + warm pill colors
export type Status = 'draft' | 'sent' | 'opened' | 'accepted' | 'won' | 'lost';
export const STATUS: Record<Status, { label: string; bg: string; fg: string; dot: string }> = {
  draft: { label: 'Draft', bg: '#F1EFEA', fg: '#6B7280', dot: '#9CA3AF' },
  sent: { label: 'Sent', bg: '#EAF1FB', fg: '#2563EB', dot: '#3B82F6' },
  opened: { label: 'Opened', bg: '#FBF4DD', fg: '#A16207', dot: '#EAB308' },
  accepted: { label: 'Accepted', bg: '#E3F4E8', fg: '#15803D', dot: '#22C55E' },
  won: { label: 'Won', bg: '#E3F4E8', fg: '#16A34A', dot: '#16A34A' },
  lost: { label: 'Lost', bg: '#F1EFEA', fg: '#9CA3AF', dot: '#D1D5DB' },
};

export function money(n: number, bare = false): string {
  const v = Math.round(n || 0);
  return (bare ? '' : '$') + v.toLocaleString('en-US');
}
export function moneyK(n: number): string {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return '$' + Math.round(n);
}
