import React from 'react';
import { View, Text } from 'react-native';
import { C, FONT } from '../theme';
import { Card, Avatar, Money, Badge, Label } from './ui';
import type { Quote, Customer } from '../types';

export function QuoteCard({ quote, customer, onPress }: { quote: Quote; customer?: Customer; onPress?: () => void }) {
  const initials = customer?.initials || 'NEW';
  const name = customer?.name || 'New customer';
  return (
    <Card onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar initials={initials} size={42} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text numberOfLines={1} style={{ fontFamily: FONT.sansBold, fontSize: 16, color: C.ink, flex: 1 }}>{name}</Text>
            <Money value={quote.amount} size="lg" bold color={C.ink} />
          </View>
          <Text numberOfLines={1} style={{ marginTop: 2, fontSize: 13, color: C.muted, fontFamily: FONT.sans }}>{quote.job}</Text>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge status={quote.status} small />
            <Label>{quote.sentAt}</Label>
          </View>
        </View>
      </View>
    </Card>
  );
}
