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
  sansSemi: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  sansHeavy: 'DMSans_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
  monoSemi: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
  monoHeavy: 'JetBrainsMono_800ExtraBold',
  // Space Grotesk — the display/wordmark face from the design
  display: 'SpaceGrotesk_700Bold',
  displaySemi: 'SpaceGrotesk_600SemiBold',
  displayMed: 'SpaceGrotesk_500Medium',
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

// ── Dashboard metrics, derived entirely from the real quotes list ──
// No fabricated numbers: every value below is computed from `quotes`.
type QuoteLike = { amount: number; status: Status };
export type DashMetrics = {
  open: number; sent: number; won: number; lost: number;
  winRate: number; delta: number; revenue: number;
  spark: number[]; openBars: number[];
  pipeline: { key: Status; label: string; value: number; color: string }[];
};
export function dashboardMetrics(quotes: QuoteLike[], revenue: number): DashMetrics {
  const count = (s: Status) => quotes.filter((q) => q.status === s).length;
  const draft = count('draft');
  const sentS = count('sent');
  const opened = count('opened');
  const accepted = count('accepted');
  const won = count('won');
  const lost = count('lost');
  const open = sentS + opened + accepted;
  // "Sent" = every quote that left as an estimate (anything past draft).
  const sentTotal = sentS + opened + accepted + won + lost;
  const decided = won + lost;
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : 0;

  // Cumulative non-lost revenue, oldest → newest, as a rising trend line.
  const series: number[] = [];
  let acc = 0;
  quotes
    .filter((q) => q.status !== 'lost')
    .slice()
    .reverse()
    .forEach((q) => { acc += q.amount; series.push(acc); });
  const spark = series.length > 1 ? series : [0, Math.max(revenue, 1)];
  const first = spark[0] || 0;
  const last = spark[spark.length - 1] || 0;
  const delta = first > 0 ? Math.round(((last - first) / first) * 100) : 0;

  const pipeline = [
    { key: 'draft' as Status, label: 'Draft', value: draft, color: '#C9C3B6' },
    { key: 'sent' as Status, label: 'Sent', value: sentS, color: '#3B82F6' },
    { key: 'opened' as Status, label: 'Opened', value: opened, color: '#EAB308' },
    { key: 'won' as Status, label: 'Won', value: won, color: '#16A34A' },
  ].filter((p) => p.value > 0);

  const openBars = [draft, sentS, opened, won].map((v) => v || 0);

  return { open, sent: sentTotal, won, lost, winRate, delta, revenue, spark, openBars, pipeline };
}
