import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { Application } from '../../types';

const SERVICE_EMOJI: Record<string, string> = {
  basic: '🧹', deep: '✨', move: '📦', office: '🏢', custom: '⚙️',
};
const SERVICE_LABEL: Record<string, string> = {
  basic: 'Básica', deep: 'Profunda', move: 'Mudanza', office: 'Oficinas', custom: 'Personalizada',
};
const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pendiente',   color: Colors.warn,    bg: Colors.warnLight },
  accepted:    { label: 'En progreso', color: Colors.primary, bg: Colors.primaryLight },
  rejected:    { label: 'Rechazada',   color: Colors.danger,  bg: Colors.dangerLight },
  completed:   { label: 'Completado',  color: Colors.ok,      bg: Colors.okLight },
};

export function ProJobsScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, jobs(id, type, bedrooms, bathrooms, budget, agreed_price, status, scheduled_at, addresses(label, city), client:profiles!jobs_client_id_fkey(full_name))')
      .eq('pro_id', profile!.id)
      .order('created_at', { ascending: false });
    setApplications(data ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [profile]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const markCompleted = (item: Application) => {
    const job = item.jobs as any;
    Alert.alert(
      'Marcar como completado',
      `¿Confirmas que terminaste el servicio ${SERVICE_LABEL[job?.type] ?? ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, completado',
          onPress: async () => {
            setCompleting(item.id);
            await supabase
              .from('jobs')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', item.job_id);
            setApplications(prev =>
              prev.map(a => a.id === item.id
                ? { ...a, jobs: { ...(a.jobs as any), status: 'completed' } }
                : a,
              ),
            );
            setCompleting(null);
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Application }) => {
    const job = item.jobs as any;
    const jobStatus = job?.status ?? 'pending';
    const appStatus = jobStatus === 'completed' ? 'completed' : item.status;
    const s = STATUS_INFO[appStatus] ?? STATUS_INFO.pending;
    const isActive = item.status === 'accepted' && jobStatus === 'in_progress';
    const price = job?.agreed_price ?? item.offered_price;

    return (
      <View style={[styles.card, Shadow.sm, isActive && styles.cardActive]}>
        {isActive && (
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>Activo ahora</Text>
          </View>
        )}

        <View style={styles.cardTop}>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceEmoji}>{SERVICE_EMOJI[job?.type] ?? '🧹'}</Text>
            <View>
              <Text style={styles.jobType}>{SERVICE_LABEL[job?.type] ?? job?.type}</Text>
              <Text style={styles.jobMeta}>{job?.bedrooms} rec · {job?.bathrooms} baños</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottom}>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={14} color={Colors.ink3} />
            <Text style={styles.infoText}>${price?.toLocaleString('es-CO')} COP</Text>
          </View>
          {job?.addresses && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={Colors.ink3} />
              <Text style={styles.infoText}>{job.addresses.city}</Text>
            </View>
          )}
          {job?.scheduled_at && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={Colors.ink3} />
              <Text style={styles.infoText}>
                {new Date(job.scheduled_at).toLocaleDateString('es-MX', {
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Botones de acción */}
        {isActive && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.outlineBtn, { flex: 1 }]}
              onPress={() => navigation.navigate('Chat', { jobId: item.job_id, otherName: (job?.client as any)?.full_name ?? 'Cliente' })}
            >
              <Ionicons name="chatbubble-outline" size={14} color={Colors.primary} />
              <Text style={styles.outlineBtnText}>Chat</Text>
            </Pressable>
            <Pressable
              style={[styles.completedBtn, { flex: 1 }, completing === item.id && { opacity: 0.6 }]}
              onPress={() => markCompleted(item)}
              disabled={completing === item.id}
            >
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.completedBtnText}>
                {completing === item.id ? 'Guardando…' : 'Marcar listo'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Solo chat si pendiente/aceptado sin job activo */}
        {item.status === 'accepted' && jobStatus !== 'in_progress' && jobStatus !== 'completed' && (
          <Pressable
            style={styles.chatBtn}
            onPress={() => navigation.navigate('Chat', { jobId: item.job_id, otherName: (job?.client as any)?.full_name ?? 'Cliente' })}
          >
            <Ionicons name="chatbubble-outline" size={14} color={Colors.primary} />
            <Text style={styles.chatBtnText}>Abrir chat</Text>
          </Pressable>
        )}

        {/* Completado */}
        {appStatus === 'completed' && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.ok} />
            <Text style={styles.completedBadgeText}>Servicio completado</Text>
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
          <Text style={styles.title}>Mis trabajos</Text>
        </View>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : (
          <FlatList
            data={applications}
            keyExtractor={a => a.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplications(); }} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Sin trabajos aún</Text>
                <Text style={styles.emptySub}>Ve a la pestaña Trabajos y postúlate a los disponibles</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  safe:   { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title:  { ...Typography.h2, color: Colors.ink },
  list:   { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  card:       { backgroundColor: Colors.surface, borderRadius: Radius.xl,
                padding: Spacing.xl, borderWidth: 1, borderColor: Colors.sky100 },
  cardActive: { borderColor: Colors.primary, borderWidth: 1.5 },

  activePill:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  activeDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.ok },
  activePillText: { ...Typography.smallBold, color: Colors.ok },

  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  serviceEmoji: { fontSize: 24 },
  jobType:    { ...Typography.bodyMed, color: Colors.ink },
  jobMeta:    { ...Typography.small, color: Colors.ink3, marginTop: 2 },
  statusBadge:{ borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10 },
  statusText: { ...Typography.caption, fontWeight: '700' },
  divider:    { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  cardBottom: { gap: Spacing.sm },
  infoRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText:   { ...Typography.small, color: Colors.ink2 },

  actionRow:       { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  outlineBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                     borderRadius: Radius.md, paddingVertical: 10,
                     borderWidth: 1, borderColor: Colors.primarySoft, backgroundColor: Colors.primaryLight },
  outlineBtnText:  { ...Typography.smallBold, color: Colors.primary },
  completedBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                     borderRadius: Radius.md, paddingVertical: 10, backgroundColor: Colors.ok },
  completedBtnText:{ ...Typography.smallBold, color: '#fff' },

  chatBtn:     { marginTop: Spacing.md, borderRadius: Radius.md, paddingVertical: 10,
                 alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs,
                 borderWidth: 1, borderColor: Colors.primarySoft, backgroundColor: Colors.primaryLight },
  chatBtnText: { ...Typography.smallBold, color: Colors.primary },

  completedBadge:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 6, marginTop: Spacing.md, paddingVertical: 8,
                        borderRadius: Radius.md, backgroundColor: Colors.okLight },
  completedBadgeText: { ...Typography.smallBold, color: Colors.ok },

  empty:      { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...Typography.h4, color: Colors.ink },
  emptySub:   { ...Typography.small, color: Colors.ink3, textAlign: 'center' },
});
