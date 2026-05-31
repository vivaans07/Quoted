import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT } from '../theme';
import { Icon } from '../components/Icon';
import * as Cloud from '../cloud';

interface Props {
  onDone: () => void;
}

export function Auth({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';
  const passwordsMatch = !isSignup || confirm === password;
  const canSubmit =
    email.trim().includes('@') &&
    password.length >= 6 &&
    (!isSignup || (confirm.length >= 6 && passwordsMatch));

  const submit = async () => {
    if (loading) return;
    if (isSignup && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await Cloud.signUp(email.trim().toLowerCase(), password);
      } else {
        await Cloud.signIn(email.trim().toLowerCase(), password);
      }
      onDone();
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Icon name="bolt" size={26} stroke={C.orange} sw={2.5} />
          </View>
          <Text style={styles.logoText}>Quoted<Text style={{ color: C.orange }}>.</Text></Text>
        </View>

        <Text style={styles.headline}>
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </Text>
        <Text style={styles.sub}>
          {mode === 'signup'
            ? 'Your quotes sync across all your devices.'
            : 'Sign in to access your quotes and estimates.'}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
              placeholderTextColor={C.muted}
              secureTextEntry
              textContentType={isSignup ? 'newPassword' : 'password'}
            />
          </View>

          {isSignup ? (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={[styles.input, confirm.length > 0 && !passwordsMatch && styles.inputError]}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter your password"
                placeholderTextColor={C.muted}
                secureTextEntry
                textContentType="newPassword"
              />
              {confirm.length > 0 && !passwordsMatch ? (
                <Text style={styles.hintError}>Passwords don't match</Text>
              ) : null}
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="x" size={14} stroke={C.orange} sw={2.5} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.btn, !canSubmit && styles.btnDisabled]}
            onPress={submit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{mode === 'signup' ? 'Create account' : 'Sign in'}</Text>
            }
          </Pressable>
        </View>

        {/* Toggle */}
        <Pressable onPress={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); setConfirm(''); }}>
          <Text style={styles.toggle}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.toggleLink}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  logoIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: C.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: FONT.display, fontSize: 22, color: C.navy, textTransform: 'uppercase', letterSpacing: 0.4 },
  headline: { fontFamily: FONT.sansBold, fontSize: 28, color: C.navy, marginBottom: 8 },
  sub: { fontFamily: FONT.sans, fontSize: 15, color: C.muted, marginBottom: 32, lineHeight: 22 },
  form: { gap: 16, marginBottom: 24 },
  field: { gap: 6 },
  label: { fontFamily: FONT.sansMed, fontSize: 13, color: C.ink, letterSpacing: 0.2 },
  input: {
    borderWidth: 1.5, borderColor: C.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: FONT.sans, fontSize: 15, color: C.ink, backgroundColor: '#fff',
  },
  inputError: { borderColor: C.danger },
  hintError: { fontFamily: FONT.sansMed, fontSize: 12, color: C.danger, marginTop: 2 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF4EC', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FED7B0',
  },
  errorText: { fontFamily: FONT.sans, fontSize: 13, color: C.ink, flex: 1 },
  btn: {
    backgroundColor: C.orange, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', height: 52,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontFamily: FONT.sansBold, fontSize: 16, color: '#fff' },
  toggle: { fontFamily: FONT.sans, fontSize: 14, color: C.muted, textAlign: 'center' },
  toggleLink: { fontFamily: FONT.sansBold, color: C.orange },
});
