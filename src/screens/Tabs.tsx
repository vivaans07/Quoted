import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { C, FONT, money } from '../theme';
import type { Status } from '../theme';
import { AppHeader, BottomNav, FAB, TabId } from '../components/Chrome';
import { Card, Avatar, Label, Money, Button, Divider, SectionHeader, SearchField, FilterChips } from '../components/ui';
import { Icon } from '../components/Icon';
import { QuoteCard } from '../components/QuoteCard';
import type { Quote, Customer, Company } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabFrame({ active, onNav, onNewQuote, children }: { active: TabId; onNav: (t: TabId) => void; onNewQuote?: () => void; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <AppHeader onBell={() => {}} notif={false} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      {onNewQuote ? <FAB onPress={onNewQuote} bottom={64 + Math.max(insets.bottom, 10) + 16} /> : null}
      <BottomNav active={active} onNav={onNav} />
    </View>
  );
}

type QuoteFilter = 'all' | Status;
const QUOTE_FILTERS: { key: QuoteFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sent', label: 'Sent' },
  { key: 'opened', label: 'Opened' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

export function QuotesTab({ quotes, customers, onNav, onOpenQuote, onNewQuote }: {
  quotes: Quote[]; customers: Customer[]; onNav: (t: TabId) => void; onOpenQuote: (q: Quote) => void; onNewQuote: () => void;
}) {
  const byId = (id: string) => customers.find((c) => c.id === id);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<QuoteFilter>('all');

  const q = query.trim().toLowerCase();
  const filtered = quotes.filter((quote) => {
    if (filter !== 'all' && quote.status !== filter) return false;
    if (!q) return true;
    const cust = byId(quote.customerId);
    return (
      quote.job.toLowerCase().includes(q) ||
      quote.type.toLowerCase().includes(q) ||
      (cust?.name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <TabFrame active="quotes" onNav={onNav} onNewQuote={onNewQuote}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search quotes or customers" />
        <FilterChips options={QUOTE_FILTERS} value={filter} onChange={setFilter} />
      </View>
      <SectionHeader>{q || filter !== 'all' ? `Results · ${filtered.length}` : `All Quotes · ${quotes.length}`}</SectionHeader>
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {filtered.length === 0 ? (
          <Card style={{ paddingVertical: 36, alignItems: 'center' }}>
            <Label style={{ color: C.faint2 }}>No quotes match</Label>
          </Card>
        ) : (
          filtered.map((quote) => <QuoteCard key={quote.id} quote={quote} customer={byId(quote.customerId)} onPress={() => onOpenQuote(quote)} />)
        )}
      </View>
    </TabFrame>
  );
}

export function CustomersTab({ customers, quotes, onNav, onNewQuoteFor }: {
  customers: Customer[]; quotes: Quote[]; onNav: (t: TabId) => void; onNewQuoteFor: (c: Customer) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = customers.filter((c) =>
    !q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
  );
  return (
    <TabFrame active="customers" onNav={onNav}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search customers" />
      </View>
      <SectionHeader>{q ? `Results · ${filtered.length}` : `Customers · ${customers.length}`}</SectionHeader>
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        {filtered.length === 0 ? (
          <Card style={{ paddingVertical: 36, alignItems: 'center' }}>
            <Label style={{ color: C.faint2 }}>No customers match</Label>
          </Card>
        ) : filtered.map((c) => {
          const cq = quotes.filter((q) => q.customerId === c.id);
          const won = cq.filter((q) => q.status === 'won').length;
          return (
            <Card key={c.id} style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar initials={c.initials} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink }}>{c.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: C.muted, fontFamily: FONT.sans }}>{c.address}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <Label>{cq.length} quote{cq.length === 1 ? '' : 's'} · {won} won</Label>
                <Pressable onPress={() => onNewQuoteFor(c)} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="plus" size={14} stroke={C.orange} sw={2.4} />
                  <Label style={{ color: C.orange }}>New Quote</Label>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </View>
    </TabFrame>
  );
}

export function SettingsTab({ company, quotes, onNav, onReset, onEditProfile }: {
  company: Company; quotes: Quote[]; onNav: (t: TabId) => void; onReset: () => void; onEditProfile: () => void;
}) {
  const won = quotes.filter((q) => q.status === 'won');
  const wonRevenue = won.reduce((s, q) => s + q.amount, 0);
  return (
    <TabFrame active="settings" onNav={onNav}>
      {/* Company header */}
      <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
        {company.logoUri ? (
          <Image source={{ uri: company.logoUri }} style={{ width: 72, height: 72, borderRadius: 16 }} />
        ) : (
          <View style={styles.logoFallback}><Text style={{ fontFamily: FONT.sansHeavy, fontSize: 28, color: C.navy }}>{(company.name || 'Q')[0]}</Text></View>
        )}
        <Text style={{ fontFamily: FONT.sansHeavy, fontSize: 20, color: C.navy, marginTop: 12 }}>{company.name || 'Your Company'}</Text>
        <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.muted }}>{company.license || 'License —'}</Text>
        <Pressable onPress={onEditProfile} style={styles.editBtn}>
          <Icon name="edit" size={15} stroke={C.navy} sw={2.2} />
          <Text style={{ fontFamily: FONT.sansBold, fontSize: 14, color: C.navy }}>Edit Profile</Text>
        </Pressable>
      </View>

      <SectionHeader>Estimate Defaults</SectionHeader>
      <View style={styles.box}>
        <Row label="Trade" value={company.trade} />
        <Divider />
        <Row label="Labor rate" value={`${money(company.laborRate)}/hr`} />
        <Divider />
        <Row label="Material markup" value={`${company.markup}%`} />
      </View>

      <SectionHeader>Texting & Contact</SectionHeader>
      <View style={styles.box}>
        <Row label="Texting number" value={company.twilioNumber || 'Not connected'} />
        <Divider />
        <Row label="Phone" value={company.phone || '—'} />
        <Divider />
        <Row label="Email" value={company.email || '—'} />
      </View>

      <SectionHeader>Subscription</SectionHeader>
      <View style={[styles.box, { padding: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink }}>Quoted Pro</Text>
            <Text style={{ fontFamily: FONT.sans, fontSize: 13, color: C.muted }}>$49/mo · 14-day trial</Text>
          </View>
          <View style={styles.trialPill}><Label style={{ color: C.success }}>TRIAL</Label></View>
        </View>
      </View>

      <SectionHeader>Lifetime</SectionHeader>
      <View style={[styles.box, { flexDirection: 'row' }]}>
        <View style={styles.statCell}><Label>Jobs Won</Label><Text style={{ fontFamily: FONT.monoBold, fontSize: 22, color: C.ink, letterSpacing: -0.5 }}>{won.length}</Text></View>
        <Divider style={{ width: StyleSheet.hairlineWidth, height: '100%' }} />
        <View style={styles.statCell}><Label>Won Revenue</Label><Money value={wonRevenue} size="lg" bold color={C.orange} /></View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Button variant="outline" icon="refresh" onPress={onReset}>Reset app & onboarding</Button>
        <Label style={{ textAlign: 'center', color: C.faint2, marginTop: 16 }}>Quoted · Built for dirty hands & bright sunlight</Label>
      </View>
    </TabFrame>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Label>{label}</Label>
      {typeof value === 'string' ? <Text style={{ fontFamily: FONT.sansMed, fontSize: 15, color: C.ink }}>{value}</Text> : value}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  logoFallback: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#E7EAF1', alignItems: 'center', justifyContent: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 16, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface },
  trialPill: { backgroundColor: '#E3F4E8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statCell: { flex: 1, padding: 16, gap: 6, alignItems: 'flex-start' },
});
