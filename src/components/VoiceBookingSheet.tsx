import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, KeyboardAvoidingView, Modal,
  Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../theme';

const SERVICE_LABEL: Record<string, string> = {
  basic: '🧹 Básica', deep: '✨ Profunda', move: '📦 Mudanza', office: '🏢 Oficinas',
};

interface ParsedBooking {
  service_type: string;
  date: string | null;
  time: string | null;
  preferred_pro_name: string | null;
  address_hint: string | null;
  notes: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (parsed: ParsedBooking) => void;
}

export function VoiceBookingSheet({ visible, onClose, onConfirm }: Props) {
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [parsed, setParsed]     = useState<ParsedBooking | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const pulse                   = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const parse = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(null); setParsed(null);
    startPulse();
    try {
      const { data, error: err } = await supabase.functions.invoke('parse-voice-booking', {
        body: { text: text.trim() },
      });
      if (err) throw err;
      setParsed(data as ParsedBooking);
    } catch {
      setError('No pude entender el pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  };

  const reset = () => { setText(''); setParsed(null); setError(null); };

  const handleConfirm = () => {
    if (parsed) { onConfirm(parsed); onClose(); reset(); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        {/* Handle */}
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <Text style={styles.title}>Reserva por voz</Text>
          <Pressable onPress={() => { onClose(); reset(); }} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.ink3} />
          </Pressable>
        </View>

        <Text style={styles.sub}>
          Escribe o dicta lo que necesitas y la IA lo convierte en una reserva
        </Text>

        {/* Mic + TextInput */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder='Ej: "Limpieza profunda mañana a las 10, que venga Carmen"'
            placeholderTextColor={Colors.ink4}
            multiline
            autoFocus
            returnKeyType="done"
          />
          {/* El teclado de iOS/Android tiene botón de micrófono nativo */}
        </View>

        <View style={styles.examples}>
          {[
            '"Básica este sábado a las 9"',
            '"Necesito limpieza de mudanza urgente"',
            '"Deep cleaning el viernes con Andrés"',
          ].map(e => (
            <Pressable key={e} onPress={() => setText(e.replace(/"/g, ''))} style={styles.exampleChip}>
              <Text style={styles.exampleText}>{e}</Text>
            </Pressable>
          ))}
        </View>

        {/* Resultado parseado */}
        {parsed && (
          <View style={[styles.resultCard, Shadow.card]}>
            <Text style={styles.resultTitle}>Tu reserva entendida:</Text>
            <Row icon="sparkles" label="Servicio">{SERVICE_LABEL[parsed.service_type] ?? parsed.service_type}</Row>
            {parsed.date  && <Row icon="calendar" label="Fecha">{parsed.date}</Row>}
            {parsed.time  && <Row icon="time" label="Hora">{parsed.time}</Row>}
            {parsed.preferred_pro_name && <Row icon="person" label="Pro">{parsed.preferred_pro_name}</Row>}
            {parsed.address_hint && <Row icon="location" label="Zona">{parsed.address_hint}</Row>}
            {parsed.notes && <Row icon="document-text" label="Notas">{parsed.notes}</Row>}
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* CTAs */}
        {!parsed ? (
          <Pressable
            style={[styles.btn, (!text.trim() || loading) && styles.btnDisabled]}
            onPress={parse}
            disabled={!text.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.btnText}>Entender pedido</Text></>
            }
          </Pressable>
        ) : (
          <View style={styles.ctaRow}>
            <Pressable style={styles.btnOutline} onPress={reset}>
              <Text style={styles.btnOutlineText}>Editar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnFlex]} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.btnText}>Confirmar y reservar</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <View style={rowStyles.row}>
      <Ionicons name={icon as any} size={14} color={Colors.primary} />
      <Text style={rowStyles.label}>{label}:</Text>
      <Text style={rowStyles.value}>{children}</Text>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { ...Typography.small, color: Colors.ink3, width: 60 },
  value: { ...Typography.small, color: Colors.ink, fontWeight: '600', flex: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.xl, paddingBottom: 32 },
  handle:    { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2,
               alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title:     { ...Typography.h3, color: Colors.ink },
  sub:       { ...Typography.body, color: Colors.ink3, marginBottom: Spacing.lg },

  inputWrap: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
               borderColor: Colors.border, padding: Spacing.md, minHeight: 100, marginBottom: Spacing.md },
  input:     { ...Typography.body, color: Colors.ink, flex: 1, textAlignVertical: 'top' },

  examples:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  exampleChip: { backgroundColor: Colors.primarySoft, borderRadius: Radius.full,
                 paddingHorizontal: 10, paddingVertical: 4 },
  exampleText: { ...Typography.micro, color: Colors.primary },

  resultCard:  { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
                 gap: 8, marginBottom: Spacing.lg },
  resultTitle: { ...Typography.bodyMed, fontWeight: '700', color: Colors.ink, marginBottom: 4 },

  error: { ...Typography.small, color: Colors.danger, marginBottom: Spacing.md, textAlign: 'center' },

  btn:         { backgroundColor: Colors.primary, borderRadius: Radius.full, height: 52,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDisabled: { opacity: 0.45 },
  btnFlex:     { flex: 1 },
  btnText:     { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
  btnOutline:  { borderWidth: 2, borderColor: Colors.border, borderRadius: Radius.full, height: 52,
                 paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { ...Typography.bodyMed, color: Colors.ink2, fontWeight: '600' },
  ctaRow:      { flexDirection: 'row', gap: Spacing.md },
});
