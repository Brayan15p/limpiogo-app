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
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import type { UserRole } from '../../types';

export function RegisterScreen({ navigation, route }: any) {
  const { signUp } = useAuth();
  const [role, setRole] = useState<UserRole>(route.params?.role ?? 'client');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const v1 = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Ingresa tu nombre';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo inválido';
    if (!form.phone.trim()) e.phone = 'Ingresa tu teléfono';
    setErrors(e); return !Object.keys(e).length;
  };
  const v2 = () => {
    const e: Record<string, string> = {};
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirm) e.confirm = 'No coinciden';
    setErrors(e); return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!v2()) return;
    setLoading(true);
    const { error } = await signUp({
      email: form.email.trim().toLowerCase(), password: form.password,
      full_name: form.full_name.trim(), phone: form.phone.trim(), role,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('¡Cuenta creada! 🎉', 'Revisa tu correo para confirmar.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <LinearGradient colors={[Colors.sky100, Colors.sky50, '#ffffff']}
        style={StyleSheet.absoluteFill} />
      <View style={styles.orbe} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <Pressable onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.back}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>

            {/* Toggle cliente / pro */}
            <View style={[styles.toggle, Shadow.sm]}>
              {(['client', 'pro'] as UserRole[]).map(r => (
                <Pressable key={r} onPress={() => { setRole(r); setErrors({}); }}
                  style={[styles.toggleBtn, role === r && styles.toggleActive]}>
                  <Text style={[styles.toggleTxt, role === r && styles.toggleTxtActive]}>
                    {r === 'client' ? '🏠 Cliente' : '🧹 Profesional'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.header}>
              <View style={[styles.roleIcon,
                { backgroundColor: role === 'client' ? Colors.primarySoft : Colors.sky100 }]}>
                <Text style={{ fontSize: 22 }}>{role === 'client' ? '🏠' : '🧹'}</Text>
              </View>
              <Text style={styles.title}>
                {role === 'client' ? 'Crea tu cuenta' : 'Únete como Pro'}
              </Text>
              <Text style={styles.subtitle}>
                {role === 'client'
                  ? 'Encuentra limpiadores de confianza cerca de ti'
                  : 'Crece tu negocio y conecta con nuevos clientes'}
              </Text>
            </View>

            {/* Steps */}
            <View style={styles.steps}>
              <View style={styles.stepDot}><Text style={styles.stepTxt}>{step > 1 ? '✓' : '1'}</Text></View>
              <View style={[styles.stepLine, step > 1 && styles.stepLineDone]} />
              <View style={[styles.stepDot, step < 2 && styles.stepDotOff]}>
                <Text style={[styles.stepTxt, step < 2 && styles.stepTxtOff]}>2</Text>
              </View>
            </View>

            <View style={[styles.card, Shadow.card]}>
              {step === 1 ? (
                <>
                  <Input label="Nombre completo" icon="person-outline" placeholder="Ana García"
                    value={form.full_name} onChangeText={set('full_name')} autoCapitalize="words" error={errors.full_name} />
                  <Input label="Correo" icon="mail-outline" placeholder="ana@correo.com"
                    value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
                  <Input label="Teléfono" icon="call-outline" placeholder="+52 55 1234 5678"
                    value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
                  <Button label="Continuar" onPress={() => v1() && setStep(2)} />
                </>
              ) : (
                <>
                  <Text style={styles.step2Title}>Elige una contraseña segura</Text>
                  <Input label="Contraseña" icon="lock-closed-outline" placeholder="Mínimo 8 caracteres"
                    value={form.password} onChangeText={set('password')} password error={errors.password} hint="Letras, números y símbolos" />
                  <Input label="Confirmar" icon="lock-closed-outline" placeholder="Repite tu contraseña"
                    value={form.confirm} onChangeText={set('confirm')} password error={errors.confirm} />
                  <View style={styles.secNote}>
                    <Ionicons name="shield-checkmark" size={15} color={Colors.ok} />
                    <Text style={styles.secTxt}>Datos cifrados de extremo a extremo</Text>
                  </View>
                  <Button label="Crear mi cuenta" onPress={submit} loading={loading} />
                </>
              )}
            </View>

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginRow}>
              <Text style={styles.loginTxt}>¿Ya tienes cuenta? </Text>
              <Text style={[styles.loginTxt, { color: Colors.primary, fontWeight: '700' }]}>Inicia sesión</Text>
            </Pressable>

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
  orbe: {
    position: 'absolute', top: -80, right: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: Colors.sky200, opacity: 0.45,
  },
  back: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, ...Shadow.sm,
  },
  toggle: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.full, padding: 4, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.sky200,
  },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: Radius.full, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.primary },
  toggleTxt: { ...Typography.smallBold, color: Colors.ink3 },
  toggleTxtActive: { color: '#fff' },
  header: { marginBottom: Spacing.xl },
  roleIcon: {
    width: 52, height: 52, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  title: { ...Typography.h2, color: Colors.ink, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.ink3 },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl, paddingHorizontal: Spacing.xxl },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepDotOff: { backgroundColor: Colors.border },
  stepTxt: { ...Typography.smallBold, color: '#fff' },
  stepTxtOff: { color: Colors.ink4 },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.primary },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xxl,
    padding: Spacing.xxl, marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.sky100,
  },
  step2Title: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.lg },
  secNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.okLight, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  secTxt: { ...Typography.small, color: Colors.ink2, flex: 1 },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginTxt: { ...Typography.small, color: Colors.ink3 },
});
