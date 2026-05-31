import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { C, FONT, STATUS, money } from '../theme';
import { TitleBar } from '../components/Chrome';
import { Label, Card, Avatar, Money, Button, Divider, SectionHeader, Badge } from '../components/ui';
import { Icon } from '../components/Icon';
import { exportEstimatePdf, exportInvoicePdf } from '../pdf';
import type { Quote, Customer, Company } from '../types';

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={16} stroke={C.muted} sw={2} />
      <Label style={{ flex: 0, width: 64 }}>{label}</Label>
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONT.sansMed, fontSize: 14, color: C.ink }}>{value}</Text>
    </View>
  );
}

export function QuoteDetail({
  quote, customer, company, onBack, onMark, onResend, onToast, onUpdate,
}: {
  quote: Quote; customer: Customer | null; company: Company;
  onBack: () => void;
  onMark: (id: string, status: 'won' | 'lost') => void;
  onResend: (q: Quote) => void;
  onToast: (msg: string) => void;
  onUpdate: (id: string, patch: Partial<Quote>) => void;
}) {
  const insets = useSafeAreaInsets();
  const est = quote.estimate;
  const closed = quote.status === 'won' || quote.status === 'lost';
  const s = STATUS[quote.status] || STATUS.draft;
  const photos = quote.photos ?? [];

  const onExportEstimate = async () => {
    onToast('Building PDF…');
    await exportEstimatePdf(quote, company, customer, onToast);
  };
  const onCreateInvoice = async () => {
    onToast('Building invoice…');
    await exportInvoicePdf(quote, company, customer, onToast);
  };

  const addPhotos = async (fromCamera: boolean) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { onToast('Camera permission needed'); return; }
        const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
        if (res.canceled || !res.assets?.length) return;
        onUpdate(quote.id, { photos: [...photos, ...res.assets.map((a) => a.uri)] });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { onToast('Photo permission needed'); return; }
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.6,
        });
        if (res.canceled || !res.assets?.length) return;
        onUpdate(quote.id, { photos: [...photos, ...res.assets.map((a) => a.uri)] });
      }
      onToast('Photo added');
    } catch {
      onToast('Could not add photo');
    }
  };

  const removePhoto = (uri: string) => {
    Alert.alert('Remove photo?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onUpdate(quote.id, { photos: photos.filter((p) => p !== uri) }) },
    ]);
  };

  const pickSource = () => {
    Alert.alert('Add job-site photo', undefined, [
      { text: 'Take photo', onPress: () => addPhotos(true) },
      { text: 'Choose from library', onPress: () => addPhotos(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const low = est?.estimate_range?.low ?? Math.round((quote.amount * 0.92) / 10) * 10;
  const high = est?.estimate_range?.high ?? Math.round((quote.amount * 1.12) / 10) * 10;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TitleBar
        title="Quote"
        onBack={onBack}
        action={<Badge status={quote.status} small />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: closed ? 40 : 150 }} showsVerticalScrollIndicator={false}>
        {/* Hero: amount + job */}
        <View style={styles.hero}>
          <Label style={{ color: C.faint2 }}>{quote.type} · {quote.created}</Label>
          <Text style={{ fontFamily: FONT.sansHeavy, fontSize: 22, color: C.navy, marginTop: 4 }}>{quote.job}</Text>
          <Text style={{ fontFamily: FONT.monoBold, fontSize: 38, color: C.ink, letterSpacing: -1, marginTop: 8 }}>
            <Text style={{ opacity: 0.4, fontSize: 26 }}>$</Text>{Math.round(quote.amount).toLocaleString('en-US')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={[styles.statDot, { backgroundColor: s.dot }]} />
            <Text style={{ fontFamily: FONT.sansMed, fontSize: 13, color: s.fg }}>{quote.sentAt}</Text>
          </View>
        </View>

        {/* Customer card */}
        <View style={{ paddingHorizontal: 20 }}>
          <Card style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: customer?.phone || customer?.email || customer?.address ? 12 : 0 }}>
              <Avatar initials={customer?.initials || 'NEW'} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink }}>{customer?.name || 'New customer'}</Text>
                <Label>Customer</Label>
              </View>
            </View>
            {customer?.phone ? <><Divider /><View style={{ height: 10 }} /><InfoRow icon="phone" label="Phone" value={customer.phone} /></> : null}
            {customer?.email ? <InfoRow icon="mail" label="Email" value={customer.email} /> : null}
            {customer?.address ? <InfoRow icon="home" label="Address" value={customer.address} /> : null}
          </Card>
        </View>

        {/* Customer activity — accepted estimate / left a question */}
        {quote.status === 'accepted' ? (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <Card style={[styles.acceptBanner]}>
              <Icon name="check" size={20} stroke={C.success} sw={2.6} />
              <Text style={{ flex: 1, fontFamily: FONT.sansBold, fontSize: 14, color: '#15803D' }}>
                {customer?.name || 'The customer'} accepted this estimate. Mark it Won when the job is booked.
              </Text>
            </Card>
          </View>
        ) : null}

        {quote.customerMessage ? (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <Card style={{ padding: 14, gap: 8, backgroundColor: '#FEF6EF', borderColor: C.orange }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="sms" size={16} stroke={C.orangeDeep} sw={2} />
                <Label style={{ color: C.orangeDeep }}>Question from {customer?.name || 'customer'}</Label>
              </View>
              <Text style={{ fontSize: 14, color: C.ink, fontFamily: FONT.sans, lineHeight: 20 }}>{quote.customerMessage}</Text>
              {customer?.phone ? (
                <Pressable onPress={() => onToast('Reply from your messages app')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Icon name="phone" size={14} stroke={C.orange} sw={2.4} />
                  <Label style={{ color: C.orange }}>Reply to {customer.phone}</Label>
                </Pressable>
              ) : null}
            </Card>
          </View>
        ) : null}

        {/* Job summary */}
        {est?.job_summary ? (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <Card style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F1EFEA' }}>
              <Label style={{ marginBottom: 4 }}>Job Summary</Label>
              <Text style={{ fontSize: 14, color: C.ink, fontFamily: FONT.sans, lineHeight: 20 }}>{est.job_summary}</Text>
            </Card>
          </View>
        ) : null}

        {/* Line items */}
        {est?.line_items?.length ? (
          <>
            <SectionHeader>Line Items · {est.line_items.length}</SectionHeader>
            <View style={styles.tableWrap}>
              {est.line_items.map((it, i) => (
                <View key={i}>
                  {i > 0 ? <Divider /> : null}
                  <View style={[styles.lineRow, { backgroundColor: i % 2 ? C.zebra : C.surface }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: C.ink, fontFamily: FONT.sans, lineHeight: 20 }}>{it.description}</Text>
                      <Label style={{ marginTop: 4 }}>
                        {it.type === 'labor' ? 'LABOR' : 'MATERIAL'} · {it.quantity} {it.unit} × {money(it.unit_price)}
                      </Label>
                    </View>
                    <Money value={it.total || it.quantity * it.unit_price} size="md" color={C.ink} style={{ fontFamily: FONT.monoBold }} />
                  </View>
                </View>
              ))}
            </View>

            {/* Subtotals */}
            <View style={[styles.boxed, { marginTop: 12 }]}>
              <View style={styles.totRow}><Label>Materials</Label><Money value={est.materials_subtotal} size="md" color={C.ink} /></View>
              <Divider />
              <View style={styles.totRow}><Label>Labor</Label><Money value={est.labor_subtotal} size="md" color={C.ink} /></View>
              <View style={[styles.totRow, { backgroundColor: C.navy, paddingVertical: 12 }]}>
                <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Total</Label>
                <Money value={est.total_estimate || quote.amount} size="lg" bold color="#fff" />
              </View>
            </View>
          </>
        ) : (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Card style={{ padding: 16, gap: 6, backgroundColor: C.zebra }}>
              <Label>Estimate breakdown</Label>
              <Text style={{ fontSize: 13, color: C.muted, fontFamily: FONT.sans, lineHeight: 19 }}>
                The itemized breakdown for this quote isn't stored on device. Create it fresh from a new quote to see line items here.
              </Text>
            </Card>
          </View>
        )}

        {/* Range shown to customer */}
        <View style={styles.rangeBox}>
          <Label style={{ color: C.orangeDeep, marginBottom: 4 }}>Range Shown to Customer</Label>
          <Text style={{ fontFamily: FONT.monoBold, fontSize: 24, color: C.navy }}>
            {money(low)} <Text style={{ color: C.muted, fontSize: 18, fontFamily: FONT.mono }}>–</Text> {money(high)}
          </Text>
        </View>

        {/* Notes */}
        {est?.notes ? (
          <View style={[styles.boxed, { marginTop: 12, padding: 16, gap: 6 }]}>
            <Label>Notes for Customer</Label>
            <Text style={{ fontSize: 13, color: C.ink, fontFamily: FONT.sans, lineHeight: 19 }}>{est.notes}</Text>
          </View>
        ) : null}

        {/* Job-site photos */}
        <SectionHeader action="+ Add" onAction={pickSource}>Job-Site Photos · {photos.length}</SectionHeader>
        {photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
            {photos.map((uri) => (
              <Pressable key={uri} onLongPress={() => removePhoto(uri)} style={styles.photoWrap}>
                <Image source={{ uri }} style={styles.photo} />
                <Pressable onPress={() => removePhoto(uri)} hitSlop={8} style={styles.photoRemove}>
                  <Icon name="x" size={13} stroke="#fff" sw={2.6} />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Pressable onPress={pickSource}>
              <Card style={styles.photoEmpty}>
                <Icon name="camera" size={22} stroke={C.muted} sw={2} />
                <Text style={{ fontSize: 13, color: C.muted, fontFamily: FONT.sans }}>Attach job-site photos for context</Text>
              </Card>
            </Pressable>
          </View>
        )}

        {/* Documents — PDF estimate + invoice from a won job */}
        <SectionHeader>Documents</SectionHeader>
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <Button variant="outline" icon="doc" onPress={onExportEstimate}>Export PDF estimate</Button>
          {quote.status === 'won' || quote.status === 'accepted' ? (
            <Button variant="navy" icon="check" onPress={onCreateInvoice}>Create invoice</Button>
          ) : (
            <Pressable onPress={onCreateInvoice}>
              <Text style={styles.invoiceHint}>Mark this quote Won to bill it — or create an invoice now →</Text>
            </Pressable>
          )}
        </View>

        {/* Follow-ups */}
        {est?.follow_up_sequence?.length ? (
          <View style={[styles.boxed, { marginTop: 12, padding: 16, gap: 10 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={16} stroke={C.navy} sw={2} />
              <Label>Auto follow-up sequence</Label>
            </View>
            {est.follow_up_sequence.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.fuBadge}><Text style={styles.fuBadgeText}>+{f.delay_hours}h</Text></View>
                <Text style={{ flex: 1, fontSize: 13, color: C.ink, fontFamily: FONT.sans, lineHeight: 19 }}>{f.message_text}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Closed banner */}
        {closed ? (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Card style={[styles.closedBanner, { backgroundColor: quote.status === 'won' ? '#E3F4E8' : '#F1EFEA' }]}>
              <Icon name={quote.status === 'won' ? 'check' : 'x'} size={20} stroke={quote.status === 'won' ? C.success : C.muted} sw={2.6} />
              <Text style={{ fontFamily: FONT.sansBold, fontSize: 15, color: quote.status === 'won' ? C.success : C.muted }}>
                {quote.status === 'won' ? 'This job was marked Won' : 'This quote was marked Lost'}
              </Text>
            </Card>
          </View>
        ) : null}
      </ScrollView>

      {/* Action bar */}
      {!closed ? (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 10) + 10 }]}>
          {est ? (
            <View style={{ marginBottom: 10 }}>
              <Button variant="navy" icon="arrowR" onPress={() => onResend(quote)}>Resend estimate · {money(quote.amount)}</Button>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button variant="success" icon="check" onPress={() => onMark(quote.id, 'won')}>Mark Won</Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="outline" icon="x" onPress={() => onMark(quote.id, 'lost')}>Mark Lost</Button>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  tableWrap: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  boxed: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, overflow: 'hidden' },
  totRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  rangeBox: { marginHorizontal: 20, marginTop: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.orange, backgroundColor: '#FEF6EF', paddingHorizontal: 16, paddingVertical: 14 },
  fuBadge: { backgroundColor: '#F1EFEA', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  fuBadgeText: { fontFamily: FONT.monoBold, fontSize: 11, color: C.navy },
  closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, justifyContent: 'center' },
  acceptBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#E3F4E8', borderColor: '#BBE6C8' },
  photoWrap: { width: 104, height: 104, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photo: { width: 104, height: 104, borderRadius: 12, backgroundColor: C.zebra },
  photoRemove: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(15,30,60,0.72)', alignItems: 'center', justifyContent: 'center' },
  photoEmpty: { paddingVertical: 22, alignItems: 'center', gap: 8, borderStyle: 'dashed' },
  invoiceHint: { fontSize: 12, color: C.faint, fontFamily: FONT.sans, textAlign: 'center', paddingTop: 2 },
  actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
});
