import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { C, FONT } from '../../theme';
import { Label, Button, Card } from '../../components/ui';
import { Field, Input } from '../../components/Field';
import { Icon, IconName } from '../../components/Icon';
import type { Company, Trade } from '../../types';
import { EMPTY_COMPANY, TRADE_DEFAULTS, initials } from '../../seed';

const TRADES: { id: Trade; icon: IconName; blurb: string }[] = [
  { id: 'Plumbing', icon: 'doc', blurb: 'Pipes, fixtures, water heaters' },
  { id: 'Electrical', icon: 'bolt', blurb: 'Panels, wiring, fixtures' },
  { id: 'HVAC', icon: 'refresh', blurb: 'Heating, cooling, ventilation' },
  { id: 'Roofing', icon: 'home', blurb: 'Repairs, replacement, gutters' },
  { id: 'General', icon: 'edit', blurb: 'Multi-trade & remodels' },
];

const STEP_TITLES = ['Your company', 'Your trade', 'Your rates', 'Texting number', 'Try it out'];

export function Onboarding({ onDone }: { onDone: (c: Company) => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [c, setC] = useState<Company>({ ...EMPTY_COMPANY });
  const [provisioning, setProvisioning] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const set = (patch: Partial<Company>) => setC((prev) => ({ ...prev, ...patch }));

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.[0]) set({ logoUri: res.assets[0].uri });
  };

  const pickTrade = (t: Trade) => set({ trade: t, laborRate: TRADE_DEFAULTS[t] });

  const provisionNumber = () => {
    setProvisioning(true);
    setTimeout(() => {
      const area = (c.phone.replace(/\D/g, '').slice(0, 3)) || '650';
      const num = `(${area}) 555-0${Math.floor(100 + Math.random() * 800)}`;
      set({ twilioNumber: num });
      setProvisioning(false);
    }, 1400);
  };

  const canNext = () => {
    if (step === 0) return c.name.trim().length > 1 && c.phone.trim().length > 5;
    if (step === 2) return c.laborRate > 0;
    return true;
  };

  const next = () => {
    if (step < 4) setStep(step + 1);
    else onDone({ ...c, onboarded: true });
  };
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header / progress */}
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View style={styles.logoMark}><Icon name="bolt" size={13} stroke="#fff" sw={2.4} /></View>
          <Text style={{ fontFamily: FONT.sansHeavy, fontSize: 18, color: C.navy, letterSpacing: -0.3 }}>Quoted</Text>
          <View style={{ flex: 1 }} />
          <Label>Step {step + 1} of 5</Label>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((step + 1) / 5) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>{STEP_TITLES[step]}</Text>

        {step === 0 && (
          <View style={{ gap: 16, marginTop: 18 }}>
            <Pressable onPress={pickLogo} style={styles.logoUpload}>
              {c.logoUri ? (
                <Image source={{ uri: c.logoUri }} style={{ width: 76, height: 76, borderRadius: 14 }} />
              ) : (
                <View style={styles.logoPlaceholder}><Icon name="image" size={26} stroke={C.orange} sw={1.9} /></View>
              )}
              <Label style={{ color: C.orange }}>{c.logoUri ? 'Change logo' : 'Upload logo'}</Label>
            </Pressable>
            <Field label="Company name"><Input value={c.name} onChangeText={(v) => set({ name: v, owner: c.owner || v })} placeholder="Mike Torrance Plumbing" /></Field>
            <Field label="Owner name"><Input value={c.owner} onChangeText={(v) => set({ owner: v })} placeholder="Mike Torrance" /></Field>
            <Field label="License number"><Input value={c.license} onChangeText={(v) => set({ license: v })} placeholder="CA C-36 #1098423" autoCapitalize="characters" /></Field>
            <Field label="Phone"><Input value={c.phone} onChangeText={(v) => set({ phone: v })} placeholder="(650) 555-0142" keyboardType="phone-pad" /></Field>
            <Field label="Email"><Input value={c.email} onChangeText={(v) => set({ email: v })} placeholder="mike@torranceplumbing.com" keyboardType="email-address" autoCapitalize="none" /></Field>
          </View>
        )}

        {step === 1 && (
          <View style={{ gap: 10, marginTop: 18 }}>
            {TRADES.map((t) => {
              const on = c.trade === t.id;
              return (
                <Pressable key={t.id} onPress={() => pickTrade(t.id)}>
                  <Card strong={on} style={[styles.tradeRow, on && { backgroundColor: '#FEF6EF' }]}>
                    <View style={[styles.tradeIcon, { backgroundColor: on ? C.orange : '#F1EFEA' }]}>
                      <Icon name={t.icon} size={22} stroke={on ? '#fff' : C.navy} sw={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink }}>{t.id}</Text>
                      <Text style={{ fontSize: 12, color: C.muted, fontFamily: FONT.sans }}>{t.blurb}</Text>
                    </View>
                    {on ? <Icon name="check" size={22} stroke={C.orange} sw={2.6} /> : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 16, marginTop: 18 }}>
            <Text style={styles.sub}>We seeded a typical {c.trade.toLowerCase()} rate. Adjust to match your shop.</Text>
            <Field label="Default labor rate" hint="$ per hour">
              <Input value={String(c.laborRate)} onChangeText={(v) => set({ laborRate: parseInt(v.replace(/\D/g, '')) || 0 })} keyboardType="number-pad" prefix="$" />
            </Field>
            <Field label="Material markup" hint="%">
              <Input value={String(c.markup)} onChangeText={(v) => set({ markup: parseInt(v.replace(/\D/g, '')) || 0 })} keyboardType="number-pad" />
            </Field>
            <Card style={{ padding: 16, gap: 6, backgroundColor: '#F1EFEA' }}>
              <Label>How it works</Label>
              <Text style={{ fontSize: 13, color: C.ink, fontFamily: FONT.sans, lineHeight: 19 }}>
                The AI prices every estimate against these defaults — labor at your hourly rate, materials with your markup already baked in. You can still edit any line before sending.
              </Text>
            </Card>
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: 16, marginTop: 18 }}>
            <Text style={styles.sub}>This is the number Quoted will use to send follow-up texts to your customers on your behalf. Customers get your estimates by text from this dedicated number — so replies come straight back to you.</Text>
            {c.twilioNumber ? (
              <Card strong style={{ padding: 20, alignItems: 'center', gap: 8, backgroundColor: '#E3F4E8' }}>
                <View style={styles.successCircle}><Icon name="check" size={26} stroke="#fff" sw={2.8} /></View>
                <Label style={{ color: C.success }}>Your texting number</Label>
                <Text style={{ fontFamily: FONT.monoBold, fontSize: 24, color: C.navy }}>{c.twilioNumber}</Text>
                <Text style={{ fontSize: 12, color: C.muted, fontFamily: FONT.sans, textAlign: 'center' }}>Connected and ready. This stays invisible to your customers — texts appear from your brand.</Text>
              </Card>
            ) : (
              <Card style={{ padding: 24, alignItems: 'center', gap: 14 }}>
                <View style={styles.phoneCircle}><Icon name="phone" size={28} stroke={C.navy} sw={1.9} /></View>
                <Text style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink, textAlign: 'center' }}>Get a number for outbound texts</Text>
                <Button variant="navy" icon="phone" loading={provisioning} onPress={provisionNumber}>
                  {provisioning ? 'Connecting…' : 'Connect a number'}
                </Button>
              </Card>
            )}
            <Text style={{ fontSize: 11, color: C.faint2, fontFamily: FONT.sans, textAlign: 'center' }}>Powered by Twilio — no setup on your end.</Text>
          </View>
        )}

        {step === 4 && (
          <View style={{ gap: 16, marginTop: 18, alignItems: 'center' }}>
            <View style={styles.bigBolt}><Icon name="bolt" size={36} stroke="#fff" sw={2.2} /></View>
            <Text style={{ fontFamily: FONT.sansBold, fontSize: 18, color: C.ink, textAlign: 'center' }}>You're set up, {c.owner || 'partner'}.</Text>
            <Text style={[styles.sub, { textAlign: 'center' }]}>Send yourself a sample estimate to feel exactly what your customers will see.</Text>
            {testSent ? (
              <Card strong style={{ padding: 18, alignItems: 'center', gap: 6, backgroundColor: '#E3F4E8', width: '100%' }}>
                <Icon name="check" size={24} stroke={C.success} sw={2.6} />
                <Text style={{ fontFamily: FONT.sansBold, fontSize: 15, color: C.navy }}>Test estimate sent to {c.phone || 'your phone'}</Text>
              </Card>
            ) : (
              <Button variant="outline" icon="sms" onPress={() => setTestSent(true)}>Send me a test estimate</Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {step > 0 ? (
            <Pressable onPress={back} style={styles.backBtn}><Text style={styles.backText}>Back</Text></Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button variant="primary" disabled={!canNext()} onPress={next} icon={step === 4 ? 'arrowR' : undefined}>
              {step === 4 ? 'Enter Quoted' : 'Continue'}
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logoMark: { width: 20, height: 20, borderRadius: 5, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: C.lineWarm, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.orange },
  h1: { fontFamily: FONT.sansHeavy, fontSize: 26, color: C.navy, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: C.muted, fontFamily: FONT.sans, lineHeight: 20 },
  logoUpload: { alignItems: 'center', gap: 8, marginBottom: 4 },
  logoPlaceholder: { width: 76, height: 76, borderRadius: 14, borderWidth: 1.5, borderColor: '#CFC9BD', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDEAD9' },
  tradeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  tradeIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  successCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  phoneCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F1EFEA', alignItems: 'center', justifyContent: 'center' },
  bigBolt: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  backBtn: { height: 54, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: FONT.sansBold, fontSize: 16, color: C.muted },
});
