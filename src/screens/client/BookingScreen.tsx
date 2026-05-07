import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { JobType } from '../../types';

const SERVICES: { id: JobType; emoji: string; label: string; desc: string; basePrice: number }[] = [
  { id: 'basic',  emoji: '🧹', label: 'Básica',       desc: 'Limpieza general hasta 2h',   basePrice: 80000 },
  { id: 'deep',   emoji: '✨', label: 'Profunda',     desc: 'Limpieza a fondo 3-5h',        basePrice: 150000 },
  { id: 'move',   emoji: '📦', label: 'Mudanza',      desc: 'Vaciado y limpieza completa',  basePrice: 220000 },
  { id: 'office', emoji: '🏢', label: 'Oficinas',     desc: 'Flexible por área',            basePrice: 120000 },
  { id: 'custom', emoji: '⚙️', label: 'Personalizada', desc: 'Describe lo que necesitas',   basePrice: 90000 },
];

const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00'];

type Step = 'service' | 'details' | 'schedule' | 'confirm';

export function BookingScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('service');
  const [serviceType, setServiceType] = useState<JobType>('basic');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [notes, setNotes] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pickedLat, setPickedLat] = useState<number | null>(null);
  const [pickedLng, setPickedLng] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const service = SERVICES.find(s => s.id === serviceType)!;
  const budget = service.basePrice + (bedrooms - 1) * 20000 + (bathrooms - 1) * 15000;

  const scheduledAt = selectedDate && selectedTime
    ? (() => {
        const d = new Date(selectedDate);
        const [h, m] = selectedTime.split(':');
        d.setHours(parseInt(h), parseInt(m), 0, 0);
        return d.toISOString();
      })()
    : null;

  const submit = async () => {
    if (!profile) return;
    setLoading(true);

    let address_id: string | undefined;
    if (street && city) {
      const { data: addr } = await supabase
        .from('addresses')
        .insert({ user_id: profile.id, label: 'Casa', street, city,
                  lat: pickedLat, lng: pickedLng, is_default: true })
        .select('id')
        .single();
      address_id = addr?.id;
    }

    const { data: newJob, error } = await supabase.from('jobs').insert({
      client_id: profile.id,
      type: serviceType,
      bedrooms,
      bathrooms,
      notes: notes || null,
      budget,
      status: 'open',
      scheduled_at: scheduledAt,
      address_id,
      recurrence,
    }).select('id').single();

    // F23: invocar match-pros en background (no bloquear UX)
    if (newJob?.id && pickedLat && pickedLng) {
      supabase.functions.invoke('match-pros', {
        body: { job_id: newJob.id, lat: pickedLat, lng: pickedLng, job_type: serviceType },
      }).catch(() => { /* best-effort */ });
    }

    setLoading(false);
    if (!error) setSuccess(true);
  };

  if (success) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>¡Servicio publicado!</Text>
          <Text style={styles.successSub}>Los profesionales cerca de ti verán tu solicitud y enviarán ofertas pronto.</Text>
          <Pressable
            style={[styles.primaryBtn, { marginTop: Spacing.xxl }]}
            onPress={() => navigation.navigate('ClientTabs', { screen: 'Bookings' })}
          >
            <Text style={styles.primaryBtnText}>Ver mis servicios</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  const STEPS: Step[] = ['service', 'details', 'schedule', 'confirm'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.header}>
            {step !== 'service' ? (
              <Pressable onPress={() => setStep(STEPS[stepIdx - 1])} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={Colors.ink} />
              </Pressable>
            ) : (
              <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="close" size={22} color={Colors.ink} />
              </Pressable>
            )}
            <Text style={styles.headerTitle}>Solicitar servicio</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            {STEPS.map((s, i) => (
              <View key={s} style={[styles.progressDot, i <= stepIdx && styles.progressDotActive]} />
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* STEP 1 — Tipo de servicio */}
            {step === 'service' && (
              <View style={styles.section}>
                <Text style={styles.stepTitle}>¿Qué tipo de limpieza necesitas?</Text>
                <View style={styles.serviceGrid}>
                  {SERVICES.map(s => (
                    <Pressable
                      key={s.id}
                      style={[styles.serviceCard, serviceType === s.id && styles.serviceCardActive, Shadow.sm]}
                      onPress={() => setServiceType(s.id)}
                    >
                      <Text style={styles.serviceEmoji}>{s.emoji}</Text>
                      <Text style={[styles.serviceCardLabel, serviceType === s.id && styles.serviceCardLabelActive]}>
                        {s.label}
                      </Text>
                      <Text style={styles.serviceCardDesc}>{s.desc}</Text>
                      <Text style={[styles.serviceCardPrice, serviceType === s.id && { color: Colors.primary }]}>
                        desde ${s.basePrice}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* STEP 2 — Detalles */}
            {step === 'details' && (
              <View style={styles.section}>
                <Text style={styles.stepTitle}>Detalles del espacio</Text>

                <Text style={styles.fieldLabel}>Recámaras</Text>
                <View style={styles.counterRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <Pressable
                      key={n}
                      style={[styles.counterBtn, bedrooms === n && styles.counterBtnActive]}
                      onPress={() => setBedrooms(n)}
                    >
                      <Text style={[styles.counterBtnText, bedrooms === n && styles.counterBtnTextActive]}>{n}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Baños</Text>
                <View style={styles.counterRow}>
                  {[1, 2, 3, 4].map(n => (
                    <Pressable
                      key={n}
                      style={[styles.counterBtn, bathrooms === n && styles.counterBtnActive]}
                      onPress={() => setBathrooms(n)}
                    >
                      <Text style={[styles.counterBtnText, bathrooms === n && styles.counterBtnTextActive]}>{n}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Dirección</Text>
                <Pressable
                  style={[styles.input, styles.mapBtn]}
                  onPress={() => navigation.navigate('MapPicker', {
                    onConfirm: ({ lat, lng, label }: { lat: number; lng: number; label: string }) => {
                      setPickedLat(lat);
                      setPickedLng(lng);
                      const parts = label.split(',');
                      setStreet(parts[0]?.trim() ?? label);
                      setCity(parts.slice(1).join(',').trim());
                    },
                  })}
                >
                  <Ionicons name={pickedLat ? 'location' : 'map-outline'} size={18} color={pickedLat ? Colors.primary : Colors.ink4} />
                  <Text style={[styles.mapBtnText, pickedLat !== null && { color: Colors.ink }]}>
                    {pickedLat ? `${street || 'Ubicación seleccionada'}` : 'Seleccionar en el mapa'}
                  </Text>
                  {pickedLat && <Ionicons name="checkmark-circle" size={18} color={Colors.ok} />}
                </Pressable>
                <TextInput
                  style={[styles.input, { marginTop: Spacing.sm }]}
                  placeholder="Calle y número"
                  placeholderTextColor={Colors.ink4}
                  value={street}
                  onChangeText={setStreet}
                />
                <TextInput
                  style={[styles.input, { marginTop: Spacing.sm }]}
                  placeholder="Ciudad / Colonia"
                  placeholderTextColor={Colors.ink4}
                  value={city}
                  onChangeText={setCity}
                />

                <Text style={styles.fieldLabel}>Notas adicionales (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ej: Tengo mascotas, necesito productos ecológicos…"
                  placeholderTextColor={Colors.ink4}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            {/* STEP 3 — Fecha y hora */}
            {step === 'schedule' && (
              <View style={styles.section}>
                <Text style={styles.stepTitle}>¿Cuándo lo necesitas?</Text>

                <Text style={styles.fieldLabel}>Fecha</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    {DATES.map((d, i) => {
                      const isSelected = selectedDate?.toDateString() === d.toDateString();
                      return (
                        <Pressable
                          key={i}
                          style={[styles.dateCard, isSelected && styles.dateCardActive, Shadow.sm]}
                          onPress={() => setSelectedDate(d)}
                        >
                          <Text style={[styles.dateDow, isSelected && { color: '#fff' }]}>
                            {d.toLocaleDateString('es-MX', { weekday: 'short' })}
                          </Text>
                          <Text style={[styles.dateNum, isSelected && { color: '#fff' }]}>
                            {d.getDate()}
                          </Text>
                          <Text style={[styles.dateMon, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                            {d.toLocaleDateString('es-MX', { month: 'short' })}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                <Text style={styles.fieldLabel}>Hora</Text>
                <View style={styles.timeGrid}>
                  {TIMES.map(t => (
                    <Pressable
                      key={t}
                      style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                      onPress={() => setSelectedTime(t)}
                    >
                      <Text style={[styles.timeText, selectedTime === t && styles.timeTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* STEP 4 — Confirmar */}
            {step === 'confirm' && (
              <View style={styles.section}>
                <Text style={styles.stepTitle}>Resumen del servicio</Text>

                <View style={[styles.summaryCard, Shadow.md]}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryEmoji}>{service.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryLabel}>Tipo</Text>
                      <Text style={styles.summaryValue}>{service.label}</Text>
                    </View>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Ionicons name="home-outline" size={18} color={Colors.primary} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={styles.summaryLabel}>Espacio</Text>
                      <Text style={styles.summaryValue}>{bedrooms} rec · {bathrooms} baños</Text>
                    </View>
                  </View>
                  {(street || city) && (
                    <>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Ionicons name="location-outline" size={18} color={Colors.primary} />
                        <View style={{ flex: 1, marginLeft: Spacing.md }}>
                          <Text style={styles.summaryLabel}>Dirección</Text>
                          <Text style={styles.summaryValue}>{[street, city].filter(Boolean).join(', ')}</Text>
                        </View>
                      </View>
                    </>
                  )}
                  {scheduledAt && (
                    <>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                        <View style={{ flex: 1, marginLeft: Spacing.md }}>
                          <Text style={styles.summaryLabel}>Fecha y hora</Text>
                          <Text style={styles.summaryValue}>
                            {new Date(scheduledAt).toLocaleDateString('es-MX', {
                              weekday: 'long', day: 'numeric', month: 'long',
                            })} · {selectedTime}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Ionicons name="cash-outline" size={18} color={Colors.ok} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text style={styles.summaryLabel}>Presupuesto estimado</Text>
                      <Text style={[styles.summaryValue, { color: Colors.ok, fontSize: 20, fontWeight: '800' }]}>
                        ${budget.toLocaleString('es-CO')} COP
                      </Text>
                    </View>
                  </View>
                </View>

                {/* F15: Recurrencia */}
                <Text style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>¿Repetir automáticamente?</Text>
                <View style={styles.recurrenceRow}>
                  {([
                    { id: 'none',      label: 'No' },
                    { id: 'weekly',    label: 'Semanal' },
                    { id: 'biweekly',  label: 'Quincenal' },
                    { id: 'monthly',   label: 'Mensual' },
                  ] as const).map(opt => (
                    <Pressable
                      key={opt.id}
                      style={[styles.recurrenceChip, recurrence === opt.id && styles.recurrenceChipActive]}
                      onPress={() => setRecurrence(opt.id)}
                    >
                      <Text style={[styles.recurrenceText, recurrence === opt.id && styles.recurrenceTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {recurrence !== 'none' && (
                  <View style={styles.recurrenceHint}>
                    <Ionicons name="refresh-circle-outline" size={14} color={Colors.primary} />
                    <Text style={styles.recurrenceHintText}>
                      Se generará un nuevo servicio automáticamente · puedes cancelarlo cuando quieras
                    </Text>
                  </View>
                )}

                <Text style={styles.disclaimer}>
                  Los profesionales enviarán ofertas. Tú eliges al que más te convenga.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            {step !== 'confirm' ? (
              <Pressable
                style={[
                  styles.primaryBtn, Shadow.cta,
                  step === 'schedule' && (!selectedDate || !selectedTime) && { opacity: 0.45 },
                ]}
                onPress={() => {
                  if (step === 'schedule' && (!selectedDate || !selectedTime)) return;
                  setStep(STEPS[stepIdx + 1]);
                }}
              >
                <Text style={styles.primaryBtnText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, Shadow.cta, loading && { opacity: 0.7 }]}
                onPress={submit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={styles.primaryBtnText}>Publicar servicio</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    </>
                }
              </Pressable>
            )}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h4, color: Colors.ink },
  progressRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.sky200 },
  progressDotActive: { backgroundColor: Colors.primary },

  scroll: { paddingBottom: Spacing.xxxl },
  section: { paddingHorizontal: Spacing.xl },
  stepTitle: { ...Typography.h3, color: Colors.ink, marginBottom: Spacing.xl },

  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  serviceCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.sky100,
  },
  serviceCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  serviceEmoji: { fontSize: 26, marginBottom: Spacing.sm },
  serviceCardLabel: { ...Typography.smallBold, color: Colors.ink, marginBottom: 2 },
  serviceCardLabelActive: { color: Colors.primary },
  serviceCardDesc: { ...Typography.caption, color: Colors.ink3, marginBottom: Spacing.sm },
  serviceCardPrice: { ...Typography.caption, color: Colors.ink3, fontWeight: '700' },

  fieldLabel: { ...Typography.smallBold, color: Colors.ink2, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  counterRow: { flexDirection: 'row', gap: Spacing.sm },
  counterBtn: {
    width: 48, height: 48, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  counterBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  counterBtnText: { ...Typography.bodyMed, color: Colors.ink },
  counterBtnTextActive: { color: Colors.primary },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    ...Typography.body, color: Colors.ink,
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 13 },
  mapBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapBtnText: { flex: 1, color: Colors.ink4, ...Typography.body },

  dateCard: {
    width: 64, alignItems: 'center', paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDow: { ...Typography.caption, color: Colors.ink3, textTransform: 'capitalize' },
  dateNum: { ...Typography.h3, color: Colors.ink, marginVertical: 2 },
  dateMon: { ...Typography.caption, color: Colors.ink3, textTransform: 'capitalize' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeChip: {
    paddingVertical: 10, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  timeChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  timeText: { ...Typography.smallBold, color: Colors.ink },
  timeTextActive: { color: Colors.primary },

  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.sky100,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryEmoji: { fontSize: 22, marginRight: Spacing.md },
  summaryLabel: { ...Typography.caption, color: Colors.ink3 },
  summaryValue: { ...Typography.bodyMed, color: Colors.ink, marginTop: 2 },
  summaryDivider: { height: 1, backgroundColor: Colors.sky100, marginVertical: Spacing.md },
  disclaimer: {
    ...Typography.small, color: Colors.ink3,
    textAlign: 'center', marginTop: Spacing.lg, lineHeight: 18,
  },

  footer: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  primaryBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  recurrenceRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  recurrenceChip:     { paddingVertical: 9, paddingHorizontal: Spacing.md, borderRadius: Radius.lg,
                        borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  recurrenceChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  recurrenceText:     { ...Typography.smallBold, color: Colors.ink },
  recurrenceTextActive: { color: Colors.primary },
  recurrenceHint:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: Spacing.sm,
                        backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
                        padding: Spacing.md },
  recurrenceHintText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 16 },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  successEmoji: { fontSize: 64, marginBottom: Spacing.xxl },
  successTitle: { ...Typography.h2, color: Colors.ink, textAlign: 'center' },
  successSub: { ...Typography.body, color: Colors.ink3, textAlign: 'center', marginTop: Spacing.md, lineHeight: 22 },
});
