import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator, FlatList, Pressable, Share, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReferrals } from '../../hooks/useReferrals';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';

function fmt(n: number) {
  return n.toLocaleString('es-CO');
}

export function ReferralsScreen({ navigation }: any) {
  const { referralCode, rewards, totalEarned, loading } = useReferrals();

  const shareCode = async () => {
    if (!referralCode) return;
    await Share.share({
      message: `¡Usa mi código ${referralCode} en LimpioGO y ambos ganamos $5.000 COP en tu primera limpieza! Descárgala en limpiogo.app`,
      title: 'Únete a LimpioGO',
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Referidos</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={rewards}
          keyExtractor={r => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          ListHeaderComponent={() => (
            <>
              {/* Hero */}
              <LinearGradient colors={Gradients.heroPrimary} style={styles.hero}>
                <Text style={styles.heroLabel}>Ganancias por referidos</Text>
                <Text style={styles.heroAmount}>${fmt(totalEarned)}</Text>
                <Text style={styles.heroSub}>COP acreditados en tu wallet</Text>
                <View style={styles.heroPills}>
                  <View style={styles.pill}>
                    <Ionicons name="people" size={13} color={Colors.sky200} />
                    <Text style={styles.pillText}>{rewards.length} referidos</Text>
                  </View>
                  <View style={styles.pill}>
                    <Ionicons name="gift" size={13} color={Colors.sky200} />
                    <Text style={styles.pillText}>$5.000 por cada uno</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Código */}
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Tu código personal</Text>
                {loading ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.md }} />
                ) : (
                  <Text style={styles.codeValue}>{referralCode ?? '—'}</Text>
                )}
                <Text style={styles.codeDesc}>
                  Cuando alguien se registra con tu código y completa su primer servicio, ¡ambos ganan!
                </Text>
                <Pressable style={[styles.shareBtn, Shadow.cta]} onPress={shareCode}>
                  <Ionicons name="share-social" size={18} color="#fff" />
                  <Text style={styles.shareBtnText}>Compartir mi código</Text>
                </Pressable>
              </View>

              {/* Cómo funciona */}
              <View style={styles.howCard}>
                <Text style={styles.howTitle}>¿Cómo funciona?</Text>
                {[
                  { icon: 'share-social-outline', text: 'Comparte tu código con amigos' },
                  { icon: 'person-add-outline',   text: 'Se registran con tu código' },
                  { icon: 'checkmark-circle-outline', text: 'Completan su primer servicio' },
                  { icon: 'wallet-outline',        text: 'Ambos reciben $5.000 COP' },
                ].map((step, i) => (
                  <View key={i} style={styles.howRow}>
                    <View style={styles.howIcon}>
                      <Ionicons name={step.icon as any} size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.howText}>{step.text}</Text>
                  </View>
                ))}
              </View>

              {rewards.length > 0 && (
                <Text style={styles.listTitle}>Mis referidos</Text>
              )}
            </>
          )}
          ListEmptyComponent={!loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎁</Text>
              <Text style={styles.emptyTitle}>Sin referidos aún</Text>
              <Text style={styles.emptySub}>Comparte tu código y empieza a ganar</Text>
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={[styles.rewardCard, Shadow.sm]}>
              <View style={styles.rewardAvatar}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardName}>
                  {(item as any).referred?.full_name ?? 'Nuevo usuario'}
                </Text>
                <Text style={styles.rewardDate}>
                  {new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={[styles.rewardBadge, item.credited_at ? styles.rewardBadgeDone : styles.rewardBadgePending]}>
                <Text style={[styles.rewardBadgeText, item.credited_at ? styles.rewardBadgeTextDone : styles.rewardBadgeTextPending]}>
                  {item.credited_at ? `+$${fmt(item.reward_amount)}` : 'Pendiente'}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  back:        { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
                 alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { ...Typography.h4, color: Colors.ink },
  scroll:      { paddingHorizontal: Spacing.xl },

  hero:        { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
                 marginBottom: Spacing.xl },
  heroLabel:   { ...Typography.small, color: Colors.sky200, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount:  { ...Typography.display, color: '#fff' },
  heroSub:     { ...Typography.small, color: Colors.sky300 },
  heroPills:   { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  pill:        { flexDirection: 'row', alignItems: 'center', gap: 5,
                 backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full,
                 paddingVertical: 5, paddingHorizontal: 12 },
  pillText:    { ...Typography.caption, color: Colors.sky100 },

  codeCard:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
                 alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
                 ...Shadow.sm, marginBottom: Spacing.xl },
  codeLabel:   { ...Typography.small, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeValue:   { fontSize: 36, fontWeight: '800', color: Colors.primary, letterSpacing: 4 },
  codeDesc:    { ...Typography.small, color: Colors.ink3, textAlign: 'center', lineHeight: 18 },
  shareBtn:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                 backgroundColor: Colors.primary, borderRadius: Radius.xl,
                 paddingVertical: 14, paddingHorizontal: Spacing.xxl, marginTop: Spacing.sm },
  shareBtnText:{ ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  howCard:     { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
                 gap: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
                 marginBottom: Spacing.xl },
  howTitle:    { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.xs },
  howRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  howIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight,
                 alignItems: 'center', justifyContent: 'center' },
  howText:     { ...Typography.small, color: Colors.ink2, flex: 1 },

  listTitle:   { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.md },

  rewardCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                 backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg,
                 borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  rewardAvatar:{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight,
                 alignItems: 'center', justifyContent: 'center' },
  rewardInfo:  { flex: 1 },
  rewardName:  { ...Typography.smallBold, color: Colors.ink },
  rewardDate:  { ...Typography.caption, color: Colors.ink3, marginTop: 2 },
  rewardBadge: { borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10 },
  rewardBadgeDone:    { backgroundColor: Colors.okLight },
  rewardBadgePending: { backgroundColor: Colors.warnLight },
  rewardBadgeText:    { ...Typography.caption, fontWeight: '700' },
  rewardBadgeTextDone:    { color: Colors.ok },
  rewardBadgeTextPending: { color: Colors.warn },

  empty:      { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...Typography.h4, color: Colors.ink },
  emptySub:   { ...Typography.small, color: Colors.ink3 },
});
