import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT } from '../theme';
import { TitleBar } from '../components/Chrome';
import { Label, Card, Avatar, Button } from '../components/ui';
import { TextArea } from '../components/Field';
import { Icon } from '../components/Icon';
import type { Customer } from '../types';

const HINT = 'Describe the job…  e.g. leaky pipe under kitchen sink, older home, two-story';

export function NewQuote({
  customer, draft, onBack, onPickCustomer, onGenerate, onDraftChange, onToast,
}: {
  customer: Customer | null;
  draft: string;
  onBack: () => void;
  onPickCustomer: () => void;
  onGenerate: (text: string) => void;
  onDraftChange: (t: string) => void;
  onToast: (msg: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(draft);
  const canGo = text.trim().length > 6;

  const change = (t: string) => { setText(t); onDraftChange(t); };

  // ── Voice input via the Web Speech API ────────────────────────────
  // The Web Speech API is the device speech-to-text on the web build. Expo Go
  // on a phone has no JS-accessible speech recognizer, so we degrade honestly.
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  const SpeechRecognition =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const voiceSupported = !!SpeechRecognition;

  // Stop listening if the screen unmounts.
  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch {} }, []);

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  };

  const startListening = () => {
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = text ? text.trim() + ' ' : '';

    rec.onresult = (e: any) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      change(baseTextRef.current + transcript);
    };
    rec.onerror = (e: any) => {
      setListening(false);
      onToast(e?.error === 'not-allowed' ? 'Microphone permission needed' : 'Voice input failed — try typing');
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      onToast('Voice input failed — try typing');
    }
  };

  const onMic = () => {
    if (!voiceSupported) {
      onToast('Voice input isn’t available here — type the job for now');
      return;
    }
    if (listening) stopListening();
    else startListening();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      <TitleBar title="New Quote" onBack={onBack} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Customer */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Label style={{ marginBottom: 6 }}>Customer</Label>
          <Card onPress={onPickCustomer} style={styles.customerRow}>
            {customer ? (
              <Avatar initials={customer.initials} size={40} />
            ) : (
              <View style={styles.addAvatar}><Icon name="plus" size={20} stroke={C.muted} sw={2.2} /></View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink }}>{customer ? customer.name : 'Add customer'}</Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: C.muted, fontFamily: FONT.sans }}>{customer ? customer.phone : 'New or existing — tap to choose'}</Text>
            </View>
            <Icon name="chevR" size={18} stroke="#9CA3AF" sw={2} />
          </Card>
        </View>

        {/* Job description */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Label>Describe the Job</Label>
            <Label style={{ color: C.faint2 }}>{text.trim().length} chars</Label>
          </View>
          <TextArea value={text} onChangeText={change} placeholder={HINT} containerStyle={{ minHeight: 160 }} />

          <Pressable onPress={onMic} style={[styles.micBtn, listening && styles.micBtnOn]}>
            <Icon name="mic" size={22} stroke={listening ? '#fff' : C.navy} sw={2.2} />
            <Text style={[styles.micText, listening && { color: '#fff' }]}>
              {listening ? 'Listening… tap to stop' : 'Tap to describe by voice'}
            </Text>
          </Pressable>
          <Label style={{ textAlign: 'center', color: C.faint2, marginTop: 8 }}>
            {listening ? 'Speak naturally — we’re transcribing' : "Hands full? Just talk — we'll transcribe it"}
          </Label>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button variant="primary" disabled={!canGo} icon="bolt" onPress={() => onGenerate(text.trim())}>Generate Estimate</Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  addAvatar: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#CFC9BD', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  micBtn: {
    marginTop: 12, height: 58, borderRadius: 12, borderWidth: 1.5, borderColor: C.navy, backgroundColor: C.surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  micBtnOn: { backgroundColor: C.navy, borderColor: C.navy },
  micText: { fontFamily: FONT.sansBold, fontSize: 16, color: C.navy },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
});
