import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT } from '../theme';

export interface ToastData { msg: string; tone?: 'success' | 'muted' }

export function Toast({ toast }: { toast: ToastData | null }) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-20)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(y, { toValue: 0, useNativeDriver: true, friction: 7 }),
        Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(op, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      y.setValue(-20);
    }
  }, [toast]);

  if (!toast) return null;
  const dot = toast.tone === 'success' ? '#22C55E' : C.orange;
  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 8, opacity: op, transform: [{ translateY: y }] }]} pointerEvents="none">
      <View style={styles.pill}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text style={styles.text}>{toast.msg}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 16,
    borderRadius: 20, backgroundColor: C.navy,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: '#fff', fontFamily: FONT.sansBold, fontSize: 13 },
});
