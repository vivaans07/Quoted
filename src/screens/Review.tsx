import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, money } from '../theme';
import { TitleBar } from '../components/Chrome';
import { Label, Card, Avatar, Money, Button, Divider, SectionHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import type { Estimate, LineItem, Customer } from '../types';

function recompute(items: LineItem[]) {
  const withTotals = items.map((it) => ({ ...it, total: Math.round(it.quantity * it.unit_price) }));
  const materials = withTotals.filter((i) => i.type !== 'labor').reduce((s, i) => s + i.total, 0);
  const labor = withTotals.filter((i) => i.type === 'labor').reduce((s, i) => s + i.total, 0);
  return { items: withTotals, materials, labor, total: materials + labor };
}

function LineRow({ item, idx, editing, onToggle, onChange, onDelete }: {
  item: LineItem; idx: number; editing: boolean;
  onToggle: () => void; onChange: (patch: Partial<LineItem>) => void; onDelete: () => void;
}) {
  const total = item.quantity * item.unit_price;
  return (
    <View style={{ backgroundColor: idx % 2 ? C.zebra : C.surface }}>
      <Pressable onPress={onToggle} style={styles.lineRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, color: C.ink, fontFamily: FONT.sans, lineHeight: 20 }}>{item.description}</Text>
          <Label style={{ marginTop: 4 }}>
            {item.type === 'labor' ? 'LABOR' : 'MATERIAL'} · {item.quantity} {item.unit} × {money(item.unit_price)}
          </Label>
        </View>
        <Money value={total} size="md" color={C.ink} style={{ fontFamily: FONT.monoBold }} />
      </Pressable>

      {editing ? (
        <View style={styles.editPanel}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Label style={{ marginBottom: 4 }}>Quantity</Label>
              <View style={styles.stepper}>
                <Pressable onPress={() => onChange({ quantity: Math.max(0, +(item.quantity - (item.quantity > 5 ? 1 : 0.5)).toFixed(2)) })} style={styles.stepBtn}><Text style={styles.stepSign}>−</Text></Pressable>
                <TextInput value={String(item.quantity)} onChangeText={(v) => onChange({ quantity: parseFloat(v) || 0 })} keyboardType="decimal-pad" style={styles.stepInput} />
                <Pressable onPress={() => onChange({ quantity: +(item.quantity + (item.quantity >= 5 ? 1 : 0.5)).toFixed(2) })} style={styles.stepBtn}><Text style={styles.stepSign}>+</Text></Pressable>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Label style={{ marginBottom: 4 }}>Unit Price</Label>
              <View style={styles.priceBox}>
                <Text style={{ fontFamily: FONT.mono, color: C.muted, marginRight: 4 }}>$</Text>
                <TextInput value={String(item.unit_price)} onChangeText={(v) => onChange({ unit_price: parseFloat(v) || 0 })} keyboardType="decimal-pad" style={styles.priceInput} />
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <Pressable onPress={onDelete} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="x" size={13} stroke={C.danger} sw={2.4} />
              <Label style={{ color: C.danger }}>Remove line</Label>
            </Pressable>
            <Pressable onPress={onToggle} style={styles.doneBtn}><Text style={styles.doneText}>Done</Text></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function EstimateReview({
  estimate, customer, onBack, onSend, onChange, onToast,
}: {
  estimate: Estimate; customer: Customer | null;
  onBack: () => void; onSend: () => void;
  onChange: (e: Estimate) => void; onToast: (msg: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const { items, materials, labor, total } = recompute(estimate.line_items);
  const low = estimate.estimate_range?.low || Math.round((total * 0.92) / 10) * 10;
  const high = estimate.estimate_range?.high || Math.round((total * 1.12) / 10) * 10;

  const setItems = (next: LineItem[]) => {
    const r = recompute(next);
    onChange({ ...estimate, line_items: r.items, materials_subtotal: r.materials, labor_subtotal: r.labor, total_estimate: r.total });
  };
  const change = (idx: number, patch: Partial<LineItem>) => setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx: number) => { setItems(items.filter((_, i) => i !== idx)); setEditIdx(null); onToast('Line removed'); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TitleBar
        title="Review Estimate"
        onBack={onBack}
        action={<Pressable onPress={() => onToast('Saved as draft')} hitSlop={8}><Label style={{ color: C.orange }}>Save</Label></Pressable>}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Customer + summary */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar initials={customer?.initials || 'NEW'} size={34} />
            <Text style={{ fontFamily: FONT.sansBold, fontSize: 15, color: C.ink }}>{customer?.name || 'New customer'}</Text>
          </View>
          <Card style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F1EFEA' }}>
            <Label style={{ marginBottom: 4 }}>Job Summary</Label>
            <Text style={{ fontSize: 14, color: C.ink, fontFamily: FONT.sans, lineHeight: 20 }}>{estimate.job_summary}</Text>
          </Card>
        </View>

        {/* Line items */}
        <SectionHeader>Line Items · {items.length}</SectionHeader>
        <View style={styles.tableWrap}>
          {items.map((it, i) => (
            <View key={i}>
              {i > 0 ? <Divider /> : null}
              <LineRow item={it} idx={i} editing={editIdx === i} onToggle={() => setEditIdx(editIdx === i ? null : i)} onChange={(p) => change(i, p)} onDelete={() => remove(i)} />
            </View>
          ))}
        </View>

        {/* Subtotals */}
        <View style={[styles.boxed, { marginTop: 12 }]}>
          <View style={styles.totRow}><Label>Materials</Label><Money value={materials} size="md" color={C.ink} /></View>
          <Divider />
          <View style={styles.totRow}><Label>Labor</Label><Money value={labor} size="md" color={C.ink} /></View>
          <View style={[styles.totRow, { backgroundColor: C.navy, paddingVertical: 12 }]}>
            <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Total</Label>
            <Money value={total} size="lg" bold color="#fff" />
          </View>
        </View>

        {/* Range */}
        <View style={styles.rangeBox}>
          <Label style={{ color: C.orangeDeep, marginBottom: 4 }}>Estimated Range Shown to Customer</Label>
          <Text style={{ fontFamily: FONT.monoBold, fontSize: 24, color: C.navy }}>
            {money(low)} <Text style={{ color: C.muted, fontSize: 18, fontFamily: FONT.mono }}>–</Text> {money(high)}
          </Text>
        </View>

        {/* Notes */}
        <View style={[styles.boxed, { marginTop: 12 }]}>
          <Pressable onPress={() => setNotesOpen((o) => !o)} style={styles.notesHead}>
            <Label>Notes for Customer</Label>
            <Icon name="chevD" size={18} stroke="#9CA3AF" sw={2} />
          </Pressable>
          {notesOpen ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <TextInput
                value={estimate.notes}
                onChangeText={(v) => onChange({ ...estimate, notes: v })}
                multiline
                textAlignVertical="top"
                style={styles.notesInput}
              />
            </View>
          ) : (
            <Text numberOfLines={1} style={{ paddingHorizontal: 16, paddingBottom: 12, marginTop: -2, fontSize: 13, color: C.muted, fontFamily: FONT.sans }}>{estimate.notes}</Text>
          )}
        </View>

        {/* Photo requests */}
        {estimate.photo_requests?.length ? (
          <View style={[styles.boxed, { marginTop: 12, padding: 16, gap: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="camera" size={16} stroke={C.navy} sw={2} />
              <Label>Photos to request</Label>
            </View>
            {estimate.photo_requests.map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ color: C.orange, fontFamily: FONT.sansBold }}>•</Text>
                <Text style={{ flex: 1, fontSize: 13, color: C.ink, fontFamily: FONT.sans, lineHeight: 19 }}>{p}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Follow-up preview */}
        {estimate.follow_up_sequence?.length ? (
          <View style={[styles.boxed, { marginTop: 12, padding: 16, gap: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={16} stroke={C.navy} sw={2} />
              <Label>Auto follow-up sequence</Label>
            </View>
            {estimate.follow_up_sequence.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.fuBadge}><Text style={styles.fuBadgeText}>+{f.delay_hours}h</Text></View>
                <Text style={{ flex: 1, fontSize: 13, color: C.ink, fontFamily: FONT.sans, lineHeight: 19 }}>{f.message_text}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Send bar */}
      <View style={[styles.sendBar, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
        <Button variant="primary" icon="arrowR" onPress={onSend}>Send Estimate · {money(total)}</Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  editPanel: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, backgroundColor: C.fieldHover, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  stepper: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, overflow: 'hidden' },
  stepBtn: { width: 44, height: '100%', alignItems: 'center', justifyContent: 'center' },
  stepSign: { fontSize: 20, color: C.navy },
  stepInput: { flex: 1, textAlign: 'center', fontFamily: FONT.mono, fontSize: 16, color: C.ink, padding: 0 },
  priceBox: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, paddingHorizontal: 12 },
  priceInput: { flex: 1, fontFamily: FONT.mono, fontSize: 16, color: C.ink, padding: 0 },
  doneBtn: { paddingHorizontal: 16, height: 36, borderRadius: 10, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: '#fff', fontFamily: FONT.sansBold, fontSize: 13 },
  tableWrap: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  boxed: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, overflow: 'hidden' },
  totRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  rangeBox: { marginHorizontal: 20, marginTop: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.orange, backgroundColor: '#FEF6EF', paddingHorizontal: 16, paddingVertical: 14 },
  notesHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  notesInput: { minHeight: 88, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.zebra, padding: 12, fontFamily: FONT.sans, fontSize: 14, color: C.ink, lineHeight: 20 },
  fuBadge: { backgroundColor: '#F1EFEA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  fuBadgeText: { fontFamily: FONT.monoBold, fontSize: 11, color: C.navy },
  sendBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
});
