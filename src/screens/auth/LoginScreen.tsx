import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DeviceMotion } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

export function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const orbeX = useRef(new Animated.Value(0)).current;
  const orbeY = useRef(new Animated.Value(0)).current;
  const cardX = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    DeviceMotion.setUpdateInterval(60);
    const sub = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;
      Animated.spring(orbeX, { toValue: rotation.gamma * 30, useNativeDriver: true, speed: 4, bounciness: 0 }).start();
      Animated.spring(orbeY, { toValue: rotation.beta * 20, useNativeDriver: true, speed: 4, bounciness: 0 }).start();
      Animated.spring(cardX, { toValue: rotation.gamma * 8, useNativeDriver: true, speed: 6, bounciness: 0 }).start();
      Animated.spring(cardY, { toValue: rotation.beta * 5, useNativeDriver: true, speed: 6, bounciness: 0 }).start();
    });
    return () => sub.remove();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Ingresa tu correo';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Correo inválido';
    if (!password) e.password = 'Ingresa tu contraseña';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) Alert.alert('No pudimos iniciar sesión',
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.' : error.message);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <LinearGradient colors={[Colors.sky100, Colors.sky50, '#ffffff']}
        style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.orbe, { transform: [{ translateX: orbeX }, { translateY: orbeY }] }]} />
      <Animated.View style={[styles.orbe2, { transform: [{ translateX: Animated.multiply(orbeX, -0.6) }, { translateY: Animated.multiply(orbeY, -0.6) }] }]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <Pressable onPress={() => navigation.goBack()} style={styles.back}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>

            <View style={styles.header}>
              <View style={styles.logoIcon}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Bienvenido de vuelta</Text>
              <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
            </View>

            <Animated.View style={[styles.card, Shadow.card, { transform: [{ translateX: cardX }, { translateY: cardY }] }]}>
              <Input label="Correo electrónico" icon="mail-outline"
                placeholder="tu@correo.com" value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" error={errors.email} />
              <Input label="Contraseña" icon="lock-closed-outline"
                placeholder="Tu contraseña" value={password} onChangeText={setPassword}
                password error={errors.password} />
              <Pressable style={styles.forgot} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotTxt}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
              <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} />
            </Animated.View>

            <View style={styles.divRow}>
              <View style={styles.div} /><Text style={styles.divTxt}>¿No tienes cuenta?</Text>
              <View style={styles.div} />
            </View>
            <Button label="Crear cuenta gratis" variant="secondary"
              onPress={() => navigation.navigate('Register', { role: 'client' })} />

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
  orbe2: {
    position: 'absolute', bottom: 60, left: -80,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.sky300, opacity: 0.25,
  },
  back: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xxl, ...Shadow.sm,
  },
  header: { marginBottom: Spacing.xxl },
  logoIcon: {
    width: 48, height: 48, borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.sky200,
  },
  title: { ...Typography.h2, color: Colors.ink, marginBottom: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.ink3 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xxl,
    padding: Spacing.xxl, marginBottom: Spacing.xxl,
    borderWidth: 1, borderColor: Colors.sky100,
  },
  forgot: { alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm },
  forgotTxt: { ...Typography.small, color: Colors.primary, fontWeight: '700' },
  divRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  div: { flex: 1, height: 1, backgroundColor: Colors.border },
  divTxt: { ...Typography.small, color: Colors.ink4 },
});
