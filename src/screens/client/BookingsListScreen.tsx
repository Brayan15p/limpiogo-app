import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReviewSheet } from '../../components/ReviewSheet';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { Job, JobStatus, JobType } from '../../types';

const SERVICE_EMOJI: Record<JobType, string> = {
  basic: '🧹', deep: '✨', move: '📦', office: '🏢', custom: '⚙️',
};
const SERVICE_LABEL: Record<JobType, string> = {
  basic: 'Básica', deep: 'Profunda', move: 'Mudanza', office: 'Oficinas', custom: 'Personalizada',
};
const STATUS_INFO: Record<JobStatus, { label: string; color: string; bg: string; icon: string }> = {
  draft:       { label: 'Borrador',     color: Colors.ink3,      bg: Colors.surfaceAlt,   icon: 'document-outline' },
  open:        { label: 'Buscando pro', color: Colors.warn,      bg: Colors.warnLight,    icon: 'search-outline' },
  in_progress: { label: 'En progreso',  color: Colors.primary,   bg: Colors.primaryLight, icon: 'hourglass-outline' },
  completed:   { label: 'Completado',   color: Colors.ok,        bg: Colors.okLight,      icon: 'checkmark-circle-outline' },
  cancelled:   { label: 'Cancelado',    color: Colors.danger,    bg: Colors.dangerLight,  icon: 'close-circle-outline' },
};

type ReviewedSet = Set<string>; // job_ids ya reseñados

export function BookingsListScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviewed, setReviewed] = useState<ReviewedSet>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ jobId: string; proId: string; proName: string } | null>(null);

  const fetchJobs = useCallback(async () => {
    const [{ data: jobsData }, { data: reviewsData }] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, addresses(label, street, city), pro:profiles!jobs_pro_id_fkey(full_name)')
        .eq('client_id', profile!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('job_id')
        .eq('reviewer_id', profile!.id),
    ]);
    setJobs(jobsData ?? []);
    setReviewed(new Set((reviewsData ?? []).map((r: any) => r.job_id)));
    setLoading(false);
    setRefreshing(false);
  }, [profile]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const cancelJob = async (id: string) => {
    await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'cancelled' } : j));
  };

  const renderItem = ({ item }: { item: Job }) => {
    const s = STATUS_INFO[item.status];
    const proName = (item as any).pro?.full_name ?? 'Tu limpiador';
    const canReview = item.status === 'completed' && item.pro_id && !reviewed.has(item.id);

    return (
      <View style={[styles.card, Shadow.sm]}>
        {/* Cabecera */}
        <View style={styles.cardTop}>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceEmoji}>{SERVICE_EMOJI[item.type]}</Text>
            <View>
              <Text style={styles.serviceLabel}>{SERVICE_LABEL[item.type]}</Text>
              <Text style={styles.serviceMeta}>{item.bedrooms} rec · {item.bathrooms} baños</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon as any} size={12} color={s.color} />
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        {/* Info */}
        {item.addresses && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color={Colors.ink3} />
            <Text style={styles.infoText} numberOfLines={1}>
              {(item.addresses as any).street}, {(item.addresses as any).city}
            </Text>
          </View>
        )}
        {item.scheduled_at && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.ink3} />
            <Text style={styles.infoText}>
              {new Date(item.scheduled_at).toLocaleDateString('es-MX', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        )}
        {item.budget && (
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={13} color={Colors.ink3} />
            <Text style={styles.infoText}>
              {item.agreed_price
                ? `Acordado: $${item.agreed_price.toLocaleString('es-CO')} COP`
                : `Presupuesto: $${item.budget.toLocaleString('es-CO')} COP`}
            </Text>
          </View>
        )}

        {/* Acciones: en progreso */}
        {item.status === 'in_progress' && item.pro_id && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.outlineBtn, { flex: 1 }]}
              onPress={() => navigation.navigate('Chat', { jobId: item.id, otherName: proName })}
            >
              <Ionicons name="chatbubble-outline" size={14} color={Colors.primary} />
              <Text style={styles.outlineBtnText}>Chat</Text>
            </Pressable>
            <Pressable
              style={[styles.solidBtn, { flex: 1 }]}
              onPress={() => navigation.navigate('ProTracking', { proId: item.pro_id, proName, jobId: item.id })}
            >
              <Ionicons name="navigate" size={14} color="#fff" />
              <Text style={styles.solidBtnText}>Ver ubicación</Text>
            </Pressable>
          </View>
        )}

        {/* Acciones: abierto */}
        {item.status === 'open' && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.outlineBtn, { flex: 1 }]}
              onPress={() => navigation.navigate('Applications', { jobId: item.id, jobType: item.type })}
            >
              <Ionicons name="people-outline" size={14} color={Colors.primary} />
              <Text style={styles.outlineBtnText}>Ver ofertas</Text>
            </Pressable>
            <Pressable style={[styles.cancelBtn, { flex: 1 }]} onPress={() => cancelJob(item.id)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
          </View>
        )}

        {/* Acción: calificar (completado sin review) */}
        {canReview && (
          <Pressable
            style={[styles.reviewBtn, Shadow.cta]}
            onPress={() => setReviewTarget({ jobId: item.id, proId: item.pro_id!, proName })}
          >
            <Ionicons name="star" size={15} color="#fff" />
            <Text style={styles.reviewBtnText}>Calificar a {proName.split(' ')[0]}</Text>
          </Pressable>
        )}

        {/* Badge: ya calificado */}
        {item.status === 'completed' && !canReview && item.pro_id && reviewed.has(item.id) && (
          <View style={styles.reviewedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.ok} />
            <Text style={styles.reviewedText}>Calificado</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis servicios</Text>
          <Pressable style={[styles.newBtn, Shadow.sm]} onPress={() => navigation.navigate('Booking')}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newBtnText}>Nuevo</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={j => j.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🏠</Text>
                <Text style={styles.emptyTitle}>Sin servicios aún</Text>
                <Text style={styles.emptySub}>Solicita tu primera limpieza y recibe ofertas en minutos</Text>
                <Pressable style={[styles.emptyBtn, Shadow.sm]} onPress={() => navigation.navigate('Booking')}>
                  <Text style={styles.emptyBtnText}>Solicitar servicio</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Review bottom sheet */}
      {reviewTarget && (
        <ReviewSheet
          visible={!!reviewTarget}
          jobId={reviewTarget.jobId}
          proId={reviewTarget.proId}
          proName={reviewTarget.proName}
          onDone={() => {
            setReviewed(prev => new Set([...prev, reviewTarget.jobId]));
            setReviewTarget(null);
          }}
          onDismiss={() => setReviewTarget(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  title:      { ...Typography.h2, color: Colors.ink },
  newBtn:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
                backgroundColor: Colors.primary, borderRadius: Radius.lg,
                paddingVertical: 8, paddingHorizontal: Spacing.md },
  newBtnText: { ...Typography.smallBold, color: '#fff' },
  list:       { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },
  card:       { backgroundColor: Colors.surface, borderRadius: Radius.xl,
                padding: Spacing.xl, borderWidth: 1, borderColor: Colors.sky100, gap: Spacing.sm },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  serviceEmoji: { fontSize: 24 },
  serviceLabel: { ...Typography.bodyMed, color: Colors.ink },
  serviceMeta:  { ...Typography.small, color: Colors.ink3, marginTop: 2 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full,
                  paddingVertical: 4, paddingHorizontal: 9 },
  statusText:   { ...Typography.caption, fontWeight: '700' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText:     { ...Typography.small, color: Colors.ink2, flex: 1 },

  actionRow:      { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  outlineBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    borderRadius: Radius.md, paddingVertical: 10,
                    borderWidth: 1, borderColor: Colors.primarySoft, backgroundColor: Colors.primaryLight },
  outlineBtnText: { ...Typography.smallBold, color: Colors.primary },
  solidBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    borderRadius: Radius.md, paddingVertical: 10, backgroundColor: Colors.primary },
  solidBtnText:   { ...Typography.smallBold, color: '#fff' },
  cancelBtn:      { borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center',
                    borderWidth: 1, borderColor: Colors.dangerLight, backgroundColor: Colors.dangerLight },
  cancelBtnText:  { ...Typography.smallBold, color: Colors.danger },

  reviewBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                   marginTop: Spacing.sm, borderRadius: Radius.md, paddingVertical: 13,
                   backgroundColor: Colors.warn },
  reviewBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  reviewedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                   marginTop: Spacing.sm, paddingVertical: 8, borderRadius: Radius.md,
                   backgroundColor: Colors.okLight },
  reviewedText:  { ...Typography.smallBold, color: Colors.ok },

  empty:       { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji:  { fontSize: 48 },
  emptyTitle:  { ...Typography.h4, color: Colors.ink },
  emptySub:    { ...Typography.small, color: Colors.ink3, textAlign: 'center', paddingHorizontal: Spacing.xxl },
  emptyBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.lg,
                 paddingVertical: 12, paddingHorizontal: Spacing.xl, marginTop: Spacing.md },
  emptyBtnText:{ ...Typography.bodyMed, color: '#fff' },
});
