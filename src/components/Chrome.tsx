import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT } from '../theme';
import { Icon, IconName } from './Icon';

export type TabId = 'dashboard' | 'quotes' | 'customers' | 'settings';

// ── Top bar: logo left, bell right ─────────────────────────────
export function AppHeader({ onBell, notif = true }: { onBell?: () => void; notif?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.logoMark}><Icon name="bolt" size={15} stroke={C.orange} sw={2.4} /></View>
          <Text style={styles.wordmark}>Quoted<Text style={{ color: C.orange }}>.</Text></Text>
        </View>
        <Pressable onPress={onBell} hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={22} stroke={C.navy} sw={1.9} />
          {notif ? <View style={styles.notifDot} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

// ── Title bar (non-tab screens) ────────────────────────────────
export function TitleBar({ title, onBack, action }: { title: string; onBack?: () => void; action?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={[styles.headerRow, { paddingHorizontal: 8 }]}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Icon name="chevR" size={22} stroke={C.navy} sw={2.2} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ minWidth: 44, height: 40, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 8 }}>{action}</View>
      </View>
    </View>
  );
}

// ── Bottom nav ─────────────────────────────────────────────────
const NAV_ITEMS: { id: TabId; icon: IconName; label: string }[] = [
  { id: 'dashboard', icon: 'home', label: 'Home' },
  { id: 'quotes', icon: 'doc', label: 'Quotes' },
  { id: 'customers', icon: 'users', label: 'Customers' },
  { id: 'settings', icon: 'gear', label: 'Settings' },
];
export function BottomNav({ active, onNav }: { active: TabId; onNav: (t: TabId) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.navRow}>
        {NAV_ITEMS.map((it) => {
          const on = active === it.id;
          const tint = on ? C.orange : 'rgba(255,255,255,0.62)';
          return (
            <Pressable key={it.id} onPress={() => onNav(it.id)} style={styles.navBtn}>
              {on ? <View style={styles.navIndicator} /> : null}
              <Icon name={it.icon} size={23} stroke={tint} sw={2} />
              <Text style={[styles.navLabel, { color: tint }]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── FAB ────────────────────────────────────────────────────────
export function FAB({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom }, pressed && { transform: [{ scale: 0.95 }] }]}
    >
      <Icon name="plus" size={26} stroke="#fff" sw={2.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: C.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  headerRow: {
    height: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  logoMark: { width: 26, height: 26, borderRadius: 6, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: FONT.display, fontSize: 19, letterSpacing: 0.4, color: C.navy, textTransform: 'uppercase' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange, borderWidth: 2, borderColor: C.bg },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '180deg' }] },
  title: { fontFamily: FONT.sansBold, fontSize: 17, color: C.ink },
  nav: { backgroundColor: C.navy },
  navRow: { flexDirection: 'row', height: 64 },
  navBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIndicator: { position: 'absolute', top: 0, width: 36, height: 3, borderRadius: 2, backgroundColor: C.orange },
  navLabel: { fontFamily: FONT.sansMed, fontSize: 10, letterSpacing: 0.3 },
  fab: {
    position: 'absolute', right: 18, width: 54, height: 54, borderRadius: 15,
    backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.orangePress,
    shadowColor: C.orange, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8,
    zIndex: 30,
  },
});
