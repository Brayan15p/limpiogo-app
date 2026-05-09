import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal,
  Platform, Pressable, RefreshControl, StatusBar, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../hooks/useAuth';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import { useProStats } from '../../hooks/useProStats';
import { FIRST_JOB_KEY } from './FirstJobScreen';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { Job, JobType } from '../../types';

const SERVICE_LABELS: Record<JobType, string> = {
  basic: 'Básica', deep: 'Profunda', move: 'Mudanza', office: 'Oficinas', custom: 'Personalizada',
};
const SERVICE_EMOJI: Record<JobType, string> = {
  basic: '🧹', deep: '✨', move: '📦', office: '🏢', custom: '⚙️',
};

export function ProHomeScreen({ navigation }: any) {
  const { profile, signOut } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [offerJob, setOfferJob] = useState<Job | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  const { isTracking, startTracking, stopTracking, error: locationError } = useLocationTracking();
  const { stats } = useProStats();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Pro';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from('jobs')
      .select('id, type, bedrooms, bathrooms, budget, notes, scheduled_at, created_at, client_id, addresses(label, street, city)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20);
    setJobs((data ?? []) as unknown as Job[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Mostrar tutorial primer trabajo si nunca lo vio
  useEffect(() => {
    SecureStore.getItemAsync(FIRST_JOB_KEY).then(val => {
      if (!val) navigation.navigate('FirstJob');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openOfferModal = (job: Job) => {
    setOfferJob(job);
    setOfferPrice(job.budget ? String(job.budget) : '');
    setOfferMessage('');
  };

  const submitOffer = async () => {
    if (!offerJob || !offerPrice || isNaN(Number(offerPrice))) return;
    setApplying(offerJob.id);
    setOfferJob(null);

    const { error } = await supabase.from('applications').insert({
      job_id: offerJob.id,
      pro_id: profile!.id,
      offered_price: Number(offerPrice),
      message: offerMessage.trim() || null,
    });
    setApplying(null);
    if (!error) {
      setJobs(prev => prev.filter(j => j.id !== offerJob.id));
    }
  };

  const renderJob = ({ item }: { item: Job }) => {
    // F23: match score para este pro
    const matchScores = (item as any).match_scores as Record<string, number> | null;
    const matchScore  = matchScores?.[profile!.id];

    return (
    <Pressable style={[styles.card, Shadow.md]}>
      <View style={styles.cardHeader}>
        <View style={styles.serviceTag}>
          <Text style={styles.serviceEmoji}>{SERVICE_EMOJI[item.type]}</Text>
          <Text style={styles.serviceLabel}>{SERVICE_LABELS[item.type]}</Text>
        </View>
        <View style={styles.badgesRow}>
          {matchScore !== undefined && (
            <View style={[styles.matchBadge, matchScore >= 80 && styles.matchBadgeHigh]}>
              <Ionicons name="sparkles" size={11} color={matchScore >= 80 ? Colors.ok : Colors.warn} />
              <Text style={[styles.matchText, matchScore >= 80 && styles.matchTextHigh]}>
                Match {matchScore}%
              </Text>
            </View>
          )}
          {item.budget ? (
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>${item.budget.toLocaleString('es-CO')}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="home-outline" size={14} color={Colors.ink3} />
          <Text style={styles.detailText}>{item.bedrooms} rec · {item.bathrooms} baños</Text>
        </View>
        {item.addresses && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={Colors.ink3} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.addresses.street}, {item.addresses.city}
            </Text>
          </View>
        )}
        {item.scheduled_at && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.ink3} />
            <Text style={styles.detailText}>
              {new Date(item.scheduled_at).toLocaleDateString('es-MX', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        )}
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
        ) : null}
      </View>

      <Pressable
        style={[styles.applyBtn, applying === item.id && styles.applyBtnDisabled]}
        onPress={() => openOfferModal(item)}
        disabled={applying !== null}
      >
        {applying === item.id
          ? <ActivityIndicator size="small" color="#fff" />
          : <>
              <Ionicons name="send-outline" size={15} color="#fff" />
              <Text style={styles.applyBtnText}>Enviar oferta</Text>
            </>
        }
      </Pressable>
    </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <LinearGradient colors={[Colors.sky100, Colors.sky50, Colors.bg]} style={styles.headerGrad}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.name}>{firstName}</Text>
            </View>
            <Pressable style={styles.avatar} onPress={signOut}>
              <Text style={styles.avatarTxt}>
                {profile?.full_name?.charAt(0).toUpperCase() ?? 'P'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, Shadow.sm]}>
              <Ionicons name="briefcase-outline" size={18} color={Colors.proAccent} />
              <Text style={styles.statNum}>{stats.active}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
            <View style={[styles.statCard, Shadow.sm]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.ok} />
              <Text style={styles.statNum}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
            <View style={[styles.statCard, Shadow.sm]}>
              <Ionicons name="star-outline" size={18} color={Colors.warn} />
              <Text style={styles.statNum}>{profile?.rating ?? '—'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Location tracking toggle */}
        <Pressable
          style={[styles.trackingBar, isTracking && styles.trackingBarActive]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Ionicons name={isTracking ? 'navigate' : 'navigate-outline'} size={18} color={isTracking ? '#fff' : Colors.ink3} />
          <Text style={[styles.trackingText, isTracking && { color: '#fff' }]}>
            {isTracking ? 'Compartiendo ubicación  —  Toca para detener' : 'Activar ubicación en tiempo real'}
          </Text>
          <View style={[styles.trackingDot, { backgroundColor: isTracking ? '#fff' : Colors.ink4 }]} />
        </Pressable>
        {locationError && <Text style={styles.locationErr}>{locationError}</Text>}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Trabajos disponibles</Text>
          <Text style={styles.listCount}>{jobs.length} abiertos</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} size="large" />
        ) : (
          <FlatList
            data={jobs}
            keyExtractor={j => j.id}
            renderItem={renderJob}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTitle}>Sin trabajos por ahora</Text>
                <Text style={styles.emptySub}>Vuelve pronto, los clientes publican todo el día</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Offer modal */}
      <Modal visible={!!offerJob} transparent animationType="slide" onRequestClose={() => setOfferJob(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
          <Pressable style={styles.modalBackdrop} onPress={() => setOfferJob(null)} />
          <View style={[styles.modalSheet, Shadow.lg]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tu oferta</Text>
            {offerJob && (
              <Text style={styles.modalSub}>
                {SERVICE_LABELS[offerJob.type]} · {offerJob.bedrooms} rec · {offerJob.bathrooms} baños
              </Text>
            )}

            <Text style={styles.fieldLabel}>Precio que ofreces (COP)</Text>
            <TextInput
              style={styles.priceInput}
              placeholder={`Sugerido: $${(offerJob?.budget ?? 0).toLocaleString('es-CO')}`}
              placeholderTextColor={Colors.ink4}
              keyboardType="numeric"
              value={offerPrice}
              onChangeText={setOfferPrice}
            />

            <Text style={styles.fieldLabel}>Mensaje al cliente (opcional)</Text>
            <TextInput
              style={[styles.priceInput, styles.msgInput]}
              placeholder="Ej: Tengo 3 años de experiencia, materiales incluidos…"
              placeholderTextColor={Colors.ink4}
              value={offerMessage}
              onChangeText={setOfferMessage}
              multiline
              numberOfLines={3}
            />

            <Pressable
              style={[styles.submitBtn, (!offerPrice || isNaN(Number(offerPrice))) && { opacity: 0.5 }]}
              onPress={submitOffer}
              disabled={!offerPrice || isNaN(Number(offerPrice))}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Enviar oferta</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  headerGrad: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  greeting: { ...Typography.small, color: Colors.ink3 },
  name: { ...Typography.h2, color: Colors.ink },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.proAccent, alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { ...Typography.bodyMed, color: '#fff', fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.sky100,
  },
  statNum: { ...Typography.h3, color: Colors.ink },
  statLabel: { ...Typography.caption, color: Colors.ink3 },

  trackingBar:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.md,
                       marginBottom: Spacing.sm, borderRadius: Radius.md, padding: 12,
                       backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.ink4 },
  trackingBarActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  trackingText:      { flex: 1, ...Typography.small, color: Colors.ink3 },
  trackingDot:       { width: 8, height: 8, borderRadius: 4 },
  locationErr:       { ...Typography.caption, color: '#EF4444', marginHorizontal: Spacing.md,
                       marginBottom: Spacing.sm },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  listTitle: { ...Typography.h4, color: Colors.ink },
  listCount: { ...Typography.small, color: Colors.ink3 },

  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.sky100,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  serviceTag: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  serviceEmoji: { fontSize: 20 },
  serviceLabel: { ...Typography.bodyMed, color: Colors.ink },
  badgesRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  matchBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full,
                    paddingVertical: 3, paddingHorizontal: 8, backgroundColor: Colors.warnLight,
                    borderWidth: 1, borderColor: Colors.warn },
  matchBadgeHigh: { backgroundColor: Colors.okLight, borderColor: Colors.ok },
  matchText:      { ...Typography.micro, color: Colors.warn, fontWeight: '700' },
  matchTextHigh:  { color: Colors.ok },

  budgetBadge: {
    backgroundColor: Colors.okLight, borderRadius: Radius.full,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  budgetText: { ...Typography.smallBold, color: Colors.ok },

  cardDetails: { gap: Spacing.sm, marginBottom: Spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailText: { ...Typography.small, color: Colors.ink2, flex: 1 },
  notes: { ...Typography.small, color: Colors.ink3, fontStyle: 'italic', marginTop: Spacing.xs },

  applyBtn: {
    backgroundColor: Colors.proAccent, borderRadius: Radius.lg,
    paddingVertical: 13, alignItems: 'center',
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...Typography.h4, color: Colors.ink },
  emptySub: { ...Typography.small, color: Colors.ink3, textAlign: 'center' },

  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xxl, paddingBottom: 36, gap: Spacing.md,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { ...Typography.h3, color: Colors.ink },
  modalSub: { ...Typography.small, color: Colors.ink3, marginTop: -Spacing.sm },
  fieldLabel: { ...Typography.smallBold, color: Colors.ink2, marginTop: Spacing.sm },
  priceInput: {
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    ...Typography.h4, color: Colors.ink,
  },
  msgInput: { height: 80, textAlignVertical: 'top', paddingTop: 13, ...Typography.body },
  submitBtn: {
    backgroundColor: Colors.proAccent, borderRadius: Radius.lg,
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  submitBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
