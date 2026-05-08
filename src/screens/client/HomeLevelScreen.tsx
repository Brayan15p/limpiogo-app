import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LEVEL_CONFIG, LevelName, useHomeLevel } from '../../hooks/useHomeLevel';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

const LEVELS: { name: LevelName; threshold: number; benefits: string[] }[] = [
  { name: 'basico',     threshold: 0,  benefits: ['Acceso a todos los pros', 'Chat en tiempo real'] },
  { name: 'cuidado',    threshold: 3,  benefits: ['5% de descuento permanente', 'Prioridad en matches'] },
  { name: 'premium',    threshold: 8,  benefits: ['10% de descuento', 'Acceso a pros top', 'Soporte prioritario'] },
  { name: 'elite',      threshold: 15, benefits: ['15% de descuento', 'Agenda directa garantizada', 'Sorpresas mensuales'] },
  { name: 'legendario', threshold: 30, benefits: ['20% de descuento', '1 servicio gratis al año', 'Línea VIP'] },
];

export function HomeLevelScreen({ navigation }: any) {
  const { level, loading } = useHomeLevel();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </Pressable>
        <Text style={styles.title}>Mi nivel del hogar</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading || !level ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero nivel actual */}
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroEmoji}>{LEVEL_CONFIG[level.levelName].emoji}</Text>
            <Text style={[styles.heroName, { color: LEVEL_CONFIG[level.levelName].color }]}>
              {LEVEL_CONFIG[level.levelName].label}
            </Text>
            <Text style={styles.heroSub}>{level.bookingsCompleted} servicios completados</Text>

            {level.levelName !== 'legendario' && (
              <>
                <View style={styles.barBg}>
                  <View style={[
                    styles.barFill,
                    { width: `${Math.min(1, level.progress) * 100}%`,
                      backgroundColor: LEVEL_CONFIG[level.levelName].color }
                  ]} />
                </View>
                <Text style={styles.barHint}>
                  {level.nextThreshold - level.bookingsCompleted} servicios para el siguiente nivel
                </Text>
              </>
            )}
          </LinearGradient>

          {/* Escala de niveles */}
          <Text style={styles.sectionTitle}>Todos los niveles</Text>
          {LEVELS.map((l, i) => {
            const cfg = LEVEL_CONFIG[l.name];
            const isCurrent = l.name === level.levelName;
            const isDone = level.bookingsCompleted >= l.threshold;
            return (
              <View key={l.name} style={[styles.levelCard, isCurrent && styles.levelCardActive, Shadow.card]}>
                <View style={styles.levelRow}>
                  <View style={[styles.levelDot, { backgroundColor: isDone ? cfg.color : Colors.border }]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={14} color="#fff" />
                      : <Text style={styles.levelDotNum}>{i + 1}</Text>
                    }
                  </View>
                  <View style={styles.levelInfo}>
                    <View style={styles.levelTitleRow}>
                      <Text style={styles.levelEmoji}>{cfg.emoji}</Text>
                      <Text style={[styles.levelName, isCurrent && { color: cfg.color }]}>{cfg.label}</Text>
                      {isCurrent && <View style={styles.currentChip}><Text style={styles.currentChipText}>Actual</Text></View>}
                    </View>
                    <Text style={styles.levelThreshold}>Desde {l.threshold} servicios</Text>
                    {cfg.discount ? <Text style={[styles.levelDiscount, { color: Colors.ok }]}>{cfg.discount}</Text> : null}
                  </View>
                </View>
                {isCurrent || isDone ? (
                  <View style={styles.benefits}>
                    {l.benefits.map(b => (
                      <View key={b} style={styles.benefitRow}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.ok} />
                        <Text style={styles.benefitText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
             paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
             borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:   { ...Typography.h4, color: Colors.ink },
  content: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 40 },

  hero:        { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  heroEmoji:   { fontSize: 48 },
  heroName:    { ...Typography.h2, fontWeight: '800' },
  heroSub:     { ...Typography.body, color: Colors.ink3 },
  barBg:       { width: '100%', height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden', marginTop: 4 },
  barFill:     { height: '100%', borderRadius: Radius.full },
  barHint:     { ...Typography.small, color: Colors.ink3 },

  sectionTitle: { ...Typography.h4, color: Colors.ink, marginTop: Spacing.sm },

  levelCard:       { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
                     borderWidth: 1, borderColor: Colors.border },
  levelCardActive: { borderColor: Colors.primary, borderWidth: 2 },
  levelRow:        { flexDirection: 'row', gap: Spacing.md },
  levelDot:        { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  levelDotNum:     { ...Typography.small, color: Colors.ink4, fontWeight: '700' },
  levelInfo:       { flex: 1 },
  levelTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  levelEmoji:      { fontSize: 16 },
  levelName:       { ...Typography.bodyMed, fontWeight: '700', color: Colors.ink },
  currentChip:     { backgroundColor: Colors.primarySoft, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  currentChipText: { ...Typography.micro, color: Colors.primary, fontWeight: '700' },
  levelThreshold:  { ...Typography.small, color: Colors.ink3 },
  levelDiscount:   { ...Typography.small, fontWeight: '600', marginTop: 2 },
  benefits:        { marginTop: Spacing.sm, gap: 4, paddingLeft: 36 },
  benefitRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  benefitText:     { ...Typography.small, color: Colors.ink2 },
});
