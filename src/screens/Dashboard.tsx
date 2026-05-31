import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, PanResponder, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, moneyK } from '../theme';
import { AppHeader, BottomNav, FAB, TabId } from '../components/Chrome';
import { StatCard, SectionHeader, Card, Skeleton, Label } from '../components/ui';
import { Icon } from '../components/Icon';
import { QuoteCard } from '../components/QuoteCard';
import type { Quote, Customer } from '../types';

const REVEAL = 152;

function SwipeRow({ children, onWon, onLost }: { children: React.ReactNode; onWon: () => void; onLost: () => void }) {
  const x = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);

  const settle = (shouldOpen: boolean) => {
    openRef.current = shouldOpen;
    setOpen(shouldOpen);
    Animated.spring(x, { toValue: shouldOpen ? -REVEAL : 0, useNativeDriver: true, friction: 9, tension: 70 }).start();
  };

  // Decide horizontal intent: enough x-movement and clearly more horizontal than vertical.
  const isHorizontal = (g: { dx: number; dy: number }) =>
    Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;

  const pan = useRef(
    PanResponder.create({
      // Capture the gesture away from the inner Pressable as soon as it's clearly a horizontal drag,
      // so a swipe never falls through to the card's onPress.
      onMoveShouldSetPanResponderCapture: (_e, g) => isHorizontal(g),
      onMoveShouldSetPanResponder: (_e, g) => isHorizontal(g),
      onPanResponderMove: (_e, g) => {
        const base = openRef.current ? -REVEAL : 0;
        let n = base + g.dx;
        n = Math.max(-REVEAL - 24, Math.min(0, n));
        x.setValue(n);
      },
      onPanResponderRelease: (_e, g) => {
        const base = openRef.current ? -REVEAL : 0;
        settle(base + g.dx < -REVEAL / 2);
      },
      onPanResponderTerminate: () => settle(openRef.current),
    }),
  ).current;

  const close = () => settle(false);

  return (
    <View style={styles.swipeWrap}>
      <View style={styles.swipeActions}>
        <Pressable onPress={() => { onWon(); close(); }} style={[styles.action, { backgroundColor: C.success }]}>
          <Icon name="check" size={20} stroke="#fff" sw={2.6} />
          <Text style={styles.actionText}>Won</Text>
        </Pressable>
        <Pressable onPress={() => { onLost(); close(); }} style={[styles.action, { backgroundColor: '#E7E2DA' }]}>
          <Icon name="x" size={20} stroke="#7A7468" sw={2.4} />
          <Text style={[styles.actionText, { color: '#7A7468' }]}>Lost</Text>
        </Pressable>
      </View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        {children}
        {/* When open, a tap anywhere on the card closes it instead of opening the quote. */}
        {open ? <Pressable onPress={close} style={StyleSheet.absoluteFill} /> : null}
      </Animated.View>
    </View>
  );
}

export function Dashboard({
  quotes, customers, loading, stats, onNewQuote, onOpenQuote, onNav, onViewAll, onMark, onBell,
}: {
  quotes: Quote[];
  customers: Customer[];
  loading: boolean;
  stats: { open: number; won: number; revenue: number };
  onNewQuote: () => void;
  onOpenQuote: (q: Quote) => void;
  onNav: (t: TabId) => void;
  onViewAll: () => void;
  onMark: (id: string, status: 'won' | 'lost') => void;
  onBell: () => void;
}) {
  const insets = useSafeAreaInsets();
  const custById = (id: string) => customers.find((c) => c.id === id);
  const recent = quotes.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader onBell={onBell} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          {loading ? (
            [0, 1, 2].map((i) => (
              <Card key={i} style={{ paddingHorizontal: 14, paddingVertical: 12, height: 92, gap: 8, flex: 1 }}>
                <Skeleton w="70%" h={9} /><Skeleton w="55%" h={22} /><Skeleton w="80%" h={9} />
              </Card>
            ))
          ) : (
            <>
              <StatCard label="Open Quotes" value={stats.open} desc="awaiting reply" />
              <StatCard label="Won · May" value={stats.won} desc="jobs booked" />
              <StatCard label="Est. Revenue" value={moneyK(stats.revenue)} desc="this month" accent />
            </>
          )}
        </View>

        <SectionHeader action="View All" onAction={onViewAll}>Recent Quotes</SectionHeader>

        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <Card key={i} style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', gap: 12 }}>
                <Skeleton w={42} h={42} r={10} />
                <View style={{ flex: 1, gap: 8, paddingTop: 2 }}>
                  <Skeleton w="55%" h={13} /><Skeleton w="75%" h={10} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Skeleton w={56} h={16} r={8} /><Skeleton w={50} h={9} />
                  </View>
                </View>
              </Card>
            ))
          ) : quotes.length === 0 ? (
            <Card style={{ paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center', gap: 12 }}>
              <View style={styles.emptyIcon}><Icon name="doc" size={22} stroke={C.orange} sw={2} /></View>
              <Text style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink }}>No quotes yet</Text>
              <Text style={{ fontSize: 13, color: C.muted, fontFamily: FONT.sans, textAlign: 'center', maxWidth: 220 }}>
                Your sent estimates show up here. Start by describing a job.
              </Text>
              <Pressable onPress={onNewQuote}><Label style={{ color: C.orange }}>+ New Quote</Label></Pressable>
            </Card>
          ) : (
            recent.map((q) => (
              <SwipeRow key={q.id} onWon={() => onMark(q.id, 'won')} onLost={() => onMark(q.id, 'lost')}>
                <QuoteCard quote={q} customer={custById(q.customerId)} onPress={() => onOpenQuote(q)} />
              </SwipeRow>
            ))
          )}
        </View>

        {!loading && quotes.length > recent.length ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            <Pressable onPress={onViewAll}>
              <Label style={{ textAlign: 'center', color: C.orange }}>
                View all {quotes.length} quotes →
              </Label>
            </Pressable>
          </View>
        ) : !loading && quotes.length > 0 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            <Label style={{ textAlign: 'center', color: C.faint2 }}>Swipe a card left for quick actions</Label>
          </View>
        ) : null}
      </ScrollView>

      <FAB onPress={onNewQuote} bottom={64 + Math.max(insets.bottom, 10) + 16} />
      <BottomNav active="dashboard" onNav={onNav} />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  swipeWrap: { borderRadius: 12, overflow: 'hidden' },
  swipeActions: { position: 'absolute', right: 0, top: 0, bottom: 0, width: REVEAL, flexDirection: 'row' },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText: { fontFamily: FONT.sansBold, fontSize: 11, color: '#fff' },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FDEAD9', alignItems: 'center', justifyContent: 'center' },
});
