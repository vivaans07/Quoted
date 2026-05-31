import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { C } from '../theme';
import { Icon } from '../components/Icon';

// Full-screen boot splash shown while fonts load and the session/data resolve.
// Just the logo's lightning bolt, gently breathing.
export function BootSplash() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.mark, { transform: [{ scale }], opacity }]}>
        <Icon name="bolt" size={44} stroke={C.orange} sw={2.4} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  mark: {
    width: 84, height: 84, borderRadius: 20, backgroundColor: C.navy,
    alignItems: 'center', justifyContent: 'center',
  },
});
