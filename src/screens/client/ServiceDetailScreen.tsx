import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Animated, Dimensions, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

const { width: W } = Dimensions.get('window');

const SERVICES: Record<string, {
  emoji: string; title: string; tagline: string;
  duration: string; price: string; color: string; colorLight: string;
  includes: string[]; process: { icon: string; step: string; desc: string }[];
}> = {
  basic: {
    emoji: '🧹', title: 'Limpieza Básica', tagline: 'Rápida y efectiva para el mantenimiento diario',
    duration: '1 — 2 horas', price: 'desde $80.000', color: Colors.primary, colorLight: Colors.primarySoft,
    includes: ['Barrido y trapeado de todos los pisos', 'Limpieza de superficies y mesones', 'Aseo de baños', 'Organización básica de cocina', 'Limpieza de espejos y vidrios accesibles', 'Vaciado de papeleras'],
    process: [
      { icon: 'person-outline', step: 'Llegada', desc: 'El pro llega puntual con todos sus implementos' },
      { icon: 'search-outline', step: 'Evaluación', desc: 'Recorre el espacio contigo en 5 min' },
      { icon: 'sparkles-outline', step: 'Limpieza', desc: 'Ejecuta el servicio de forma profesional' },
      { icon: 'checkmark-circle-outline', step: 'Revisión', desc: 'Confirmas que todo quedó perfecto' },
    ],
  },
  deep: {
    emoji: '✨', title: 'Limpieza Profunda', tagline: 'Limpieza exhaustiva de cada rincón',
    duration: '3 — 5 horas', price: 'desde $150.000', color: '#7C3AED', colorLight: '#EDE9FE',
    includes: ['Todo lo de limpieza básica', 'Desengrase de cocina completa', 'Limpieza dentro de nevera y microondas', 'Limpieza de ventanas por dentro', 'Desinfección de baños a fondo', 'Limpieza de zócalos y rodapiés', 'Aspirado de muebles y colchones', 'Limpieza de lámparas y apliques'],
    process: [
      { icon: 'person-outline', step: 'Llegada', desc: 'El pro llega con equipo especializado' },
      { icon: 'clipboard-outline', step: 'Checklist', desc: 'Revisión item por item contigo' },
      { icon: 'sparkles-outline', step: 'Limpieza', desc: 'Limpieza exhaustiva zona por zona' },
      { icon: 'checkmark-circle-outline', step: 'Entrega', desc: 'Recorrido final para tu aprobación' },
    ],
  },
  move: {
    emoji: '📦', title: 'Limpieza de Mudanza', tagline: 'Deja el espacio impecable para entregarlo',
    duration: 'Según m²', price: 'desde $220.000', color: Colors.ok, colorLight: Colors.okLight,
    includes: ['Limpieza total de apartamento vacío', 'Desengrase completo de cocina', 'Desinfección de baños', 'Limpieza de closets y alacenas por dentro', 'Limpieza de ventanas interiores', 'Eliminación de manchas en paredes', 'Limpieza de balcón o terraza'],
    process: [
      { icon: 'home-outline', step: 'Inspección', desc: 'Cotización ajustada según los metros' },
      { icon: 'cube-outline', step: 'Desocupado', desc: 'Se realiza con el espacio vacío' },
      { icon: 'sparkles-outline', step: 'Limpieza', desc: 'Limpieza integral de todo el espacio' },
      { icon: 'camera-outline', step: 'Fotos', desc: 'Evidencia fotográfica del antes/después' },
    ],
  },
  office: {
    emoji: '🏢', title: 'Limpieza de Oficinas', tagline: 'Espacios de trabajo limpios y profesionales',
    duration: 'Flexible', price: 'desde $120.000', color: Colors.warn, colorLight: Colors.warnLight,
    includes: ['Limpieza de estaciones de trabajo', 'Desinfección de teléfonos y teclados', 'Limpieza de salas de reuniones', 'Aseo de cocina y zona de café', 'Limpieza de baños corporativos', 'Vaciado de basuras', 'Aspirado de alfombras'],
    process: [
      { icon: 'time-outline', step: 'Horario', desc: 'Antes, durante o después de oficina' },
      { icon: 'lock-closed-outline', step: 'Acceso', desc: 'Con llave o coordinado con recepción' },
      { icon: 'sparkles-outline', step: 'Servicio', desc: 'Limpieza discreta y profesional' },
      { icon: 'repeat-outline', step: 'Recurrente', desc: 'Planes diarios, semanales o quincenales' },
    ],
  },
};

export function ServiceDetailScreen({ route, navigation }: any) {
  const serviceId: string = route?.params?.serviceId ?? 'basic';
  const service = SERVICES[serviceId] ?? SERVICES.basic;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [160, 220], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Floating header on scroll */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.floatingInner}>
            <Pressable style={styles.backBtn2} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <Text style={styles.floatingTitle}>{service.title}</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <LinearGradient colors={[service.color, service.colorLight, Colors.bg]} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={styles.heroContent}>
              <Text style={styles.heroEmoji}>{service.emoji}</Text>
              <Text style={styles.heroTitle}>{service.title}</Text>
              <Text style={styles.heroTagline}>{service.tagline}</Text>
              <View style={styles.heroPills}>
                <View style={styles.heroPill}>
                  <Ionicons name="time-outline" size={13} color={service.color} />
                  <Text style={[styles.heroPillText, { color: service.color }]}>{service.duration}</Text>
                </View>
                <View style={styles.heroPill}>
                  <Ionicons name="pricetag-outline" size={13} color={service.color} />
                  <Text style={[styles.heroPillText, { color: service.color }]}>{service.price}</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>

          {/* ¿Qué incluye? */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Qué incluye?</Text>
            <View style={styles.includesCard}>
              {service.includes.map((item, i) => (
                <View key={i} style={styles.includeRow}>
                  <View style={[styles.includeDot, { backgroundColor: service.color }]} />
                  <Text style={styles.includeText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cómo funciona */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
            {service.process.map((p, i) => (
              <View key={i} style={styles.processRow}>
                <View style={[styles.processIconWrap, { backgroundColor: service.colorLight }]}>
                  <Ionicons name={p.icon as any} size={18} color={service.color} />
                </View>
                {i < service.process.length - 1 && <View style={styles.processLine} />}
                <View style={styles.processText}>
                  <Text style={styles.processStep}>{p.step}</Text>
                  <Text style={styles.processDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Por qué LimpioGO */}
          <View style={styles.trustCard}>
            <Text style={styles.trustTitle}>¿Por qué contratar con LimpioGO?</Text>
            {[
              { icon: 'shield-checkmark', text: 'Pros verificados con antecedentes' },
              { icon: 'star',             text: 'Calificaciones reales de usuarios' },
              { icon: 'chatbubbles',      text: 'Chat directo con el pro' },
              { icon: 'location',         text: 'Seguimiento en tiempo real' },
            ].map((t, i) => (
              <View key={i} style={styles.trustRow}>
                <View style={styles.trustIconWrap}>
                  <Ionicons name={t.icon as any} size={16} color={Colors.primary} />
                </View>
                <Text style={styles.trustText}>{t.text}</Text>
              </View>
            ))}
          </View>

        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* CTA */}
      <View style={[styles.ctaBar, Shadow.lg]}>
        <View style={styles.ctaPrice}>
          <Text style={styles.ctaPriceLabel}>Precio estimado</Text>
          <Text style={styles.ctaPriceValue}>{service.price}</Text>
        </View>
        <Pressable
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('Booking', { serviceId })}
        >
          <LinearGradient colors={[service.color, service.color + 'CC']} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.ctaText}>Agendar ahora</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  floatingHeader:  { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: Colors.surface, borderBottomWidth: 1, borderColor: Colors.border },
  floatingInner:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  floatingTitle:   { flex: 1, ...Typography.h4, color: Colors.ink, textAlign: 'center', marginHorizontal: Spacing.md },
  backBtn2:        { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },

  hero:        { paddingBottom: Spacing.xxxl },
  backBtn:     { margin: Spacing.xl, width: 38, height: 38, borderRadius: Radius.md, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, alignItems: 'flex-start' },
  heroEmoji:   { fontSize: 52, marginBottom: Spacing.md },
  heroTitle:   { ...Typography.h1, color: '#fff', marginBottom: Spacing.sm },
  heroTagline: { ...Typography.body, color: 'rgba(255,255,255,0.85)', lineHeight: 22, marginBottom: Spacing.lg },
  heroPills:   { flexDirection: 'row', flexWrap: 'wrap' },
  heroPill:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6, marginRight: Spacing.sm, marginBottom: Spacing.sm },
  heroPillText:{ ...Typography.smallBold, marginLeft: 4 },

  body:    { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.md },

  includesCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.sky100 },
  includeRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  includeDot:   { width: 7, height: 7, borderRadius: 4, marginRight: Spacing.md, flexShrink: 0 },
  includeText:  { ...Typography.body, color: Colors.ink2, flex: 1, lineHeight: 22 },

  processRow:     { flexDirection: 'row', marginBottom: Spacing.md, position: 'relative' },
  processIconWrap:{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  processLine:    { position: 'absolute', left: 21, top: 44, width: 2, height: Spacing.md, backgroundColor: Colors.border },
  processText:    { flex: 1, paddingLeft: Spacing.md, paddingTop: 2 },
  processStep:    { ...Typography.bodyMed, color: Colors.ink, marginBottom: 2 },
  processDesc:    { ...Typography.small, color: Colors.ink3, lineHeight: 18 },

  trustCard:    { backgroundColor: Colors.primarySoft, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xxl, borderWidth: 1, borderColor: Colors.sky200 },
  trustTitle:   { ...Typography.bodyMed, color: Colors.primary, marginBottom: Spacing.md },
  trustRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  trustIconWrap:{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  trustText:    { ...Typography.body, color: Colors.ink2 },

  ctaBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: Spacing.xl, paddingBottom: 32, paddingTop: Spacing.lg, borderTopWidth: 1, borderColor: Colors.border },
  ctaPrice: { flex: 1, marginRight: Spacing.md },
  ctaPriceLabel: { ...Typography.caption, color: Colors.ink3 },
  ctaPriceValue: { ...Typography.h4, color: Colors.ink },
  ctaBtn:   { flex: 1.4, borderRadius: Radius.xl, overflow: 'hidden' },
  ctaGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  ctaText:  { ...Typography.bodyMed, color: '#fff', fontWeight: '700', marginRight: Spacing.sm },
});
