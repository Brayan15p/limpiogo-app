import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) { setError('Ingresa tu correo'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Correo inválido'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'limpiogo://reset-password',
    });
    setLoading(false);
    if (err) {
      Alert.alert('Error', err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <LinearGradient colors={[Colors.sky100, Colors.sky50, '#ffffff']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <Pressable onPress={() => navigation.goBack()} style={styles.back}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>

            {sent ? (
              <View style={styles.successBox}>
                <View style={styles.successIcon}>
                  <Ionicons name="mail-open-outline" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.successTitle}>¡Revisa tu correo!</Text>
                <Text style={styles.successBody}>
                  Te enviamos un enlace a <Text style={{ fontWeight: '700' }}>{email}</Text> para que puedas crear una nueva contraseña.
                </Text>
                <Text style={styles.successHint}>
                  Si no lo ves, revisa la carpeta de spam.
                </Text>
                <View style={{ marginTop: Spacing.xl, width: '100%' }}>
                  <Button label="Volver al inicio" onPress={() => navigation.navigate('Login')} />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <View style={styles.logoIcon}>
                    <Ionicons name="lock-open-outline" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                  <Text style={styles.subtitle}>
                    Ingresa tu correo y te enviamos un enlace para restablecerla.
                  </Text>
                </View>

                <View style={[styles.card, Shadow.card]}>
                  <Input
                    label="Correo electrónico"
                    icon="mail-outline"
                    placeholder="tu@correo.com"
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={error}
                  />
                  <Button label="Enviar enlace" onPress={handleReset} loading={loading} />
                </View>

                <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
                  <Ionicons name="arrow-back-outline" size={16} color={Colors.primary} />
                  <Text style={styles.backLinkTxt}>Volver al inicio de sesión</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  back: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xxl, ...Shadow.sm,
  },
  header: { marginBottom: Spacing.xxl },
  logoIcon: {
    width: 56, height: 56, borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.sky200,
  },
  title: { ...Typography.h2, color: Colors.ink, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.ink3, lineHeight: 22 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xxl,
    padding: Spacing.xxl, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.sky100,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, justifyContent: 'center' },
  backLinkTxt: { ...Typography.small, color: Colors.primary, fontWeight: '700' },
  successBox: { alignItems: 'center', paddingTop: Spacing.xxxl },
  successIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xxl, borderWidth: 1, borderColor: Colors.sky200,
  },
  successTitle: { ...Typography.h2, color: Colors.ink, marginBottom: Spacing.md, textAlign: 'center' },
  successBody: { ...Typography.body, color: Colors.ink3, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.md },
  successHint: { ...Typography.small, color: Colors.ink4, textAlign: 'center' },
});
