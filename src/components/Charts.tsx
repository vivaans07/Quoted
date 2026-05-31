// Charts.tsx — instrument-panel data viz (react-native-svg, flat, hairline).
// Ported from the Quoted web prototype's charts.jsx.
import React from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { C, FONT } from '../theme';

// ── Area sparkline (auto-widths to its container) ─────────────
export function Sparkline({
  data, height = 48, color = C.orange, fill = 'rgba(249,115,22,0.12)', sw = 1.75,
}: { data: number[]; height?: number; color?: string; fill?: string; sw?: number }) {
  const [w, setW] = React.useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const h = height;
  let body: React.ReactNode = null;
  if (w > 0 && data.length > 1) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const pad = sw;
    const x = (i: number) => pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);
    const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const line = 'M' + pts.join(' L');
    const area = `${line} L${x(data.length - 1).toFixed(1)},${h} L${x(0).toFixed(1)},${h} Z`;
    body = (
      <Svg width={w} height={h}>
        <Path d={area} fill={fill} />
        <Path d={line} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={2.6} fill={color} />
      </Svg>
    );
  }
  return <View onLayout={onLayout} style={{ width: '100%', height: h }}>{body}</View>;
}

// ── Vertical mini bars (last bar = accent) ────────────────────
export function MiniBars({
  data, w = 70, h = 32, color = C.navy, accent = C.orange, gap = 3,
}: { data: number[]; w?: number; h?: number; color?: string; accent?: string; gap?: number }) {
  const max = Math.max(...data) || 1;
  const n = data.length;
  const bw = (w - gap * (n - 1)) / n;
  return (
    <Svg width={w} height={h}>
      {data.map((v, i) => {
        const bh = Math.max(2, (v / max) * h);
        const last = i === n - 1;
        return (
          <Rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={1.5}
            fill={last ? accent : color} opacity={last ? 1 : 0.22} />
        );
      })}
    </Svg>
  );
}

// ── Horizontal stacked bar (pipeline) ─────────────────────────
export function StackedBar({
  segments, h = 14,
}: { segments: { label: string; value: number; color: string }[]; h?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <View style={{ flexDirection: 'row', height: h, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
      {segments.map((s, i) => (
        <View key={i} style={{ flex: s.value, backgroundColor: s.color, minWidth: s.value ? 6 : 0, borderRadius: 2 }} />
      ))}
    </View>
  );
}

// ── Thin progress track ───────────────────────────────────────
export function ProgressTrack({
  value, color = C.orange, track = C.lineWarm, h = 6,
}: { value: number; color?: string; track?: string; h?: number }) {
  return (
    <View style={{ height: h, borderRadius: h, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ height: '100%', borderRadius: h, width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </View>
  );
}

// ── Legend dot + label + value ────────────────────────────────
export function LegendItem({ color, label, value }: { color: string; label: string; value?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontFamily: FONT.sans, fontSize: 11, color: C.muted }}>{label}</Text>
      {value != null ? (
        <Text style={{ fontFamily: FONT.monoBold, fontSize: 11, color: C.ink }}>{value}</Text>
      ) : null}
    </View>
  );
}

// ── Segmented control (Wk / Mo / Qtr) ─────────────────────────
export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { id: T; label: string }[]; value: T; onChange: (id: T) => void }) {
  return (
    <View style={seg.wrap}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} style={[seg.btn, on && seg.btnOn]}>
            <Text style={[seg.txt, on && seg.txtOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const seg = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: 2, borderRadius: 7, backgroundColor: '#EEEBE4', borderWidth: 1, borderColor: C.line },
  btn: { paddingHorizontal: 10, height: 26, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  btnOn: { backgroundColor: C.navy },
  txt: { fontFamily: FONT.monoBold, fontSize: 11, letterSpacing: 0.7, color: C.muted, textTransform: 'uppercase' },
  txtOn: { color: '#fff' },
});
