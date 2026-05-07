import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';

// Montos rápidos de recarga
const QUICK_AMOUNTS = [
  { label: '$50k',  value: 50_000 },
  { label: '$100k', value: 100_000 },
  { label: '$200k', value: 200_000 },
  { label: '$500k', value: 500_000 },
];

// Métodos de pago disponibles
const PAYMENT_METHODS = [
  { id: 'card',    icon: 'card',           label: 'Tarjeta débito / crédito', sub: 'Visa, Mastercard, Amex' },
  { id: 'nequi',  icon: 'phone-portrait', label: 'Nequi',                    sub: 'Transferencia inmediata' },
  { id: 'pse',    icon: 'business',        label: 'PSE',                      sub: 'Débito bancario' },
];

interface Props {
  navigation: any;
}

export function TopupScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const finalAmount = selectedAmount ?? (parseInt(customAmount.replace(/\D/g, ''), 10) || 0);

  const formatCOP = (n: number) =>
    n > 0
      ? new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(n)
      : '$0';

  const handleCustomChange = (text: string) => {
    setSelectedAmount(null);
    const digits = text.replace(/\D/g, '');
    setCustomAmount(digits);
  };

  const handleSelectQuick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handlePay = async () => {
    if (finalAmount < 5_000) {
      Alert.alert('Monto mínimo', 'El monto mínimo de recarga es $5.000 COP.');
      return;
    }
    if (finalAmount > 10_000_000) {
      Alert.alert('Monto máximo', 'El monto máximo por recarga es $10.000.000 COP.');
      return;
    }

    setLoading(true);
    try {
      // TODO: llamar Edge Function wallet-topup → obtener URL de Wompi → abrir WebView
      // Por ahora simulamos el flujo exitoso para UX demo
      await new Promise(r => setTimeout(r, 1200));
      Alert.alert(
        '¡Recarga exitosa!',
        `Se han acreditado ${formatCOP(finalAmount)} a tu billetera LimpioGO.`,
        [{ text: 'Ver billetera', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Error', 'No pudimos procesar tu pago. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Recargar billetera</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Selección de monto ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>¿Cuánto quieres recargar?</Text>

            <View style={styles.quickAmountsGrid}>
              {QUICK_AMOUNTS.map((q) => {
                const selected = selectedAmount === q.value;
                return (
                  <Pressable
                    key={q.value}
                    style={({ pressed }) => [
                      styles.quickBtn,
                      selected && styles.quickBtnSelected,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleSelectQuick(q.value)}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={Gradients.wallet}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.quickBtnGradient}
                      >
                        <Text style={styles.quickBtnTextSelected}>{q.label}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={styles.quickBtnText}>{q.label}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Monto personalizado */}
            <View style={styles.customInputWrap}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={styles.customInput}
                placeholder="Otro monto"
                placeholderTextColor={Colors.ink3}
                keyboardType="numeric"
                value={customAmount ? parseInt(customAmount).toLocaleString('es-CO') : ''}
                onChangeText={handleCustomChange}
                onFocus={() => setSelectedAmount(null)}
                maxLength={12}
              />
              <Text style={styles.inputSuffix}>COP</Text>
            </View>
          </View>

          {/* ── Método de pago ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Método de pago</Text>
            <View style={styles.methodsList}>
              {PAYMENT_METHODS.map((m) => {
                const selected = selectedMethod === m.id;
                return (
                  <Pressable
                    key={m.id}
                    style={({ pressed }) => [
                      styles.methodRow,
                      selected && styles.methodRowSelected,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => setSelectedMethod(m.id)}
                  >
                    <View style={[styles.methodIcon, selected && styles.methodIconSelected]}>
                      <Ionicons name={m.icon as any} size={20} color={selected ? Colors.primary : Colors.ink2} />
                    </View>
                    <View style={styles.methodMid}>
                      <Text style={[styles.methodLabel, selected && { color: Colors.primary }]}>{m.label}</Text>
                      <Text style={styles.methodSub}>{m.sub}</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Resumen ── */}
          {finalAmount > 0 && (
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monto</Text>
                <Text style={styles.summaryValue}>{formatCOP(finalAmount)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Comisión pasarela</Text>
                <Text style={[styles.summaryValue, { color: Colors.ok }]}>$0</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total a pagar</Text>
                <Text style={styles.summaryTotalValue}>{formatCOP(finalAmount)}</Text>
              </View>
            </View>
          )}

          {/* ── Seguridad ── */}
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={14} color={Colors.ok} />
            <Text style={styles.securityText}>
              Pago seguro procesado por{' '}
              <Text style={{ fontWeight: '700' }}>Wompi</Text> — certificado PCI DSS
            </Text>
          </View>
        </ScrollView>

        {/* ── CTA fijo ── */}
        <View style={styles.ctaWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaBtn,
              (!finalAmount || loading) && styles.ctaBtnDisabled,
              pressed && { opacity: 0.9 },
            ]}
            onPress={handlePay}
            disabled={!finalAmount || loading}
          >
            <LinearGradient
              colors={finalAmount ? Gradients.wallet : [Colors.ink4, Colors.ink4]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {loading ? (
                <Text style={styles.ctaLabel}>Procesando...</Text>
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#fff" />
                  <Text style={styles.ctaLabel}>
                    {finalAmount ? `Recargar ${formatCOP(finalAmount)}` : 'Selecciona un monto'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: { ...Typography.h3, color: Colors.ink },

  scrollContent: { paddingBottom: 120 },

  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.h4,
    color: Colors.ink,
    marginBottom: Spacing.md,
  },

  // Quick amounts
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickBtn: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    minWidth: '22%',
    ...Shadow.sm,
  },
  quickBtnSelected: {
    borderColor: 'transparent',
  },
  quickBtnGradient: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  quickBtnText: {
    ...Typography.bodyMed,
    color: Colors.ink,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    textAlign: 'center',
  },
  quickBtnTextSelected: {
    ...Typography.bodyMed,
    color: '#fff',
  },

  // Custom input
  customInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  inputPrefix: {
    ...Typography.h3,
    color: Colors.ink3,
    marginRight: Spacing.xs,
  },
  customInput: {
    flex: 1,
    ...Typography.h3,
    color: Colors.ink,
    paddingVertical: 14,
  },
  inputSuffix: {
    ...Typography.caption,
    color: Colors.ink3,
    marginLeft: Spacing.xs,
  },

  // Methods
  methodsList: { gap: Spacing.sm },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  methodRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  methodIcon: {
    width: 44, height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  methodIconSelected: { backgroundColor: Colors.primarySoft },
  methodMid: { flex: 1 },
  methodLabel: { ...Typography.bodyMed, color: Colors.ink },
  methodSub: { ...Typography.small, color: Colors.ink3 },
  radio: {
    width: 20, height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioDot: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // Summary
  summary: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { ...Typography.body, color: Colors.ink2 },
  summaryValue: { ...Typography.bodyMed, color: Colors.ink },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  summaryTotalLabel: { ...Typography.h4, color: Colors.ink },
  summaryTotalValue: { ...Typography.h4, color: Colors.primary },

  // Security
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
  securityText: {
    ...Typography.small,
    color: Colors.ink3,
    textAlign: 'center',
    lineHeight: 18,
  },

  // CTA
  ctaWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaBtn: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.cta,
  },
  ctaBtnDisabled: { opacity: 0.6, ...Shadow.sm },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  ctaLabel: {
    ...Typography.bodyMed,
    color: '#fff',
    fontSize: 16,
  },
});
