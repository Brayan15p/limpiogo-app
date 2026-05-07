import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';

// Genera los próximos 7 días
function getNextDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

const DAYS = getNextDays(7);
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface Schedule {
  day_of_week: number; // 0=Sun
  start_time: string;  // 'HH:MM'
  end_time: string;
}

interface Booking {
  scheduled_at: string;
  status: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function generateSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  let cur = timeToMinutes(start);
  const fin = timeToMinutes(end);
  while (cur + 60 <= fin) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0');
    const m = String(cur % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += 60;
  }
  return slots;
}

export function ProCalendarScreen({ route, navigation }: any) {
  const { proId, proName } = route.params as { proId: string; proName: string };

  const [selectedDay, setSelectedDay] = useState<Date>(DAYS[0]);
  const [schedules, setSchedules]     = useState<Schedule[]>([]);
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [loading, setLoading]         = useState(true);

  const fetchData = useCallback(async () => {
    const [{ data: schedData }, { data: bookData }] = await Promise.all([
      supabase.from('pro_schedules').select('day_of_week, start_time, end_time').eq('pro_id', proId),
      supabase
        .from('jobs')
        .select('scheduled_at, status')
        .eq('pro_id', proId)
        .in('status', ['open', 'in_progress', 'accepted']),
    ]);
    setSchedules(schedData ?? []);
    setBookings(bookData ?? []);
    setLoading(false);
  }, [proId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Slots disponibles para el día seleccionado
  const daySchedules = schedules.filter(s => s.day_of_week === selectedDay.getDay());
  const allSlots = daySchedules.flatMap(s => generateSlots(s.start_time, s.end_time));

  const bookedSlots = new Set(
    bookings
      .filter(b => {
        const d = new Date(b.scheduled_at);
        return d.toDateString() === selectedDay.toDateString();
      })
      .map(b => {
        const d = new Date(b.scheduled_at);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      }),
  );

  const freeSlots  = allSlots.filter(s => !bookedSlots.has(s));
  const totalSlots = allSlots.length;

  const goBook = (time: string) => {
    const d = new Date(selectedDay);
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    navigation.navigate('Booking', {
      prefillDate: d.toISOString(),
      prefillTime: time,
      prefillProId: proId,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Disponibilidad</Text>
            <Text style={styles.headerSub}>{proName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Disponibilidad hero */}
          {!loading && (
            <LinearGradient colors={Gradients.heroPrimary} style={styles.hero}>
              <Text style={styles.heroLabel}>Esta semana</Text>
              <Text style={styles.heroValue}>{freeSlots.length} slots libres</Text>
              {freeSlots.length < 5 && freeSlots.length > 0 && (
                <View style={styles.urgencyPill}>
                  <Ionicons name="time-outline" size={13} color="#fff" />
                  <Text style={styles.urgencyText}>¡Agenda pronto, hay pocos slots!</Text>
                </View>
              )}
            </LinearGradient>
          )}

          {/* Selector de día */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {DAYS.map((day, i) => {
              const isSelected = day.toDateString() === selectedDay.toDateString();
              const daySched = schedules.filter(s => s.day_of_week === day.getDay());
              const hasSched = daySched.length > 0;
              return (
                <Pressable
                  key={i}
                  style={[styles.dayChip, isSelected && styles.dayChipActive, !hasSched && styles.dayChipOff]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayDow, isSelected && styles.dayTextActive, !hasSched && styles.dayTextOff]}>
                    {DAY_LABELS[day.getDay()]}
                  </Text>
                  <Text style={[styles.dayNum, isSelected && styles.dayTextActive, !hasSched && styles.dayTextOff]}>
                    {day.getDate()}
                  </Text>
                  <Text style={[styles.dayMon, isSelected && styles.dayTextActive, !hasSched && styles.dayTextOff]}>
                    {MONTH_LABELS[day.getMonth()]}
                  </Text>
                  {hasSched && !isSelected && <View style={styles.dayDot} />}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Slots */}
          <View style={styles.slotsSection}>
            <Text style={styles.slotDate}>
              {DAY_LABELS[selectedDay.getDay()]} {selectedDay.getDate()} de {MONTH_LABELS[selectedDay.getMonth()]}
            </Text>

            {loading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
            ) : allSlots.length === 0 ? (
              <View style={styles.noSlots}>
                <Text style={styles.noSlotsEmoji}>😴</Text>
                <Text style={styles.noSlotsTitle}>Sin horario este día</Text>
                <Text style={styles.noSlotsSub}>El pro no tiene disponibilidad los {DAY_LABELS[selectedDay.getDay()]}</Text>
              </View>
            ) : (
              <>
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.ok }]} />
                    <Text style={styles.legendText}>Libre ({freeSlots.length})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.ink4 }]} />
                    <Text style={styles.legendText}>Ocupado ({totalSlots - freeSlots.length})</Text>
                  </View>
                </View>

                <View style={styles.slotsGrid}>
                  {allSlots.map(slot => {
                    const booked = bookedSlots.has(slot);
                    return (
                      <Pressable
                        key={slot}
                        style={[styles.slot, booked ? styles.slotBooked : styles.slotFree, Shadow.sm]}
                        onPress={() => !booked && goBook(slot)}
                        disabled={booked}
                      >
                        <Ionicons
                          name={booked ? 'close-circle' : 'checkmark-circle'}
                          size={14}
                          color={booked ? Colors.ink4 : Colors.ok}
                        />
                        <Text style={[styles.slotTime, booked && styles.slotTimeBooked]}>{slot}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {freeSlots.length === 0 && (
                  <View style={styles.fullDay}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.ink3} />
                    <Text style={styles.fullDayText}>Agenda completa este día. Elige otro.</Text>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  back:        { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
                 alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerCenter:{ alignItems: 'center' },
  headerTitle: { ...Typography.h4, color: Colors.ink },
  headerSub:   { ...Typography.caption, color: Colors.ink3 },

  hero:        { marginHorizontal: Spacing.xl, borderRadius: Radius.xl, padding: Spacing.xl,
                 alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  heroLabel:   { ...Typography.small, color: Colors.sky200, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue:   { ...Typography.display, color: '#fff' },
  urgencyPill: { flexDirection: 'row', alignItems: 'center', gap: 6,
                 backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full,
                 paddingVertical: 5, paddingHorizontal: 12, marginTop: Spacing.xs },
  urgencyText: { ...Typography.caption, color: '#fff' },

  daysRow:  { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.lg },
  dayChip:  { width: 58, alignItems: 'center', paddingVertical: Spacing.md,
              backgroundColor: Colors.surface, borderRadius: Radius.lg,
              borderWidth: 1.5, borderColor: Colors.border, gap: 2 },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipOff:    { opacity: 0.45 },
  dayDow:   { ...Typography.caption, color: Colors.ink3, textTransform: 'uppercase' },
  dayNum:   { ...Typography.h4, color: Colors.ink },
  dayMon:   { ...Typography.micro, color: Colors.ink3 },
  dayTextActive: { color: '#fff' },
  dayTextOff:    { color: Colors.ink4 },
  dayDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.ok, marginTop: 2 },

  slotsSection: { paddingHorizontal: Spacing.xl },
  slotDate:     { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.lg, textTransform: 'capitalize' },

  legendRow:  { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.small, color: Colors.ink2 },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  slot:      { flexDirection: 'row', alignItems: 'center', gap: 6,
               paddingVertical: 10, paddingHorizontal: Spacing.md,
               borderRadius: Radius.lg, borderWidth: 1.5 },
  slotFree:  { backgroundColor: Colors.okLight, borderColor: Colors.ok },
  slotBooked:{ backgroundColor: Colors.surfaceAlt, borderColor: Colors.border },
  slotTime:  { ...Typography.smallBold, color: Colors.ok },
  slotTimeBooked: { color: Colors.ink4 },

  noSlots:     { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  noSlotsEmoji:{ fontSize: 40 },
  noSlotsTitle:{ ...Typography.h4, color: Colors.ink },
  noSlotsSub:  { ...Typography.small, color: Colors.ink3, textAlign: 'center' },

  fullDay:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.xl,
                 backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: Spacing.lg },
  fullDayText: { ...Typography.small, color: Colors.ink3, flex: 1 },
});
