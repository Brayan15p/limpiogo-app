import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useProStats } from '../../hooks/useProStats';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

type Period = 'week' | 'month' | 'year';

const SERVICE_LABEL: Record<string, string> = {
  basic: 'Limpieza básica', deep: 'Limpieza profunda',
  move: 'Mudanza', office: 'Oficinas', custom: 'Personalizada',
};

export function EarningsScreen() {
  const { profile } = useAuth();
  const { stats, loading } = useProStats();
  const [period, setPeriod] = useState<Period>('week');

  const bars = period === 'week' ? stats.weekBars : period === 'month' ? stats.monthBars : stats.yearBars;
  const total = period === 'week' ? stats.weekEarnings : period === 'month' ? stats.monthEarnings : stats.yearEarnings;
  const maxAmount = Math.max(...bars.map(b => b.amount), 1);

  const periodLabel = period === 'week' ? 'Esta semana' : period === 'month' ? 'Este mes' : 'Este año';

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.proAccent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero */}
          <LinearGradient colors={[Colors.sky100, Colors.sky50, Colors.bg]} style={styles.hero}>
            <Text style={styles.heroLabel}>{periodLabel}</Text>
            <Text style={styles.heroAmount}>${total.toLocaleString('es-CO')}</Text>
            <Text style={styles.heroCurrency}>COP</Text>

            {/* Period selector */}
            <View style={[styles.periodRow, Shadow.sm]}>
              {(['week', 'month', 'year'] as Period[]).map(p => (
                <Pressable
                  key={p}
                  style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodTxt, period === p && styles.periodTxtActive]}>
                    {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </LinearGradient>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, Shadow.sm]}>
              <Ionicons name="briefcase-outline" size={20} color={Colors.proAccent} />
              <Text style={styles.statNum}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
            <View style={[styles.statCard, Shadow.sm]}>
              <Ionicons name="star-outline" size={20} color={Colors.warn} />
              <Text style={styles.statNum}>{profile?.rating ? Number(profile.rating).toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={[styles.statCard, Shadow.sm]}>
              <Ionicons name="wallet-outline" size={20} color={Colors.ok} />
              <Text style={styles.statNum}>${(stats.totalEarnings / 1000).toFixed(0)}k</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Gráfica */}
          <View style={[styles.chartCard, Shadow.sm]}>
            <Text style={styles.chartTitle}>
              Ingresos por {period === 'week' ? 'día' : period === 'month' ? 'semana' : 'mes'}
            </Text>
            {bars.length === 0 || bars.every(b => b.amount === 0) ? (
              <View style={styles.chartEmpty}>
                <Ionicons name="bar-chart-outline" size={32} color={Colors.ink4} />
                <Text style={styles.chartEmptyText}>Sin datos para este período</Text>
              </View>
            ) : (
              <View style={styles.chart}>
                {bars.map((b, i) => (
                  <View key={i} style={styles.barWrap}>
                    <Text style={styles.barAmount}>
                      {b.amount > 0 ? `$${(b.amount / 1000).toFixed(0)}k` : ''}
                    </Text>
                    <View style={styles.barTrack}>
                      {b.amount > 0 ? (
                        <LinearGradient
                          colors={['#38BDF8', '#2563EB']}
                          style={[styles.bar, { height: `${Math.max((b.amount / maxAmount) * 100, 8)}%` }]}
                          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        />
                      ) : (
                        <View style={[styles.bar, styles.barEmpty, { height: '8%' }]} />
                      )}
                    </View>
                    <Text style={styles.barLabel}>{b.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Trabajos recientes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajos recientes</Text>
            {stats.recentJobs.length === 0 ? (
              <View style={[styles.emptyCard, Shadow.sm]}>
                <Ionicons name="receipt-outline" size={28} color={Colors.ink4} />
                <Text style={styles.emptyText}>Sin trabajos completados aún</Text>
              </View>
            ) : (
              <View style={[styles.txCard, Shadow.sm]}>
                {stats.recentJobs.map((job, i) => (
                  <View key={job.id}>
                    {i > 0 && <View style={styles.sep} />}
                    <View style={styles.txRow}>
                      <View style={styles.txIcon}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={Colors.proAccent} />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txClient}>{job.client_name}</Text>
                        <Text style={styles.txService}>{SERVICE_LABEL[job.type] ?? job.type}</Text>
                        <Text style={styles.txDate}>
                          {job.completed_at
                            ? new Date(job.completed_at).toLocaleDateString('es-MX', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </Text>
                      </View>
                      <Text style={styles.txAmount}>
                        +${job.agreed_price.toLocaleString('es-CO')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Botón retiro */}
          <View style={styles.section}>
            <Pressable style={[styles.withdrawBtn, Shadow.cta]}>
              <Ionicons name="wallet-outline" size={20} color="#fff" />
              <Text style={styles.withdrawText}>Retirar ganancias</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
            <Text style={styles.withdrawNote}>
              Próximamente integración con Wompi
            </Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  safe:   { flex: 1 },
  scroll: { paddingBottom: 48 },

  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl, paddingBottom: Spacing.xxl, paddingHorizontal: Spacing.xl,
  },
  heroLabel:    { ...Typography.small, color: Colors.ink3 },
  heroAmount:   { fontSize: 44, fontWeight: '800', color: Colors.proAccent, letterSpacing: -1, marginTop: 4 },
  heroCurrency: { ...Typography.small, color: Colors.ink3, marginBottom: Spacing.xl },
  periodRow:    { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.full,
                  padding: 4, borderWidth: 1, borderColor: Colors.sky100 },
  periodBtn:    { paddingVertical: 8, paddingHorizontal: Spacing.lg, borderRadius: Radius.full },
  periodBtnActive: { backgroundColor: Colors.proAccent },
  periodTxt:    { ...Typography.smallBold, color: Colors.ink3 },
  periodTxtActive: { color: '#fff' },

  statsGrid: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.xs },
  statCard:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
               padding: Spacing.md, alignItems: 'center', gap: 4,
               borderWidth: 1, borderColor: Colors.sky100 },
  statNum:   { ...Typography.h3, color: Colors.ink },
  statLabel: { ...Typography.caption, color: Colors.ink3 },

  chartCard:      { marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
                    backgroundColor: Colors.surface, borderRadius: Radius.xl,
                    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.sky100 },
  chartTitle:     { ...Typography.smallBold, color: Colors.ink2, marginBottom: Spacing.lg },
  chartEmpty:     { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  chartEmptyText: { ...Typography.small, color: Colors.ink4 },
  chart:          { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: Spacing.xs },
  barWrap:        { flex: 1, alignItems: 'center', gap: 4 },
  barAmount:      { ...Typography.caption, color: Colors.ink3, fontSize: 9 },
  barTrack:       { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar:            { width: '100%', borderRadius: Radius.sm, minHeight: 4 },
  barEmpty:       { backgroundColor: Colors.sky100 },
  barLabel:       { ...Typography.caption, color: Colors.ink3, textAlign: 'center' },

  section:      { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.md },

  emptyCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl,
                borderWidth: 1, borderColor: Colors.sky100,
                alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText:  { ...Typography.small, color: Colors.ink4 },

  txCard:     { backgroundColor: Colors.surface, borderRadius: Radius.xl,
                borderWidth: 1, borderColor: Colors.sky100, overflow: 'hidden' },
  sep:        { height: 1, backgroundColor: Colors.sky100, marginLeft: 60 },
  txRow:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  txIcon:     { width: 36, height: 36, borderRadius: Radius.md,
                backgroundColor: Colors.proLight, alignItems: 'center', justifyContent: 'center' },
  txInfo:     { flex: 1 },
  txClient:   { ...Typography.bodyMed, color: Colors.ink },
  txService:  { ...Typography.small, color: Colors.ink3, marginTop: 1 },
  txDate:     { ...Typography.caption, color: Colors.ink4, marginTop: 1 },
  txAmount:   { ...Typography.bodyMed, color: Colors.ok },

  withdrawBtn:  { backgroundColor: Colors.proAccent, borderRadius: Radius.xl,
                  paddingVertical: 16, flexDirection: 'row',
                  alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  withdrawText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700', fontSize: 16 },
  withdrawNote: { ...Typography.caption, color: Colors.ink4, textAlign: 'center', marginTop: Spacing.sm },
});
