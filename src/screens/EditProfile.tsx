import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { C, FONT } from '../theme';
import { TitleBar } from '../components/Chrome';
import { Label, Card, Button, SectionHeader } from '../components/ui';
import { Field, Input } from '../components/Field';
import { Icon, IconName } from '../components/Icon';
import type { Company, Trade } from '../types';
import { TRADE_DEFAULTS } from '../seed';

const TRADES: { id: Trade; icon: IconName }[] = [
  { id: 'Plumbing', icon: 'doc' },
  { id: 'Electrical', icon: 'bolt' },
  { id: 'HVAC', icon: 'refresh' },
  { id: 'Roofing', icon: 'home' },
  { id: 'General', icon: 'edit' },
];

export function EditProfile({ company, onBack, onSave, onToast }: {
  company: Company; onBack: () => void; onSave: (c: Company) => void; onToast: (msg: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [c, setC] = useState<Company>({ ...company });
  const set = (patch: Partial<Company>) => setC((prev) => ({ ...prev, ...patch }));

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { onToast('Photo permission needed'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.[0]) set({ logoUri: res.assets[0].uri });
  };

  const canSave = c.name.trim().length > 1 && c.laborRate > 0;

  const save = () => {
    onSave({ ...c, name: c.name.trim(), owner: c.owner.trim() });
    onToast('Profile updated');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      <TitleBar
        title="Edit Profile"
        onBack={onBack}
        action={<Pressable onPress={save} disabled={!canSave} hitSlop={8}><Label style={{ color: canSave ? C.orange : C.faint2 }}>Save</Label></Pressable>}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={{ alignItems: 'center', paddingTop: 20 }}>
          <Pressable onPress={pickLogo} style={{ alignItems: 'center', gap: 8 }}>
            {c.logoUri ? (
              <Image source={{ uri: c.logoUri }} style={{ width: 84, height: 84, borderRadius: 18 }} />
            ) : (
              <View style={styles.logoPlaceholder}><Text style={{ fontFamily: FONT.sansHeavy, fontSize: 30, color: C.navy }}>{(c.name || 'Q')[0]}</Text></View>
            )}
            <Label style={{ color: C.orange }}>{c.logoUri ? 'Change logo' : 'Upload logo'}</Label>
          </Pressable>
        </View>

        <SectionHeader>Company</SectionHeader>
        <View style={styles.section}>
          <Field label="Company name"><Input value={c.name} onChangeText={(v) => set({ name: v })} placeholder="Mike Torrance Plumbing" /></Field>
          <Field label="Owner name"><Input value={c.owner} onChangeText={(v) => set({ owner: v })} placeholder="Mike Torrance" /></Field>
          <Field label="License number"><Input value={c.license} onChangeText={(v) => set({ license: v })} placeholder="CA C-36 #1098423" autoCapitalize="characters" /></Field>
        </View>

        <SectionHeader>Trade</SectionHeader>
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TRADES.map((t) => {
            const on = c.trade === t.id;
            return (
              <Pressable key={t.id} onPress={() => set({ trade: t.id, laborRate: c.laborRate || TRADE_DEFAULTS[t.id] })} style={[styles.tradeChip, on && styles.tradeChipOn]}>
                <Icon name={t.icon} size={16} stroke={on ? '#fff' : C.navy} sw={2} />
                <Text style={{ fontFamily: FONT.sansBold, fontSize: 14, color: on ? '#fff' : C.navy }}>{t.id}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionHeader>Estimate Defaults</SectionHeader>
        <View style={styles.section}>
          <Field label="Default labor rate" hint="$ per hour">
            <Input value={String(c.laborRate)} onChangeText={(v) => set({ laborRate: parseInt(v.replace(/\D/g, '')) || 0 })} keyboardType="number-pad" prefix="$" />
          </Field>
          <Field label="Material markup" hint="%">
            <Input value={String(c.markup)} onChangeText={(v) => set({ markup: parseInt(v.replace(/\D/g, '')) || 0 })} keyboardType="number-pad" />
          </Field>
        </View>

        <SectionHeader>Texting & Contact</SectionHeader>
        <View style={styles.section}>
          <Field label="Texting number" hint="Twilio">
            <Input value={c.twilioNumber || ''} onChangeText={(v) => set({ twilioNumber: v })} placeholder="(650) 555-0142" keyboardType="phone-pad" />
          </Field>
          <Field label="Phone"><Input value={c.phone} onChangeText={(v) => set({ phone: v })} placeholder="(650) 555-0142" keyboardType="phone-pad" /></Field>
          <Field label="Email"><Input value={c.email} onChangeText={(v) => set({ email: v })} placeholder="mike@torranceplumbing.com" keyboardType="email-address" autoCapitalize="none" /></Field>
          <Field label="City / service area" hint="optional"><Input value={c.city} onChangeText={(v) => set({ city: v })} placeholder="Palo Alto, CA" /></Field>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button variant="primary" icon="check" disabled={!canSave} onPress={save}>Save changes</Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logoPlaceholder: { width: 84, height: 84, borderRadius: 18, backgroundColor: '#E7EAF1', alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 20, gap: 14 },
  tradeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface },
  tradeChipOn: { backgroundColor: C.navy, borderColor: C.navy },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
});
