import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image, Modal,
  Pressable, RefreshControl, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BeforeAfterCard } from '../../components/BeforeAfterCard';
import { FirstBookingModal } from '../../components/FirstBookingModal';
import { GuaranteeSheet } from '../../components/GuaranteeSheet';
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
  draft:       { label: 'Borrador',     color: Colors.ink3,    bg: Colors.surfaceAlt,   icon: 'document-outline' },
  open:        { label: 'Buscando pro', color: Colors.warn,    bg: Colors.warnLight,    icon: 'search-outline' },
  in_progress: { label: 'En progreso',  color: Colors.primary, bg: Colors.primaryLight, icon: 'hourglass-outline' },
  completed:   { label: 'Completado',   color: Colors.ok,      bg: Colors.okLight,      icon: 'checkmark-circle-outline' },
  cancelled:   { label: 'Cancelado',    color: Colors.danger,  bg: Colors.dangerLight,  icon: 'close-circle-outline' },
};

type ReviewedSet = Set<string>;

// F17: visor de fotos antes/después
function BeforeAfterViewer({ before, after, onClose }: { before: string; after: string; onClose: () => void }) {
  const [tab, setTab] = useState<'before' | 'after'>('before');
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={vaStyles.overlay}>
        <View style={vaStyles.sheet}>
          <View style={vaStyles.tabs}>
            <Pressable style={[vaStyles.tab, tab === 'before' && vaStyles.tabActive]} onPress={() => setTab('before')}>
              <Text style={[vaStyles.tabText, tab === 'before' && vaStyles.tabTextActive]}>Antes</Text>
            </Pressable>
            <Pressable style={[vaStyles.tab, tab === 'after' && vaStyles.tabActive]} onPress={() => setTab('after')}>
              <Text style={[vaStyles.tabText, tab === 'after' && vaStyles.tabTextActive]}>Después</Text>
            </Pressable>
          </View>
          <Image
            source={{ uri: tab === 'before' ? before : after }}
            style={vaStyles.img}
            resizeMode="cover"
          />
          <Pressable style={vaStyles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const vaStyles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  sheet:        { width: '90%', borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: Colors.ink },
  tabs:         { flexDirection: 'row' },
  tab:          { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.dark },
  tabActive:    { backgroundColor: Colors.primary },
  tabText:      { ...Typography.smallBold, color: Colors.ink3 },
  tabTextActive:{ ...Typography.smallBold, color: '#fff' },
  img:          { width: '100%', aspectRatio: 4 / 3 },
  closeBtn:     { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});

export function BookingsListScreen({ navigation }: any) {
  const { profile }    = useAuth();
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [reviewed, setReviewed] = useState<ReviewedSet>(new Set());
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ jobId: string; proId: string; proName: string } | null>(null);
  // F17: visor de fotos
  const [photoViewer, setPhotoViewer] = useState<{ before: string; after: string } | null>(null);
  const [shareCard, setShareCard] = useState<{ before: string; after: string; proName: string; serviceLabel: string } | null>(null);
  // F45: garantía
  const [guaranteeTarget, setGuaranteeTarget] = useState<{ jobId: string } | null>(null);
  // F46: ritual primera vez
  const [firstBookingPro, setFirstBookingPro] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    const [{ data: jobsData }, { data: reviewsData }] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, addresses(label, street, city), pro:profiles!jobs_pro_id_fkey(full_name), photo_before, photo_after')
        .eq('client_id', profile!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('job_id')
        .eq('reviewer_id', profile!.id),
    ]);
    setJobs(jobsData ?? []);
    setReviewed(new Set((reviewsData ?? []).map((r: any) => r.job_id)));

    // F46: detectar primer job completado sin celebrar
    const profileData = await supabase
      .from('profiles')
      .select('first_booking_celebrated')
      .eq('id', profile!.id)
      .single();

    if (!profileData.data?.first_booking_celebrated) {
      const firstCompleted = (jobsData ?? []).find((j: any) => j.status === 'completed');
      if (firstCompleted) {
        const proName = (firstCompleted as any).pro?.full_name ?? '';
        setFirstBookingPro(proName);
        // marcar como celebrado
        await supabase.from('profiles').update({ first_booking_celebrated: true }).eq('id', profile!.id);
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, [profile]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const cancelJob = (id: string) => {
    Alert.alert(
      'Cancelar servicio',
      '¿Seguro que quieres cancelar este servicio? Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', id);
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'cancelled' } : j));
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Job }) => {
    const s        = STATUS_INFO[item.status];
    const proName  = (item as any).pro?.full_name ?? 'Tu limpiador';
    const canReview = item.status === 'completed' && item.pro_id && !reviewed.has(item.id);
    // F45: ventana de 48h tras completar
    const completedAt = (item as any).completed_at as string | undefined;
    const canClaim = item.status === 'completed' &&
      !!completedAt &&
      (Date.now() - new Date(completedAt).getTime()) < 48 * 60 * 60 * 1000;
    const photoBefore  = (item as any).photo_before  as string | undefined;
    const photoAfter   = (item as any).photo_after   as string | undefined;
    const hasPhotos    = photoBefore && photoAfter;
    const recurrence   = (item as any).recurrence as string | undefined;
    const isRecurring  = recurrence && recurrence !== 'none';
    const RECURRENCE_LABEL: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

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

        {/* F15: badge recurrente */}
        {isRecurring && (
          <View style={styles.recurringBadge}>
            <Ionicons name="refresh-circle-outline" size={12} color={Colors.primary} />
            <Text style={styles.recurringText}>{RECURRENCE_LABEL[recurrence!] ?? recurrence}</Text>
          </View>
        )}

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

        {/* F17: miniaturas de fotos antes/después (solo si existen) */}
        {item.status === 'completed' && (photoBefore || photoAfter) && (
          <Pressable
            style={styles.photosRow}
            onPress={() => hasPhotos && setPhotoViewer({ before: photoBefore!, after: photoAfter! })}
          >
            {photoBefore && (
              <View style={styles.photoSlot}>
                <Text style={styles.photoSlotLabel}>Antes</Text>
                <Image source={{ uri: photoBefore }} style={styles.photoThumb} />
              </View>
            )}
            {photoAfter && (
              <View style={styles.photoSlot}>
                <Text style={styles.photoSlotLabel}>Después</Text>
                <Image source={{ uri: photoAfter }} style={styles.photoThumb} />
              </View>
            )}
            {hasPhotos && (
              <View style={styles.photoExpandHint}>
                <Ionicons name="expand-outline" size={16} color={Colors.primary} />
                <Text style={styles.photoExpandText}>Ver comparativa</Text>
              </View>
            )}
          </Pressable>
        )}

        {/* F59: Botón compartir tarjeta viral */}
        {hasPhotos && item.status === 'completed' && (
          <Pressable
            style={styles.shareTransformBtn}
            onPress={() => setShareCard({
              before: photoBefore!,
              after: photoAfter!,
              proName,
              serviceLabel: SERVICE_LABEL[item.type],
            })}
          >
            <Ionicons name="share-social-outline" size={14} color={Colors.primary} />
            <Text style={styles.shareTransformText}>Compartir mi transformación ✨</Text>
          </Pressable>
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

        {/* Calificar al pro */}
        {canReview && (
          <Pressable
            style={[styles.reviewBtn, Shadow.cta]}
            onPress={() => setReviewTarget({ jobId: item.id, proId: item.pro_id!, proName })}
          >
            <Ionicons name="star" size={15} color="#fff" />
            <Text style={styles.reviewBtnText}>Calificar a {proName.split(' ')[0]}</Text>
          </Pressable>
        )}

        {/* Ya calificado */}
        {item.status === 'completed' && !canReview && item.pro_id && reviewed.has(item.id) && (
          <View style={styles.reviewedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.ok} />
            <Text style={styles.reviewedText}>Calificado</Text>
          </View>
        )}

        {/* F45: Garantía 24h */}
        {canClaim && (
          <Pressable
            style={[styles.guaranteeBtn, Shadow.sm]}
            onPress={() => setGuaranteeTarget({ jobId: item.id })}
          >
            <Ionicons name="shield-checkmark-outline" size={15} color={Colors.warn} />
            <Text style={styles.guaranteeBtnText}>No quedé satisfecho · Garantía 48h</Text>
          </Pressable>
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

      {/* Review sheet (calificar al pro) */}
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

      {/* F17: visor antes/después */}
      {photoViewer && (
        <BeforeAfterViewer
          before={photoViewer.before}
          after={photoViewer.after}
          onClose={() => setPhotoViewer(null)}
        />
      )}

      {/* F59: Tarjeta viral before/after */}
      {shareCard && (
        <BeforeAfterCard
          visible={!!shareCard}
          before={shareCard.before}
          after={shareCard.after}
          proName={shareCard.proName}
          serviceLabel={shareCard.serviceLabel}
          onClose={() => setShareCard(null)}
        />
      )}

      {/* F46: Ritual primera vez */}
      <FirstBookingModal
        visible={firstBookingPro !== null}
        proName={firstBookingPro ?? ''}
        onClose={() => setFirstBookingPro(null)}
      />

      {/* F45: Garantía sheet */}
      {guaranteeTarget && (
        <GuaranteeSheet
          visible={!!guaranteeTarget}
          jobId={guaranteeTarget.jobId}
          onDone={() => setGuaranteeTarget(null)}
          onDismiss={() => setGuaranteeTarget(null)}
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
  serviceRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  serviceEmoji: { fontSize: 24 },
  serviceLabel: { ...Typography.bodyMed, color: Colors.ink },
  serviceMeta:  { ...Typography.small, color: Colors.ink3, marginTop: 2 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full,
                  paddingVertical: 4, paddingHorizontal: 9 },
  statusText:   { ...Typography.caption, fontWeight: '700' },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText:     { ...Typography.small, color: Colors.ink2, flex: 1 },

  // F17 fotos
  photosRow:       { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, flexWrap: 'wrap' },
  photoSlot:       { alignItems: 'center', gap: 4 },
  photoSlotLabel:  { ...Typography.micro, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.5 },
  photoThumb:      { width: 80, height: 80, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt },
  photoExpandHint: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  photoExpandText: { ...Typography.small, color: Colors.primary, fontWeight: '600' },
  shareTransformBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                       marginTop: Spacing.sm, borderRadius: Radius.md, paddingVertical: 10,
                       borderWidth: 1, borderColor: Colors.primarySoft, backgroundColor: Colors.primaryLight },
  shareTransformText: { ...Typography.smallBold, color: Colors.primary },

  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                    backgroundColor: Colors.primaryLight, borderRadius: Radius.full,
                    paddingVertical: 3, paddingHorizontal: 10 },
  recurringText:  { ...Typography.caption, color: Colors.primary, fontWeight: '700' },

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

  guaranteeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm,
                      borderRadius: Radius.md, paddingVertical: 11, paddingHorizontal: Spacing.md,
                      backgroundColor: Colors.warnLight, borderWidth: 1, borderColor: Colors.warn },
  guaranteeBtnText: { ...Typography.smallBold, color: Colors.warn, flex: 1 },

  empty:        { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji:   { fontSize: 48 },
  emptyTitle:   { ...Typography.h4, color: Colors.ink },
  emptySub:     { ...Typography.small, color: Colors.ink3, textAlign: 'center', paddingHorizontal: Spacing.xxl },
  emptyBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.lg,
                  paddingVertical: 12, paddingHorizontal: Spacing.xl, marginTop: Spacing.md },
  emptyBtnText: { ...Typography.bodyMed, color: '#fff' },
});
