import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { REASON_LABEL, useLimpioCoins } from '../../hooks/useLimpioCoins';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

function fmt(d: string) {
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export function CoinsScreen({ navigation }: any) {
  const { balance, transactions, loading } = useLimpioCoins();
  const pesos = Math.floor(balance / 1000) * 5000;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </Pressable>
        <Text style={styles.title}>LimpioCoins</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md, paddingBottom: 40 }}
        ListHeaderComponent={() => (
          <>
            {/* Balance hero */}
            <LinearGradient
              colors={['#D97706', '#F59E0B', '#FDE68A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.balanceNum}>{balance.toLocaleString('es-CO')}</Text>
              <Text style={styles.balanceLabel}>LimpioCoins</Text>
              {pesos > 0 && (
                <View style={styles.pesosPill}>
                  <Text style={styles.pesosText}>≈ ${pesos.toLocaleString('es-CO')} COP en descuentos</Text>
                </View>
              )}
            </LinearGradient>

            {/* Reglas */}
            <View style={[styles.rulesCard, Shadow.card]}>
              <Text style={styles.rulesTitle}>¿Cómo ganar coins?</Text>
              {[
                { icon: 'checkmark-circle', color: Colors.ok,   text: '100 coins por servicio completado' },
                { icon: 'people',           color: Colors.primary, text: '500 coins por referido exitoso' },
                { icon: 'star',             color: Colors.warn, text: '50 coins al dejar una reseña' },
              ].map(r => (
                <View key={r.text} style={styles.ruleRow}>
                  <Ionicons name={r.icon as any} size={16} color={r.color} />
                  <Text style={styles.ruleText}>{r.text}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <Text style={styles.redeemNote}>
                Canje: 1.000 coins = $5.000 COP de descuento en tu próximo servicio
              </Text>
            </View>

            <Text style={styles.historyTitle}>Historial</Text>
          </>
        )}
        ListEmptyComponent={() => !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🪙</Text>
            <Text style={styles.emptyText}>Aún no tienes movimientos</Text>
            <Text style={styles.emptyHint}>Completa un servicio para ganar tus primeros 100 coins</Text>
          </View>
        ) : <ActivityIndicator color={Colors.primary} />}
        renderItem={({ item }) => (
          <View style={[styles.txCard, Shadow.card]}>
            <View style={[styles.txIcon, { backgroundColor: item.amount > 0 ? Colors.okLight : '#FEE2E2' }]}>
              <Ionicons
                name={item.amount > 0 ? 'arrow-down' : 'arrow-up'}
                size={16}
                color={item.amount > 0 ? Colors.ok : Colors.danger}
              />
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txReason}>{REASON_LABEL[item.reason] ?? item.reason}</Text>
              <Text style={styles.txDate}>{fmt(item.created_at)}</Text>
            </View>
            <Text style={[styles.txAmount, { color: item.amount > 0 ? Colors.ok : Colors.danger }]}>
              {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString('es-CO')}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
             paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
             borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:   { ...Typography.h4, color: Colors.ink },

  hero:        { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.xs },
  coinIcon:    { fontSize: 40 },
  balanceNum:  { ...Typography.h1, color: '#fff', fontWeight: '800', fontSize: 48 },
  balanceLabel:{ ...Typography.body, color: 'rgba(255,255,255,0.8)' },
  pesosPill:   { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radius.full,
                 paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 },
  pesosText:   { ...Typography.small, color: '#fff', fontWeight: '600' },

  rulesCard:   { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8 },
  rulesTitle:  { ...Typography.bodyMed, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  ruleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText:    { ...Typography.body, color: Colors.ink2 },
  divider:     { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  redeemNote:  { ...Typography.small, color: Colors.ink3 },

  historyTitle: { ...Typography.h4, color: Colors.ink, marginTop: 4 },

  empty:      { alignItems: 'center', paddingTop: 40, gap: Spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { ...Typography.bodyMed, color: Colors.ink2, fontWeight: '600' },
  emptyHint:  { ...Typography.small, color: Colors.ink3, textAlign: 'center' },

  txCard:   { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
              flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  txIcon:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txInfo:   { flex: 1 },
  txReason: { ...Typography.bodyMed, color: Colors.ink, fontWeight: '600' },
  txDate:   { ...Typography.small, color: Colors.ink3 },
  txAmount: { ...Typography.bodyMed, fontWeight: '700' },
});
