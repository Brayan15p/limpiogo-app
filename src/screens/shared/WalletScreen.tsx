import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useWallet } from '../../contexts/WalletContext';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';
import type { WalletTransaction, WalletTxType } from '../../types/wallet';
import { TX_ICONS, TX_LABELS } from '../../types/wallet';

// ─── Animated balance counter ─────────────────────────
function AnimatedBalance({ value, format }: { value: number; format: (n: number) => string }) {
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    animated.addListener(({ value: v }) => setDisplay(format(Math.floor(v))));
    Animated.timing(animated, {
      toValue: value,
      duration: 900,
      useNativeDriver: false,
    }).start();
    return () => animated.removeAllListeners();
  }, [value]);

  return <Text style={styles.balanceAmount}>{display}</Text>;
}

// ─── Indicador de tipo de transacción ─────────────────
function TxIcon({ type, amount }: { type: WalletTxType; amount: number }) {
  const isCredit = amount > 0;
  const bg = isCredit ? Colors.okLight : Colors.dangerLight;
  const color = isCredit ? Colors.ok : Colors.danger;
  const iconName = TX_ICONS[type] as any;

  return (
    <View style={[styles.txIconWrap, { backgroundColor: bg }]}>
      <Ionicons name={iconName} size={18} color={color} />
    </View>
  );
}

// ─── Fila de transacción ──────────────────────────────
function TxRow({ item }: { item: WalletTransaction }) {
  const isCredit = item.amount > 0;
  const date = new Date(item.created_at);
  const dateStr = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const formatAmount = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(Math.abs(n));

  return (
    <View style={styles.txRow}>
      <TxIcon type={item.type} amount={item.amount} />
      <View style={styles.txMid}>
        <Text style={styles.txLabel}>{TX_LABELS[item.type]}</Text>
        {item.description ? (
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <Text style={styles.txDate}>{dateStr} · {timeStr}</Text>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? Colors.ok : Colors.danger }]}>
        {isCredit ? '+' : '-'}{formatAmount(item.amount)}
      </Text>
    </View>
  );
}

// ─── Separador de sección por fecha ──────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function groupByDate(txs: WalletTransaction[]) {
  const groups: { title: string; data: WalletTransaction[] }[] = [];
  const map = new Map<string, WalletTransaction[]>();

  for (const tx of txs) {
    const d = new Date(tx.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let key: string;
    if (d.toDateString() === today.toDateString()) key = 'Hoy';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Ayer';
    else key = d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' });

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }

  map.forEach((data, title) => groups.push({ title, data }));
  return groups;
}

// ─── PILL de stat en el hero ──────────────────────────
function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon as any} size={14} color="rgba(255,255,255,0.8)" />
      <View style={{ marginLeft: 6 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────
interface Props {
  navigation: any;
}

export function WalletScreen({ navigation }: Props) {
  const { wallet, transactions, loading, refreshing, refresh, formatBalance } = useWallet();

  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(headerOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  // Calcular stats del mes actual
  const now = new Date();
  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalIn = monthTxs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = monthTxs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const formatShort = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(0)}k`
      : `$${n}`;

  // Construir lista flat con headers de sección
  const groups = groupByDate(transactions);
  type ListItem =
    | { _type: 'header'; title: string; id: string }
    | { _type: 'tx'; tx: WalletTransaction };

  const flatData: ListItem[] = [];
  for (const g of groups) {
    flatData.push({ _type: 'header', title: g.title, id: `h-${g.title}` });
    for (const tx of g.data) flatData.push({ _type: 'tx', tx });
  }

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item._type === 'header') return <SectionHeader title={item.title} />;
    return <TxRow item={item.tx} />;
  }, []);

  const keyExtractor = useCallback((item: ListItem) => {
    if (item._type === 'header') return item.id;
    return item.tx.id;
  }, []);

  const ListHeader = (
    <Animated.View style={{ opacity: headerOpacity }}>
      {/* ── HERO CARD ── */}
      <LinearGradient
        colors={Gradients.wallet}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        {/* Círculos decorativos de fondo */}
        <View style={styles.heroBubble1} />
        <View style={styles.heroBubble2} />

        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Saldo disponible</Text>
            <Text style={styles.heroCurrency}>COP</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.sky300} />
            <Text style={styles.heroBadgeText}>Seguro</Text>
          </View>
        </View>

        <AnimatedBalance
          value={wallet?.balance ?? 0}
          format={(n) =>
            new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            }).format(n)
          }
        />

        {/* Stats del mes */}
        <View style={styles.statsRow}>
          <StatPill icon="arrow-down-circle" label="Ingresos mes" value={formatShort(totalIn)} />
          <View style={styles.statsDivider} />
          <StatPill icon="arrow-up-circle" label="Gastos mes" value={formatShort(totalOut)} />
        </View>
      </LinearGradient>

      {/* ── ACCIONES ── */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.85 }]}
          onPress={() => navigation.navigate('Topup')}
        >
          <LinearGradient
            colors={Gradients.wallet}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtnGradient}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnLabelPrimary}>Recargar</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.7 }]}
          onPress={() => {/* retiro futuro */}}
        >
          <Ionicons name="arrow-up-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.actionBtnLabel}>Retirar</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Pronto</Text>
          </View>
        </Pressable>
      </View>

      {/* ── TÍTULO HISTORIAL ── */}
      {transactions.length > 0 && (
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Movimientos</Text>
          <Text style={styles.historyCount}>{transactions.length} total</Text>
        </View>
      )}
    </Animated.View>
  );

  const ListEmpty = loading ? null : (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="receipt-outline" size={40} color={Colors.ink3} />
      </View>
      <Text style={styles.emptyTitle}>Sin movimientos aún</Text>
      <Text style={styles.emptyDesc}>
        Recarga tu billetera o completa un servicio para ver tus transacciones aquí.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
        onPress={() => navigation.navigate('Topup')}
      >
        <Text style={styles.emptyBtnText}>Recargar ahora</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Mi Billetera</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={flatData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const HERO_RADIUS = 28;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.ink,
  },

  listContent: {
    paddingBottom: 40,
  },

  // ── Hero Card ──
  heroCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: HERO_RADIUS,
    padding: Spacing.xxl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  heroBubble1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  heroBubble2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -40,
    left: -20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  heroLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroCurrency: {
    ...Typography.micro,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  heroBadgeText: {
    ...Typography.micro,
    color: Colors.sky300,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.5,
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.micro,
    color: 'rgba(255,255,255,0.6)',
  },
  statValue: {
    ...Typography.smallBold,
    color: '#fff',
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.lg,
  },

  // ── Acciones ──
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  actionBtnPrimary: {},
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.primarySoft,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  actionBtnLabelPrimary: {
    ...Typography.bodyMed,
    color: '#fff',
  },
  actionBtnLabel: {
    ...Typography.bodyMed,
    color: Colors.primary,
  },
  comingSoonBadge: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  comingSoonText: {
    ...Typography.micro,
    color: Colors.primary,
  },

  // ── Historial ──
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  historyTitle: {
    ...Typography.h4,
    color: Colors.ink,
  },
  historyCount: {
    ...Typography.small,
    color: Colors.ink3,
  },

  // ── Section header ──
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Tx row ──
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  txMid: {
    flex: 1,
    gap: 2,
  },
  txLabel: {
    ...Typography.bodyMed,
    color: Colors.ink,
  },
  txDesc: {
    ...Typography.small,
    color: Colors.ink2,
  },
  txDate: {
    ...Typography.caption,
    color: Colors.ink3,
  },
  txAmount: {
    ...Typography.bodyMed,
    marginLeft: Spacing.sm,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.ink,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Typography.body,
    color: Colors.ink2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 14,
    ...Shadow.cta,
  },
  emptyBtnText: {
    ...Typography.bodyMed,
    color: '#fff',
  },
});
