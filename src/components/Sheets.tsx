import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { C, FONT, money } from '../theme';
import { Avatar, Label, Card, Button } from './ui';
import { Field, Input } from './Field';
import { Icon, IconName } from './Icon';
import { initials as toInitials } from '../seed';
import { sendSMS } from '../api';
import { API_URL } from '../config';
import type { Customer, Estimate, Company } from '../types';

function SheetShell({ visible, onClose, onBack, title, children }: { visible: boolean; onClose: () => void; onBack?: () => void; title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onBack || onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            {onBack ? (
              <Pressable onPress={onBack} hitSlop={10} style={{ marginRight: 10, transform: [{ rotate: '180deg' }] }}>
                <Icon name="chevR" size={22} stroke={C.navy} sw={2.2} />
              </Pressable>
            ) : null}
            <Text style={[styles.sheetTitle, { flex: 1 }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}><Icon name="x" size={20} stroke={C.muted} sw={2.2} /></Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const EMPTY_FORM = { name: '', phone: '', email: '', address: '' };

export function CustomerSheet({ visible, customers, onClose, onPick }: {
  visible: boolean; customers: Customer[]; onClose: () => void; onPick: (c: Customer) => void;
}) {
  const [mode, setMode] = useState<'list' | 'new'>('list');
  const [form, setForm] = useState(EMPTY_FORM);

  // reset to the list whenever the sheet reopens
  useEffect(() => {
    if (visible) { setMode('list'); setForm(EMPTY_FORM); }
  }, [visible]);

  const set = (patch: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...patch }));
  const canSave = form.name.trim().length > 1;

  const save = () => {
    const c: Customer = {
      id: 'c' + Date.now(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      initials: toInitials(form.name),
    };
    onPick(c);
  };

  if (mode === 'new') {
    return (
      <SheetShell visible={visible} onClose={onClose} onBack={() => setMode('list')} title="New customer">
        <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Field label="Name"><Input value={form.name} onChangeText={(v) => set({ name: v })} placeholder="Sarah Chen" autoFocus /></Field>
          <Field label="Phone"><Input value={form.phone} onChangeText={(v) => set({ phone: v })} placeholder="(650) 555-0188" keyboardType="phone-pad" /></Field>
          <Field label="Email"><Input value={form.email} onChangeText={(v) => set({ email: v })} placeholder="sarah.chen@gmail.com" keyboardType="email-address" autoCapitalize="none" /></Field>
          <Field label="Address" hint="optional"><Input value={form.address} onChangeText={(v) => set({ address: v })} placeholder="418 Hamilton Ave, Palo Alto" /></Field>
          <View style={{ marginTop: 4 }}>
            <Button variant="primary" icon="check" disabled={!canSave} onPress={save}>Save customer</Button>
          </View>
        </ScrollView>
      </SheetShell>
    );
  }

  return (
    <SheetShell visible={visible} onClose={onClose} title="Choose customer">
      <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setMode('new')} style={styles.newCust}>
          <View style={styles.newCustIcon}><Icon name="plus" size={20} stroke={C.orange} sw={2.2} /></View>
          <Text style={{ fontFamily: FONT.sansBold, fontSize: 15, color: C.navy }}>New customer</Text>
        </Pressable>
        {customers.map((c) => (
          <Pressable key={c.id} onPress={() => onPick(c)} style={styles.custRow}>
            <Avatar initials={c.initials} size={40} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: FONT.sansMed, fontSize: 15, color: C.ink }}>{c.name}</Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: C.muted, fontFamily: FONT.sans }}>{c.address || c.phone}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SheetShell>
  );
}

export function SendSheet({ visible, estimate, customer, company, onClose, onSent }: {
  visible: boolean; estimate: Estimate | null; customer: Customer | null; company: Company;
  onClose: () => void; onSent: (channel: string, shareId: string) => void;
}) {
  // Generate a stable shareId once per open so the preview link doesn't change on re-renders.
  const shareIdRef = useRef<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible && !shareIdRef.current) {
      shareIdRef.current = Math.random().toString(36).slice(2, 9);
    }
    if (!visible) {
      shareIdRef.current = '';
      setCopied(false);
    }
  }, [visible]);

  if (!estimate) return null;

  const shareId = shareIdRef.current || Math.random().toString(36).slice(2, 9);
  const link = `${API_URL}/e/${shareId}`;
  const range = `${money(estimate.estimate_range.low)}–${money(estimate.estimate_range.high)}`;
  const preview = `Hi ${customer?.name?.split(' ')[0] || 'there'}, it's ${company.owner || company.name || 'your contractor'} with ${company.name || 'us'}. Here's your estimate for ${estimate.job_summary.split(',')[0].toLowerCase()}: ${range}. View the full breakdown here: ${link}`;

  const channels: { id: string; icon: IconName; label: string; sub: string }[] = [
    { id: 'SMS', icon: 'sms', label: 'Text message', sub: customer?.phone || 'Opens your messages app' },
    { id: 'Email', icon: 'mail', label: 'Email', sub: customer?.email || 'Opens your mail app' },
    { id: 'Copy link', icon: 'link', label: 'Copy link', sub: 'Share it anywhere' },
  ];

  const handle = async (id: string) => {
    try {
      if (id === 'SMS') {
        const phone = (customer?.phone || '').replace(/[^\d+]/g, '');
        // Try Twilio via backend first; fall back to native SMS composer.
        const sent = phone ? await sendSMS(phone, preview) : false;
        if (!sent) {
          await Linking.openURL(`sms:${phone}?body=${encodeURIComponent(preview)}`).catch(() => {});
        }
      } else if (id === 'Email') {
        const subj = encodeURIComponent(`Your estimate from ${company.name || 'us'}`);
        await Linking.openURL(`mailto:${customer?.email || ''}?subject=${subj}&body=${encodeURIComponent(preview)}`).catch(() => {});
      } else if (id === 'Copy link') {
        await Clipboard.setStringAsync(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // ignore composer failures — we still record the send below
    }
    onSent(id, shareId);
  };

  return (
    <SheetShell visible={visible} onClose={onClose} title="Send estimate">
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <Label style={{ marginBottom: 6 }}>Message preview</Label>
        <Card style={{ padding: 14, backgroundColor: C.zebra, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: C.ink, fontFamily: FONT.sans, lineHeight: 20 }}>{preview}</Text>
        </Card>
        <View style={{ gap: 10 }}>
          {channels.map((ch) => (
            <Pressable key={ch.id} onPress={() => handle(ch.id)}>
              <Card style={styles.channel}>
                <View style={styles.channelIcon}><Icon name={ch.icon} size={22} stroke={C.navy} sw={2} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansBold, fontSize: 15, color: C.ink }}>{ch.label}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: C.muted, fontFamily: FONT.sans }}>{ch.id === 'Copy link' && copied ? 'Copied!' : ch.sub}</Text>
                </View>
                <Icon name="chevR" size={18} stroke="#9CA3AF" sw={2} />
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
    </SheetShell>
  );
}

// sms: URI param separator differs by platform (?body on iOS, &body on Android)
function Platform_sep() {
  // iOS uses '&' after the number too in practice; '?' before body is safest cross-platform.
  return '?';
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line, paddingTop: 10 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D8D3C8', marginBottom: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14 },
  sheetTitle: { fontFamily: FONT.sansBold, fontSize: 17, color: C.ink },
  newCust: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#CFC9BD', borderStyle: 'dashed', marginBottom: 8 },
  newCustIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FDEAD9', alignItems: 'center', justifyContent: 'center' },
  custRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12 },
  channel: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  channelIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F1EFEA', alignItems: 'center', justifyContent: 'center' },
});
