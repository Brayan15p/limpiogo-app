import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
  Animated, Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';
import { JobType } from '../../types';

// Precios base por tipo de servicio (COP)
const SERVICES: { id: JobType; emoji: string; label: string; desc: string; base: number; perSqm: number }[] = [
  { id: 'basic',  emoji: '🧹', label: 'Básica',        desc: 'Limpieza general · hasta 2h',  base: 60000,  perSqm: 400  },
  { id: 'deep',   emoji: '✨', label: 'Profunda',      desc: 'A fondo · 3-5h',               base: 110000, perSqm: 700  },
  { id: 'move',   emoji: '📦', label: 'Mudanza',       desc: 'Vaciado + limpieza completa',  base: 180000, perSqm: 900  },
  { id: 'office', emoji: '🏢', label: 'Oficinas',      desc: 'Espacios comerciales',         base: 90000,  perSqm: 550  },
  { id: 'custom', emoji: '⚙️', label: 'Personalizada', desc: 'Tú defines lo que necesitas',  base: 70000,  perSqm: 500  },
];

const EXTRAS: { id: string; label: string; emoji: string; price: number }[] = [
  { id: 'oven',    label: 'Horno',         emoji: '🔥', price: 15000 },
  { id: 'fridge',  label: 'Nevera',        emoji: '🧊', price: 12000 },
  { id: 'windows', label: 'Ventanas',      emoji: '🪟', price: 10000 },
  { id: 'pets',    label: 'Mascotas',      emoji: '🐾', price: 8000  },
  { id: 'laundry', label: 'Lavandería',    emoji: '👕', price: 18000 },
  { id: 'ironing', label: 'Planchado',     emoji: '👔', price: 14000 },
];

const SQM_MIN = 20;
const SQM_MAX = 300;
const SQM_STEP = 10;

function fmt(n: number) {
  return n.toLocaleString('es-CO');
}

export function EstimateScreen({ navigation }: any) {
  const { user } = useAuth();
  const [service, setService] = useState<JobType>('basic');
  const [sqm, setSqm]         = useState(60);
  const [extras, setExtras]   = useState<Set<string>>(new Set());

  const priceAnim = useRef(new Animated.Value(1)).current;

  const svc     = SERVICES.find(s => s.id === service)!;
  const extrasTotal = [...extras].reduce((acc, id) => {
    const e = EXTRAS.find(x => x.id === id);
    return acc + (e?.price ?? 0);
  }, 0);
  const total = svc.base + sqm * svc.perSqm + extrasTotal;
  const totalMax = Math.round(total * 1.15);

  const animatePrice = () => {
    Animated.sequence([
      Animated.timing(priceAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(priceAnim,  { toValue: 1,    useNativeDriver: true }),
    ]).start();
  };

  const changeSqm = (delta: number) => {
    setSqm(prev => {
      const next = Math.min(SQM_MAX, Math.max(SQM_MIN, prev + delta));
      animatePrice();
      return next;
    });
  };

  const toggleExtra = (id: string) => {
    setExtras(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      animatePrice();
      return n;
    });
  };

  const selectService = (id: JobType) => {
    setService(id);
    animatePrice();
  };

  const goSearch = () => {
    if (!user) {
      // Usuario sin auth: llevar a registro con el estimado como contexto
      navigation.navigate('Register', { prefilterBudget: total, prefilterType: service });
      return;
    }
    navigation.navigate('Search', { prefilterBudget: total, prefilterType: service });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Calcula tu precio</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Price Hero */}
          <LinearGradient colors={Gradients.heroPrimary} style={styles.priceCard}>
            <Text style={styles.priceLabel}>Estimado para tu hogar</Text>
            <Animated.View style={{ transform: [{ scale: priceAnim }] }}>
              <Text style={styles.priceValue}>${fmt(total)}</Text>
              <Text style={styles.priceRange}>hasta ${fmt(totalMax)} COP</Text>
            </Animated.View>
            <View style={styles.pricePillRow}>
              <View style={styles.pricePill}>
                <Ionicons name="shield-checkmark" size={13} color={Colors.sky200} />
                <Text style={styles.pricePillText}>Precio sin sorpresas</Text>
              </View>
              <View style={styles.pricePill}>
                <Ionicons name="star" size={13} color={Colors.sky200} />
                <Text style={styles.pricePillText}>Pros verificados</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Tipo de servicio */}
          <Text style={styles.sectionTitle}>¿Qué tipo de limpieza?</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map(s => {
              const active = service === s.id;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.serviceCard, active && styles.serviceCardActive]}
                  onPress={() => selectService(s.id)}
                >
                  <Text style={styles.serviceEmoji}>{s.emoji}</Text>
                  <Text style={[styles.serviceLabel, active && styles.serviceLabelActive]}>{s.label}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>{s.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Metros cuadrados */}
          <Text style={styles.sectionTitle}>¿Cuántos metros cuadrados?</Text>
          <View style={styles.sqmCard}>
            <Pressable
              style={[styles.sqmBtn, sqm <= SQM_MIN && styles.sqmBtnDisabled]}
              onPress={() => changeSqm(-SQM_STEP)}
              disabled={sqm <= SQM_MIN}
            >
              <Ionicons name="remove" size={22} color={sqm <= SQM_MIN ? Colors.ink4 : Colors.primary} />
            </Pressable>

            <View style={styles.sqmCenter}>
              <Text style={styles.sqmValue}>{sqm}</Text>
              <Text style={styles.sqmUnit}>m²</Text>
            </View>

            <Pressable
              style={[styles.sqmBtn, sqm >= SQM_MAX && styles.sqmBtnDisabled]}
              onPress={() => changeSqm(SQM_STEP)}
              disabled={sqm >= SQM_MAX}
            >
              <Ionicons name="add" size={22} color={sqm >= SQM_MAX ? Colors.ink4 : Colors.primary} />
            </Pressable>
          </View>

          {/* Referencia visual de tamaño */}
          <View style={styles.sqmRef}>
            {[
              { label: 'Estudio', sqm: 40 },
              { label: 'Apto 2h', sqm: 70 },
              { label: 'Casa',    sqm: 120 },
              { label: 'Grande',  sqm: 200 },
            ].map(r => (
              <Pressable key={r.label} onPress={() => { setSqm(r.sqm); animatePrice(); }} style={styles.sqmRefChip}>
                <Text style={[styles.sqmRefText, sqm === r.sqm && styles.sqmRefTextActive]}>{r.label}</Text>
                <Text style={[styles.sqmRefSub, sqm === r.sqm && styles.sqmRefSubActive]}>{r.sqm}m²</Text>
              </Pressable>
            ))}
          </View>

          {/* Extras */}
          <Text style={styles.sectionTitle}>Extras opcionales</Text>
          <View style={styles.extrasGrid}>
            {EXTRAS.map(e => {
              const active = extras.has(e.id);
              return (
                <Pressable
                  key={e.id}
                  style={[styles.extraChip, active && styles.extraChipActive]}
                  onPress={() => toggleExtra(e.id)}
                >
                  <Text style={styles.extraEmoji}>{e.emoji}</Text>
                  <Text style={[styles.extraLabel, active && styles.extraLabelActive]}>{e.label}</Text>
                  <Text style={[styles.extraPrice, active && styles.extraPriceActive]}>
                    +${fmt(e.price)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Desglose */}
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Desglose</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Servicio {svc.label}</Text>
              <Text style={styles.breakdownVal}>${fmt(svc.base)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Por m² ({sqm}m²)</Text>
              <Text style={styles.breakdownVal}>${fmt(sqm * svc.perSqm)}</Text>
            </View>
            {[...extras].map(id => {
              const e = EXTRAS.find(x => x.id === id)!;
              return (
                <View key={id} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{e.emoji} {e.label}</Text>
                  <Text style={styles.breakdownVal}>${fmt(e.price)}</Text>
                </View>
              );
            })}
            <View style={[styles.breakdownRow, styles.breakdownTotal]}>
              <Text style={styles.breakdownTotalLabel}>Total estimado</Text>
              <Text style={styles.breakdownTotalVal}>${fmt(total)}</Text>
            </View>
          </View>

          {/* Nota */}
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.ink3} />
            <Text style={styles.noteText}>
              El precio final lo acuerdan tú y el pro antes de confirmar. Este estimado es orientativo.
            </Text>
          </View>

          {/* F29: acceso a cotización por foto */}
          <Pressable
            style={[styles.photoBtn, Shadow.sm]}
            onPress={() => navigation.navigate('PhotoEstimate')}
          >
            <Ionicons name="camera-outline" size={18} color={Colors.primary} />
            <Text style={styles.photoBtnText}>O toma una foto de tu espacio →</Text>
          </Pressable>

          {/* CTA */}
          <Pressable style={[styles.cta, Shadow.cta]} onPress={goSearch}>
            <Ionicons name={user ? 'search' : 'person-add'} size={18} color="#fff" />
            <Text style={styles.ctaText}>
              {user ? 'Buscar pros para este precio' : 'Registrarme y buscar pros'}
            </Text>
          </Pressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  back:        { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
                 alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { ...Typography.h4, color: Colors.ink },
  scroll:      { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

  // Price hero
  priceCard:   { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
                 marginBottom: Spacing.xl },
  priceLabel:  { ...Typography.small, color: Colors.sky200, letterSpacing: 0.5, textTransform: 'uppercase' },
  priceValue:  { ...Typography.display, color: '#fff', textAlign: 'center' },
  priceRange:  { ...Typography.small, color: Colors.sky300, textAlign: 'center', marginTop: -4 },
  pricePillRow:{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  pricePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)',
                 borderRadius: Radius.full, paddingVertical: 5, paddingHorizontal: 12 },
  pricePillText:{ ...Typography.caption, color: Colors.sky100 },

  sectionTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.md, marginTop: Spacing.lg },

  // Services
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  serviceCard:  { width: '30%', flexGrow: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
                  padding: Spacing.md, alignItems: 'center', gap: 4,
                  borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm },
  serviceCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  serviceEmoji: { fontSize: 22 },
  serviceLabel: { ...Typography.smallBold, color: Colors.ink, textAlign: 'center' },
  serviceLabelActive: { color: Colors.primary },
  serviceDesc:  { ...Typography.micro, color: Colors.ink3, textAlign: 'center' },

  // Sqm
  sqmCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
               borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.xl,
               justifyContent: 'space-between', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  sqmBtn:    { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight,
               alignItems: 'center', justifyContent: 'center' },
  sqmBtnDisabled: { backgroundColor: Colors.surfaceAlt },
  sqmCenter: { alignItems: 'center' },
  sqmValue:  { ...Typography.display, color: Colors.ink },
  sqmUnit:   { ...Typography.small, color: Colors.ink3, marginTop: -4 },

  sqmRef:        { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  sqmRefChip:    { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm,
                   alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sqmRefText:    { ...Typography.caption, color: Colors.ink3 },
  sqmRefTextActive:{ color: Colors.primary, fontWeight: '700' },
  sqmRefSub:     { ...Typography.micro, color: Colors.ink4, marginTop: 2 },
  sqmRefSubActive: { color: Colors.primaryHover },

  // Extras
  extrasGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  extraChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface,
                 borderRadius: Radius.lg, paddingVertical: 10, paddingHorizontal: Spacing.md,
                 borderWidth: 1.5, borderColor: Colors.border, ...Shadow.sm },
  extraChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  extraEmoji:  { fontSize: 16 },
  extraLabel:  { ...Typography.smallBold, color: Colors.ink },
  extraLabelActive: { color: Colors.primary },
  extraPrice:  { ...Typography.caption, color: Colors.ink3 },
  extraPriceActive: { color: Colors.primaryHover },

  // Breakdown
  breakdown:       { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
                     gap: Spacing.sm, marginTop: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  breakdownTitle:  { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.xs },
  breakdownRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel:  { ...Typography.small, color: Colors.ink2 },
  breakdownVal:    { ...Typography.smallBold, color: Colors.ink },
  breakdownTotal:  { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.xs },
  breakdownTotalLabel: { ...Typography.bodyMed, color: Colors.ink, fontWeight: '700' },
  breakdownTotalVal:   { ...Typography.h4, color: Colors.primary },

  note:     { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, alignItems: 'flex-start' },
  noteText: { ...Typography.small, color: Colors.ink3, flex: 1, lineHeight: 18 },

  photoBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                  backgroundColor: Colors.primaryLight, borderRadius: Radius.xl, paddingVertical: 14,
                  marginTop: Spacing.lg, borderWidth: 1.5, borderColor: Colors.primarySoft },
  photoBtnText: { ...Typography.smallBold, color: Colors.primary },

  cta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
             backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 18,
             marginTop: Spacing.xl },
  ctaText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700', fontSize: 16 },
});
