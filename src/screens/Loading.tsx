import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT } from '../theme';
import { Skeleton, Label } from '../components/ui';
import { Icon } from '../components/Icon';

const STEPS = [
  'Reading job details…',
  'Identifying materials…',
  'Calculating quantities…',
  'Pricing labor…',
  'Writing your estimate…',
];

export function GenerateLoading({ jobText }: { jobText: string }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const prog = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1600);
    const b = setInterval(() => setRows((r) => Math.min(r + 1, 5)), 520);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
    return () => { clearInterval(a); clearInterval(b); };
  }, []);

  useEffect(() => {
    Animated.timing(prog, { toValue: Math.min(98, ((step + 1) / STEPS.length) * 100), duration: 600, useNativeDriver: false }).start();
  }, [step]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8, backgroundColor: C.bg }]}>
      <View style={styles.center}>
        <View style={{ marginBottom: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <View style={styles.bolt}><Icon name="bolt" size={28} stroke="#fff" sw={2.2} /></View>
        </View>

        <Label style={{ color: C.navy, fontSize: 13 }}>{STEPS[step]}</Label>
        <Text style={{ fontSize: 13, color: C.muted, marginTop: 6, fontFamily: FONT.sans }}>Takes about 10 seconds</Text>

        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: prog.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
        </View>

        <View style={{ width: 300, maxWidth: '86%', marginTop: 32, gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: i < rows ? 1 : 0.18 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i < rows ? C.orange : '#D8D3C8' }} />
              <Skeleton w={i % 2 ? '62%' : '78%'} h={11} />
              <View style={{ flex: 1 }} />
              <Skeleton w={40} h={11} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 28 }}>
        <Label numberOfLines={1} style={{ textAlign: 'center', color: C.faint2 }}>“{jobText}”</Label>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  ring: { position: 'absolute', width: 58, height: 58, borderRadius: 16, backgroundColor: C.orange },
  bolt: { width: 58, height: 58, borderRadius: 16, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  track: { width: 260, maxWidth: '80%', height: 6, borderRadius: 3, backgroundColor: C.lineWarm, marginTop: 20, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: C.orange },
});
