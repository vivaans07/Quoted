import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, ViewStyle, TextStyle, StyleProp, ActivityIndicator, TextInput,
} from 'react-native';
import { C, FONT, STATUS, Status, money as fmtMoney } from '../theme';
import { Icon, IconName } from './Icon';

// ── Search field ───────────────────────────────────────────────
export function SearchField({
  value, onChange, placeholder = 'Search', style,
}: { value: string; onChange: (t: string) => void; placeholder?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.search, style]}>
      <SearchIcon />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.faint2}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Icon name="x" size={16} stroke={C.faint} sw={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SearchIcon() {
  // Inline magnifier (not in the shared Icon set)
  return (
    <View style={{ width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: C.faint }} />
      <View style={{ position: 'absolute', right: 0, bottom: 0, width: 6, height: 2, borderRadius: 1, backgroundColor: C.faint, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

// ── Filter chips (single-select) ───────────────────────────────
export function FilterChips<T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Tracked uppercase micro-label (the signature) ──────────────
export function Label({ children, style, numberOfLines }: { children: React.ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return <Text numberOfLines={numberOfLines} style={[styles.lbl, style]}>{children}</Text>;
}

// ── Card: white, hairline border, no shadow ────────────────────
export function Card({
  children, style, strong, onPress,
}: { children: React.ReactNode; style?: StyleProp<ViewStyle>; strong?: boolean; onPress?: () => void }) {
  const body = (
    <View style={[styles.card, strong && styles.cardStrong, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.92 }}>
        {body}
      </Pressable>
    );
  }
  return body;
}

// ── Status badge ───────────────────────────────────────────────
export function Badge({ status, small }: { status: Status; small?: boolean }) {
  const s = STATUS[status] || STATUS.draft;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }, small && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Text style={[styles.badgeText, { color: s.fg, fontSize: small ? 10 : 11 }]}>
        {s.label.toUpperCase()}
      </Text>
    </View>
  );
}

// ── Button ─────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'navy' | 'success' | 'outline' | 'ghost';
export function Button({
  children, variant = 'primary', onPress, disabled, icon, style, loading,
}: {
  children: React.ReactNode; variant?: BtnVariant; onPress?: () => void;
  disabled?: boolean; icon?: IconName; style?: StyleProp<ViewStyle>; loading?: boolean;
}) {
  const map: Record<BtnVariant, { bg: string; fg: string; border?: string; pressBg?: string }> = {
    primary: { bg: C.orange, fg: '#fff', pressBg: C.orangePress },
    navy: { bg: C.navy, fg: '#fff', pressBg: C.navyPress },
    success: { bg: C.success, fg: '#fff' },
    outline: { bg: C.surface, fg: C.navy, border: C.navy, pressBg: C.fieldHover },
    ghost: { bg: 'transparent', fg: C.muted },
  };
  const m = map[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: pressed && m.pressBg ? m.pressBg : m.bg },
        m.border ? { borderWidth: 1.5, borderColor: m.border } : null,
        (disabled || loading) && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={m.fg} />
      ) : (
        <View style={styles.btnRow}>
          {icon && <Icon name={icon} size={20} stroke={m.fg} sw={2.4} />}
          <Text style={[styles.btnText, { color: m.fg }]}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Money: tabular mono numerals ───────────────────────────────
const SIZE: Record<string, number> = { sm: 14, md: 17, lg: 22, xl: 34, xxl: 40 };
export function Money({
  value, size = 'md', color = C.ink, bold, style,
}: { value: number; size?: keyof typeof SIZE; color?: string; bold?: boolean; style?: StyleProp<TextStyle> }) {
  const fs = SIZE[size];
  return (
    <Text style={[{ fontFamily: bold ? FONT.monoBold : FONT.mono, fontSize: fs, color, letterSpacing: -0.5 }, style]}>
      <Text style={{ opacity: 0.5 }}>$</Text>
      {Math.round(value || 0).toLocaleString('en-US')}
    </Text>
  );
}

// ── Stat card ──────────────────────────────────────────────────
export function StatCard({ label, value, desc, accent }: { label: string; value: string | number; desc?: string; accent?: boolean }) {
  return (
    <Card style={styles.statCard}>
      <Label numberOfLines={1} style={{ textAlign: 'center' }}>{label}</Label>
      <Text numberOfLines={1} style={{ fontFamily: FONT.monoBold, fontSize: 23, color: accent ? C.orange : C.ink, textAlign: 'center' }}>{value}</Text>
      {desc ? <Text numberOfLines={1} style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>{desc}</Text> : null}
    </Card>
  );
}

// ── Avatar (initials) ──────────────────────────────────────────
export function Avatar({ initials, size = 44, tone = 'navy' }: { initials: string; size?: number; tone?: 'navy' | 'orange' }) {
  const bg = tone === 'orange' ? '#FDEAD9' : '#E7EAF1';
  const fg = tone === 'orange' ? '#C2540A' : C.navy;
  return (
    <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: FONT.sansBold, color: fg, fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// ── Divider ────────────────────────────────────────────────────
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: C.line }, style]} />;
}

// ── Skeleton shimmer ───────────────────────────────────────────
export function Skeleton({ w = '100%' as number | string, h = 14, r = 6, style }: { w?: number | string; h?: number; r?: number; style?: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(a, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] });
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: C.lineWarm, opacity }, style]} />;
}

// ── Section header ─────────────────────────────────────────────
export function SectionHeader({ children, action, onAction }: { children: React.ReactNode; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Label>{children}</Label>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Label style={{ color: C.orange }}>{action}</Label>
          <Icon name="chevR" size={13} stroke={C.orange} sw={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lbl: {
    fontFamily: FONT.mono,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    color: C.faint,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
  },
  cardStrong: { borderWidth: 1.5, borderColor: C.navy },
  statCard: { paddingHorizontal: 14, paddingVertical: 12, gap: 6, flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: FONT.monoBold, letterSpacing: 0.8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  btn: {
    height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontFamily: FONT.sansBold, fontSize: 17 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10,
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line,
    backgroundColor: C.surface, paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1, fontFamily: FONT.sans, fontSize: 15, color: C.ink, padding: 0,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 13, height: 32, borderRadius: 999, borderWidth: 1,
    borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
  },
  chipOn: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontFamily: FONT.sansMed, fontSize: 13, color: C.muted },
  chipTextOn: { color: '#fff', fontFamily: FONT.sansBold },
});

export { fmtMoney };
