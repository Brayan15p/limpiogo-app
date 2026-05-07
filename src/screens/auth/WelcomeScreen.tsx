import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle, Defs, Ellipse, Line, LinearGradient as SvgGrad,
  Path, Rect, Stop,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Colors, Radius, Spacing, Typography } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');
// Casa más pequeña para que no coma demasiado espacio vertical
const HOUSE_W = Math.min(W * 0.65, 220);
const HOUSE_H = HOUSE_W * 0.85;

function HouseIllustration() {
  return (
    <Svg viewBox="0 0 260 220" width={HOUSE_W} height={HOUSE_H}>
      <Defs>
        <SvgGrad id="roofG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2563EB" />
          <Stop offset="1" stopColor="#1D4ED8" />
        </SvgGrad>
        <SvgGrad id="wallG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E0F2FE" />
          <Stop offset="1" stopColor="#BAE6FD" />
        </SvgGrad>
      </Defs>
      <Ellipse cx="130" cy="200" rx="95" ry="8" fill="#0F172A" fillOpacity={0.07} />
      {/* Plantas */}
      <Circle cx="32" cy="175" r="16" fill="#86EFAC" opacity={0.8} />
      <Circle cx="42" cy="168" r="13" fill="#4ADE80" opacity={0.9} />
      <Rect x="35" y="175" width="4" height="18" rx="2" fill="#1E293B" />
      <Circle cx="228" cy="170" r="14" fill="#86EFAC" opacity={0.8} />
      <Circle cx="218" cy="165" r="11" fill="#4ADE80" opacity={0.9} />
      <Rect x="222" y="172" width="4" height="18" rx="2" fill="#1E293B" />
      {/* Paredes */}
      <Rect x="55" y="85" width="150" height="110" rx="4" fill="url(#wallG)" />
      <Rect x="55" y="85" width="150" height="6" fill="#0F172A" fillOpacity={0.07} />
      {/* Techo */}
      <Path d="M40 92 L130 30 L220 92 L205 92 L130 42 L55 92 Z" fill="url(#roofG)" />
      {/* Chimenea */}
      <Rect x="165" y="50" width="16" height="28" rx="1" fill="#1E293B" />
      <Circle cx="173" cy="44" r="5" fill="white" opacity={0.65} />
      <Circle cx="176" cy="37" r="4" fill="white" opacity={0.5} />
      <Circle cx="171" cy="31" r="3" fill="white" opacity={0.35} />
      {/* Puerta */}
      <Rect x="112" y="135" width="36" height="60" rx="2" fill="#1E293B" />
      <Rect x="112" y="135" width="36" height="60" rx="2" fill="#2563EB" fillOpacity={0.28} />
      <Circle cx="141" cy="166" r="2" fill="#FCD34D" />
      <Rect x="105" y="193" width="50" height="4" rx="1" fill="#2563EB" fillOpacity={0.55} />
      {/* Ventana izq */}
      <Rect x="70" y="105" width="30" height="28" rx="2" fill="#BAE6FD" />
      <Rect x="70" y="105" width="30" height="28" rx="2" fill="white" fillOpacity={0.35} />
      <Line x1="85" y1="105" x2="85" y2="133" stroke="#1E293B" strokeWidth="1.2" />
      <Line x1="70" y1="119" x2="100" y2="119" stroke="#1E293B" strokeWidth="1.2" />
      {/* Ventana der */}
      <Rect x="160" y="105" width="30" height="28" rx="2" fill="#BAE6FD" />
      <Rect x="160" y="105" width="30" height="28" rx="2" fill="white" fillOpacity={0.35} />
      <Line x1="175" y1="105" x2="175" y2="133" stroke="#1E293B" strokeWidth="1.2" />
      <Line x1="160" y1="119" x2="190" y2="119" stroke="#1E293B" strokeWidth="1.2" />
      {/* Sparkles */}
      <Path d="M35 60 L37 68 L45 70 L37 72 L35 80 L33 72 L25 70 L33 68 Z" fill="#0EA5E9" />
      <Path d="M210 50 L211 56 L217 57 L211 58 L210 64 L209 58 L203 57 L209 56 Z" fill="#0EA5E9" opacity={0.8} />
      <Path d="M225 115 L227 121 L233 123 L227 125 L225 131 L223 125 L217 123 L223 121 Z" fill="#38BDF8" />
      {/* Corazón */}
      <Circle cx="130" cy="85" r="14" fill="white" />
      <Circle cx="130" cy="85" r="14" fill="#2563EB" fillOpacity={0.12} />
      <Path
        d="M130 92 C125 88,122 85,122 81.5 C122 79,124 77,126.5 77 C128 77,129.5 78,130 79 C130.5 78,132 77,133.5 77 C136 77,138 79,138 81.5 C138 85,135 88,130 92 Z"
        fill="#2563EB"
      />
    </Svg>
  );
}

const TRUST = [
  { icon: 'shield-checkmark' as const, label: 'Verificados' },
  { icon: 'star' as const, label: '4.9 ★' },
  { icon: 'refresh-circle' as const, label: 'Garantía 100%' },
];

export function WelcomeScreen({ navigation }: any) {
  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, delay: 60, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  const anim = { opacity: fade, transform: [{ translateY: slideUp }] };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#E0F2FE" />
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#EFF6FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      {/* Orbes decorativos */}
      <View style={styles.orbeTopRight} />
      <View style={styles.orbeLeft} />

      <SafeAreaView style={styles.safe}>
        {/* ── TOP: Logo + badge ── */}
        <Animated.View style={[styles.topRow, { opacity: fade }]}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={['#38BDF8', '#2563EB']}
              style={styles.logoBox}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14 3L21 10M10 7L17 14M4 20l5-9 6 6-9 5-2-2z"
                  stroke="white" strokeWidth="2.3"
                  strokeLinecap="round" strokeLinejoin="round"
                />
                <Circle cx="19" cy="6" r="1.2" fill="white" />
              </Svg>
            </LinearGradient>
            <Text style={styles.logoText}>
              Limpio<Text style={styles.logoAccent}>GO</Text>
            </Text>
          </View>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeTxt}>2,400 en línea</Text>
          </View>
        </Animated.View>

        {/* ── CENTER: Ilustración + título + pills (flex: 1) ── */}
        <View style={styles.center}>
          <Animated.View style={[styles.houseWrap, anim]}>
            <HouseIllustration />
          </Animated.View>

          <Animated.View style={[styles.titleBlock, anim]}>
            <Text style={styles.titleMain}>Tu casa,{'\n'}</Text>
            <Text style={styles.titleAccent}>impecable.</Text>
            <Text style={styles.subtitle}>
              Conéctate con limpiadores verificados cerca de ti.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.pillsRow, { opacity: fade }]}>
            {TRUST.map((p, i) => (
              <View key={i} style={styles.pill}>
                <Ionicons name={p.icon} size={11} color="#1D4ED8" />
                <Text style={styles.pillTxt}>{p.label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* ── BOTTOM: CTAs ── */}
        <Animated.View style={[styles.ctas, anim]}>
          <Button
            label="Quiero contratar limpieza"
            onPress={() => navigation.navigate('Register', { role: 'client' })}
            icon={<Ionicons name="home-outline" size={15} color="#fff" />}
          />
          <Button
            label="Ofrecer mis servicios"
            onPress={() => navigation.navigate('Register', { role: 'pro' })}
            variant="secondary"
            icon={<Ionicons name="briefcase-outline" size={15} color={Colors.dark} />}
          />
          {/* F16: calculadora sin login */}
          <Pressable
            onPress={() => navigation.navigate('Estimate')}
            style={styles.estimateRow}
            hitSlop={8}
          >
            <Ionicons name="calculator-outline" size={14} color={Colors.primary} />
            <Text style={styles.estimateTxt}>Calcular precio antes de registrarme</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={styles.loginRow}
            hitSlop={8}
          >
            <Text style={styles.loginTxt}>¿Ya tienes cuenta? </Text>
            <Text style={[styles.loginTxt, styles.loginLink]}>Iniciar sesión</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  orbeTopRight: {
    position: 'absolute', top: -80, right: -100,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#7DD3FC', opacity: 0.4,
  },
  orbeLeft: {
    position: 'absolute', top: 200, left: -80,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#38BDF8', opacity: 0.15,
  },

  /* Top bar */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  logoAccent: { color: '#2563EB' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1, borderColor: '#BAE6FD',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: Radius.full,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.ok },
  badgeTxt: { ...Typography.caption, color: '#1E293B' },

  /* Centro expandible */
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  houseWrap: { alignItems: 'center' },

  titleBlock: { alignItems: 'center' },
  titleMain: {
    fontSize: 36, fontWeight: '700',
    color: '#0F172A', letterSpacing: -1.2, lineHeight: 40,
    textAlign: 'center',
  },
  titleAccent: {
    fontSize: 36, fontWeight: '700', fontStyle: 'italic',
    color: '#2563EB', letterSpacing: -1.2,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.small, color: '#475569',
    lineHeight: 20, marginTop: Spacing.xs,
    textAlign: 'center', maxWidth: 280,
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1, borderColor: '#BAE6FD',
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: Radius.full,
  },
  pillTxt: { ...Typography.caption, color: '#1E293B', fontWeight: '700' },

  /* CTAs en el fondo */
  ctas: { gap: Spacing.md },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  estimateTxt: { ...Typography.small, color: Colors.primary, fontWeight: '600' },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  loginTxt: { ...Typography.small, color: '#94A3B8' },
  loginLink: { color: '#2563EB', fontWeight: '700' },
});
