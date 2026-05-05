import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, Pressable,
  RefreshControl, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { Application } from '../../types';

const SERVICE_LABEL: Record<string, string> = {
  basic: 'Básica', deep: 'Profunda', move: 'Mudanza', office: 'Oficinas', custom: 'Personalizada',
};

export function ApplicationsScreen({ route, navigation }: any) {
  const { jobId, jobType } = route.params as { jobId: string; jobType: string };
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [confirmApp, setConfirmApp] = useState<Application | null>(null);

  const fetchApplications = useCallback(async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, profiles(full_name, avatar_url, rating, total_reviews)')
      .eq('job_id', jobId)
      .eq('status', 'pending')
      .order('offered_price', { ascending: true });
    setApplications(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [jobId]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const acceptApplication = async () => {
    if (!confirmApp) return;
    setAccepting(confirmApp.id);
    setConfirmApp(null);

    const { error: jobErr } = await supabase
      .from('jobs')
      .update({ status: 'in_progress', pro_id: confirmApp.pro_id, agreed_price: confirmApp.offered_price })
      .eq('id', jobId);

    if (jobErr) {
      setAccepting(null);
      Alert.alert('Error', 'No se pudo aceptar la oferta. Intenta de nuevo.');
      return;
    }

    await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', confirmApp.id);

    await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('job_id', jobId)
      .neq('id', confirmApp.id);

    setAccepting(null);
    navigation.replace('Chat', {
      jobId,
      otherName: (confirmApp.profiles as any)?.full_name ?? 'Tu pro',
    });
  };

  const renderItem = ({ item }: { item: Application }) => {
    const pro = item.profiles as any;
    const initials = pro?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

    return (
      <View style={[styles.card, Shadow.sm]}>
        <View style={styles.proRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.proName}>{pro?.full_name ?? 'Profesional'}</Text>
            {pro?.rating ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={Colors.warn} />
                <Text style={styles.ratingText}>
                  {Number(pro.rating).toFixed(1)}
                  {pro.total_reviews ? ` (${pro.total_reviews} reseñas)` : ''}
                </Text>
              </View>
            ) : (
              <Text style={styles.newPro}>Nuevo profesional</Text>
            )}
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceAmount}>${item.offered_price?.toLocaleString('es-CO')}</Text>
            <Text style={styles.priceCurrency}>COP</Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.messageBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={Colors.ink3} />
            <Text style={styles.messageText} numberOfLines={3}>{item.message}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.acceptBtn, accepting === item.id && { opacity: 0.6 }]}
          onPress={() => setConfirmApp(item)}
          disabled={accepting !== null}
        >
          {accepting === item.id
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.acceptBtnText}>Contratar por ${item.offered_price?.toLocaleString('es-CO')} COP</Text>
              </>
          }
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>

        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ofertas recibidas</Text>
            <Text style={styles.headerSub}>{SERVICE_LABEL[jobType] ?? jobType}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={Colors.primary} size="large" />
        ) : (
          <FlatList
            data={applications}
            keyExtractor={a => a.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchApplications(); }}
              />
            }
            ListHeaderComponent={
              applications.length > 0 ? (
                <View style={styles.tipBox}>
                  <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                  <Text style={styles.tipText}>
                    Ordenadas por precio. Al contratar, los demás pros serán notificados.
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>⏳</Text>
                <Text style={styles.emptyTitle}>Sin ofertas aún</Text>
                <Text style={styles.emptySub}>
                  Los profesionales están revisando tu solicitud. Vuelve en unos minutos.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Confirmation modal */}
      <Modal visible={!!confirmApp} transparent animationType="fade" onRequestClose={() => setConfirmApp(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setConfirmApp(null)}>
          <Pressable style={[styles.modalCard, Shadow.lg]} onPress={() => {}}>
            <Text style={styles.modalTitle}>¿Contratar a este pro?</Text>
            <Text style={styles.modalBody}>
              Se asignará{' '}
              <Text style={{ fontWeight: '700' }}>
                {(confirmApp?.profiles as any)?.full_name ?? 'este profesional'}
              </Text>{' '}
              a tu servicio por{' '}
              <Text style={{ color: Colors.ok, fontWeight: '700' }}>
                ${confirmApp?.offered_price?.toLocaleString('es-CO')} COP
              </Text>
              . Se abrirá un chat directo para coordinar los detalles.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setConfirmApp(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalConfirm, Shadow.sm]} onPress={acceptApplication}>
                <Text style={styles.modalConfirmText}>Contratar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: { ...Typography.h4, color: Colors.ink },
  headerSub: { ...Typography.small, color: Colors.ink3, marginTop: 1 },

  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primarySoft,
  },
  tipText: { ...Typography.small, color: Colors.primary, flex: 1, lineHeight: 18 },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.sky100,
    gap: Spacing.md,
  },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { ...Typography.bodyMed, color: '#fff', fontWeight: '800' },
  proName: { ...Typography.bodyMed, color: Colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText: { ...Typography.small, color: Colors.ink3 },
  newPro: { ...Typography.small, color: Colors.ink4, marginTop: 2 },
  priceBadge: { alignItems: 'flex-end' },
  priceAmount: { ...Typography.h3, color: Colors.ok },
  priceCurrency: { ...Typography.caption, color: Colors.ink3 },

  messageBox: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md,
  },
  messageText: { ...Typography.small, color: Colors.ink2, flex: 1, lineHeight: 18 },

  acceptBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 13, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  acceptBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { ...Typography.h4, color: Colors.ink },
  emptySub: { ...Typography.small, color: Colors.ink3, textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 20 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  modalCard: {
    width: '100%', backgroundColor: Colors.surface,
    borderRadius: Radius.xxl, padding: Spacing.xxl, gap: Spacing.lg,
  },
  modalTitle: { ...Typography.h3, color: Colors.ink },
  modalBody: { ...Typography.body, color: Colors.ink2, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalCancel: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  modalCancelText: { ...Typography.bodyMed, color: Colors.ink2 },
  modalConfirm: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderRadius: Radius.lg, backgroundColor: Colors.primary,
  },
  modalConfirmText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
