import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { C, FONT } from '../theme';
import { Icon } from './Icon';

const { width } = Dimensions.get('window');
const COLORS = [C.orange, C.navy, C.success, '#EAB308', '#3B82F6'];

function Confetti({ delay }: { delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * width;
  const drift = (Math.random() - 0.5) * 120;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 6 + Math.random() * 6;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1400 + Math.random() * 600, delay, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start();
  }, []);
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-40, 560] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + Math.random() * 360}deg`] });
  const opacity = t.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View style={{ position: 'absolute', left: startX, top: 0, width: size, height: size * 1.4, backgroundColor: color, borderRadius: 2, opacity, transform: [{ translateY }, { translateX }, { rotate }] }} />
  );
}

export function SuccessBurst({ visible, channel }: { visible: boolean; channel: string }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      scale.setValue(0.4); op.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      {Array.from({ length: 28 }).map((_, i) => <Confetti key={i} delay={i * 18} />)}
      <Animated.View style={{ alignItems: 'center', opacity: op, transform: [{ scale }] }}>
        <View style={styles.circle}><Icon name="check" size={48} stroke="#fff" sw={3} /></View>
        <Text style={styles.title}>Estimate sent</Text>
        <Text style={styles.sub}>Delivered via {channel}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(248,247,244,0.97)', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  circle: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.sansHeavy, fontSize: 22, color: C.navy, marginTop: 24 },
  sub: { fontFamily: FONT.sans, fontSize: 14, color: C.muted, marginTop: 4 },
});
