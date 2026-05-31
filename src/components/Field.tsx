import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { C, FONT } from '../theme';
import { Label } from './ui';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={styles.fieldHead}>
        <Label>{label}</Label>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

interface InputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  prefix?: string;
}
export function Input({ containerStyle, prefix, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.input, focused && styles.inputFocus, containerStyle]}>
      {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
      <TextInput
        {...rest}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        placeholderTextColor="#B0AA9E"
        style={[styles.inputText, style]}
      />
    </View>
  );
}

export function TextArea({ containerStyle, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.textareaWrap, focused && styles.inputFocus, containerStyle]}>
      <TextInput
        {...rest}
        multiline
        textAlignVertical="top"
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        placeholderTextColor="#B0AA9E"
        style={[styles.textareaText, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  hint: { fontSize: 11, color: C.muted, fontFamily: FONT.sans },
  input: {
    flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 1.5, borderColor: C.line,
    borderRadius: 12, backgroundColor: C.surface, paddingHorizontal: 14,
  },
  inputFocus: { borderColor: C.orange },
  inputText: { flex: 1, fontFamily: FONT.sans, fontSize: 16, color: C.ink, padding: 0 },
  prefix: { fontFamily: FONT.mono, color: C.muted, marginRight: 6 },
  textareaWrap: {
    borderWidth: 1.5, borderColor: C.line, borderRadius: 12, backgroundColor: C.surface, padding: 14, flex: 1,
  },
  textareaText: { fontFamily: FONT.sans, fontSize: 17, color: C.ink, lineHeight: 24, minHeight: 140, padding: 0 },
});
