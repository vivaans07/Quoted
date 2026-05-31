import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT } from '../theme';
import { Label, Card, Button } from './ui';
import { Icon } from './Icon';
import * as Billing from '../purchases';

const PRO_PERKS = [
  'Unlimited AI estimates',
  'Send estimates by text from your number',
  'Customer accept / question page',
  'PDF export & branded invoices',
  'Cloud sync across devices',
];

export function Paywall({ visible, onClose, onPurchased, onToast }: {
  visible: boolean;
  onClose: () => void;
  onPurchased: () => void;
  onToast: (msg: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<Billing.PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Billing.getPlans().then((p) => { setPlans(p); setLoading(false); });
  }, [visible]);

  const buy = async (plan: Billing.PlanOption) => {
    setBusyId(plan.id);
    const { ok, cancelled } = await Billing.purchase(plan);
    setBusyId(null);
    if (ok) { onToast('You’re on Quoted Pro 🎉'); onPurchased(); onClose(); }
    else if (!cancelled) onToast('Purchase didn’t complete — try again');
  };

  const restore = async () => {
    setBusyId('restore');
    const ok = await Billing.restore();
    setBusyId(null);
    if (ok) { onToast('Purchases restored'); onPurchased(); onClose(); }
    else onToast('No previous purchase found');
  };

  // Billing not configured (no key, or running in Expo Go) → honest message.
  const notConfigured = !Billing.billingConfigured;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.grabber} />
        <View style={styles.head}>
          <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
          <Pressable onPress={onClose} hitSlop={10}><Icon name="x" size={20} stroke={C.muted} sw={2.2} /></Pressable>
        </View>

        <Text style={styles.title}>Quoted Pro</Text>
        <Text style={styles.sub}>Win more jobs with the full toolkit.</Text>

        <View style={{ gap: 10, marginTop: 18, marginBottom: 20 }}>
          {PRO_PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <View style={styles.perkCheck}><Icon name="check" size={14} stroke="#fff" sw={2.8} /></View>
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {notConfigured ? (
          <Card style={{ padding: 16, gap: 6, backgroundColor: C.zebra }}>
            <Label>Billing not connected</Label>
            <Text style={styles.note}>
              In-app purchases run in a development build, not Expo Go. Add your RevenueCat keys to
              mobile/.env and build a dev client to enable checkout.
            </Text>
          </Card>
        ) : loading ? (
          <View style={{ paddingVertical: 28 }}><ActivityIndicator color={C.navy} /></View>
        ) : plans.length === 0 ? (
          <Card style={{ padding: 16, gap: 6, backgroundColor: C.zebra }}>
            <Label>No plans available</Label>
            <Text style={styles.note}>
              Create an offering with at least one package in the RevenueCat dashboard, then reopen this screen.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {plans.map((plan) => (
              <Pressable key={plan.id} onPress={() => buy(plan)} disabled={!!busyId}>
                <Card strong style={styles.planRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    {plan.period ? <Text style={styles.planPeriod}>Billed per {plan.period}</Text> : null}
                  </View>
                  {busyId === plan.id ? (
                    <ActivityIndicator color={C.orange} />
                  ) : (
                    <Text style={styles.planPrice}>{plan.priceString}{plan.period ? `/${plan.period[0]}` : ''}</Text>
                  )}
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {!notConfigured ? (
          <Pressable onPress={restore} disabled={!!busyId} style={{ paddingVertical: 16, alignItems: 'center' }}>
            <Label style={{ color: C.orange }}>{busyId === 'restore' ? 'Restoring…' : 'Restore purchases'}</Label>
          </Pressable>
        ) : (
          <View style={{ marginTop: 16 }}>
            <Button variant="outline" onPress={onClose}>Got it</Button>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, paddingTop: 10, paddingHorizontal: 20 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D8D3C8', marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  proBadge: { backgroundColor: C.navy, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  proBadgeText: { fontFamily: FONT.monoBold, fontSize: 11, letterSpacing: 1, color: '#fff' },
  title: { fontFamily: FONT.sansHeavy, fontSize: 26, color: C.navy, marginTop: 4 },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.muted, marginTop: 2 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  perkText: { fontFamily: FONT.sansMed, fontSize: 15, color: C.ink, flex: 1 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  planTitle: { fontFamily: FONT.sansBold, fontSize: 16, color: C.ink },
  planPeriod: { fontFamily: FONT.sans, fontSize: 12, color: C.muted, marginTop: 2 },
  planPrice: { fontFamily: FONT.monoBold, fontSize: 18, color: C.orange, letterSpacing: -0.5 },
  note: { fontFamily: FONT.sans, fontSize: 13, color: C.muted, lineHeight: 19 },
});
