import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
];

type Schedule = Record<string, { enabled: boolean; start: string; end: string }>;

const DEFAULT_SCHEDULE: Schedule = Object.fromEntries(
  DAYS.map((d, i) => [d, { enabled: i < 5, start: '08:00', end: '17:00' }])
);

export function ProAvailabilityScreen({ navigation }: any) {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pickerDay, setPickerDay] = useState<string | null>(null);
  const [pickerType, setPickerType] = useState<'start' | 'end'>('start');
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    supabase
      .from('pro_schedules')
      .select('schedule')
      .eq('pro_id', user?.id)
      .single()
      .then(({ data }) => {
        if (data?.schedule) setSchedule(data.schedule as Schedule);
        setLoading(false);
      });
  }, [user?.id]);

  const toggleDay = (day: string) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  };

  const openPicker = (day: string, type: 'start' | 'end') => {
    setPickerDay(day);
    setPickerType(type);
    setShowPicker(true);
  };

  const selectTime = (time: string) => {
    if (!pickerDay) return;
    setSchedule(prev => ({ ...prev, [pickerDay]: { ...prev[pickerDay], [pickerType]: time } }));
    setShowPicker(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('pro_schedules')
      .upsert({ pro_id: user?.id, schedule }, { onConflict: 'pro_id' });
    setSaving(false);
    if (error) {
      Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.');
    } else {
      Alert.alert('¡Guardado!', 'Tu disponibilidad fue actualizada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const enabledDays = DAYS.filter(d => schedule[d].enabled).length;

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator size="large" color={Colors.proAccent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        <LinearGradient colors={[Colors.sky100, Colors.sky50]} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Mi disponibilidad</Text>
              <Text style={styles.headerSub}>{enabledDays} días activos</Text>
            </View>
            <Pressable
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Días rápidos */}
          <View style={styles.quickDays}>
            {DAYS.map(day => (
              <Pressable
                key={day}
                style={[styles.dayChip, schedule[day].enabled && styles.dayChipActive]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayChipText, schedule[day].enabled && styles.dayChipTextActive]}>{day}</Text>
              </Pressable>
            ))}
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={Colors.sky500} />
            <Text style={styles.infoText}>Los clientes solo podrán agendar en los horarios que configures aquí.</Text>
          </View>

          {/* Horario por día */}
          {DAYS.map((day, idx) => (
            <View key={day} style={[styles.dayCard, Shadow.sm, !schedule[day].enabled && styles.dayCardDisabled]}>
              <View style={styles.dayCardHeader}>
                <Pressable
                  style={[styles.dayToggle, schedule[day].enabled && styles.dayToggleActive]}
                  onPress={() => toggleDay(day)}
                >
                  {schedule[day].enabled && <Ionicons name="checkmark" size={13} color="#fff" />}
                </Pressable>
                <Text style={[styles.dayName, !schedule[day].enabled && styles.dayNameOff]}>{DAY_FULL[idx]}</Text>
                {!schedule[day].enabled && (
                  <View style={styles.closedPill}>
                    <Text style={styles.closedText}>No disponible</Text>
                  </View>
                )}
              </View>

              {schedule[day].enabled && (
                <View style={styles.timeRow}>
                  <Pressable style={styles.timePicker} onPress={() => openPicker(day, 'start')}>
                    <Ionicons name="sunny-outline" size={14} color={Colors.warn} />
                    <Text style={styles.timePickerLabel}>Desde</Text>
                    <Text style={styles.timePickerValue}>{schedule[day].start}</Text>
                  </Pressable>

                  <View style={styles.timeArrow}>
                    <Ionicons name="arrow-forward" size={14} color={Colors.ink4} />
                  </View>

                  <Pressable style={styles.timePicker} onPress={() => openPicker(day, 'end')}>
                    <Ionicons name="moon-outline" size={14} color={Colors.sky500} />
                    <Text style={styles.timePickerLabel}>Hasta</Text>
                    <Text style={styles.timePickerValue}>{schedule[day].end}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Modal selector de hora */}
        {showPicker && (
          <Pressable style={styles.pickerOverlay} onPress={() => setShowPicker(false)}>
            <Pressable style={[styles.pickerSheet, Shadow.lg]} onPress={e => e.stopPropagation()}>
              <Text style={styles.pickerTitle}>
                {pickerType === 'start' ? 'Hora de inicio' : 'Hora de fin'} · {pickerDay}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
                {TIME_SLOTS.map(t => (
                  <Pressable
                    key={t}
                    style={[styles.timeOption, pickerDay && schedule[pickerDay][pickerType] === t && styles.timeOptionActive]}
                    onPress={() => selectTime(t)}
                  >
                    <Text style={[styles.timeOptionText, pickerDay && schedule[pickerDay][pickerType] === t && styles.timeOptionTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  header:    { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn:   { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  headerTitle:{ ...Typography.h3, color: Colors.ink },
  headerSub:  { ...Typography.small, color: Colors.ink3, marginTop: 2 },
  saveBtn:   { backgroundColor: Colors.proAccent, borderRadius: Radius.full, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...Typography.smallBold, color: '#fff' },

  scroll: { padding: Spacing.xl, paddingBottom: 40 },

  quickDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  dayChip:   { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  dayChipActive: { backgroundColor: Colors.proAccent, borderColor: Colors.proAccent },
  dayChipText:   { ...Typography.caption, color: Colors.ink3 },
  dayChipTextActive: { color: '#fff', fontWeight: '700' },

  infoBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.sky100, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  infoText: { ...Typography.small, color: Colors.navy, flex: 1, marginLeft: Spacing.sm, lineHeight: 18 },

  dayCard:          { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.sky100 },
  dayCardDisabled:  { opacity: 0.6 },
  dayCardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  dayToggle:        { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, marginRight: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  dayToggleActive:  { backgroundColor: Colors.proAccent, borderColor: Colors.proAccent },
  dayName:          { ...Typography.bodyMed, color: Colors.ink, flex: 1 },
  dayNameOff:       { color: Colors.ink4 },
  closedPill:       { backgroundColor: Colors.surfaceAlt, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  closedText:       { ...Typography.caption, color: Colors.ink4 },

  timeRow:   { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  timePicker:{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  timePickerLabel: { ...Typography.caption, color: Colors.ink3, marginLeft: 6, flex: 1 },
  timePickerValue: { ...Typography.smallBold, color: Colors.proAccent },
  timeArrow: { paddingHorizontal: Spacing.sm },

  pickerOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet:   { backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, paddingBottom: 40 },
  pickerTitle:   { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.lg },
  timeOption:    { paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, marginBottom: 4 },
  timeOptionActive: { backgroundColor: Colors.proLight },
  timeOptionText:   { ...Typography.body, color: Colors.ink },
  timeOptionTextActive: { color: Colors.proAccent, fontWeight: '700' },
});
