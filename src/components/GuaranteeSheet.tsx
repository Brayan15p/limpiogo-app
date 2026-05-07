import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../theme';

const REASONS = [
  { id: 'incomplete', label: 'Servicio incompleto', icon: 'checkmark-circle-outline' },
  { id: 'quality',    label: 'Baja calidad',        icon: 'thumbs-down-outline' },
  { id: 'damage',     label: 'Daño en objetos',     icon: 'alert-circle-outline' },
  { id: 'noshow',     label: 'No se presentó',      icon: 'person-remove-outline' },
  { id: 'other',      label: 'Otro motivo',          icon: 'ellipsis-horizontal-circle-outline' },
];

interface Props {
  visible: boolean;
  jobId: string;
  onDone: () => void;
  onDismiss: () => void;
}

export function GuaranteeSheet({ visible, jobId, onDone, onDismiss }: Props) {
  const { profile } = useAuth();
  const [reason, setReason]       = useState('');
  const [details, setDetails]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!reason) {
      Alert.alert('Selecciona un motivo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('guarantee_claims').insert({
      booking_id: jobId,
      client_id: profile!.id,
      reason: reason + (details ? `: ${details}` : ''),
      status: 'pending',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'No se pudo enviar. Intenta de nuevo.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss} />
      <View style={styles.sheet}>
        {submitted ? (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Ionicons name="shield-checkmark" size={36} color={Colors.ok} />
            </View>
            <Text style={styles.successTitle}>¡Reclamo enviado!</Text>
            <Text style={styles.successSub}>
              Nuestro equipo revisará tu caso en menos de 2 horas y te contactará.
            </Text>
            <Pressable style={styles.doneBtn} onPress={onDone}>
              <Text style={styles.doneBtnText}>Entendido</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark-outline" size={22} color={Colors.warn} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Garantía 48h</Text>
                <Text style={styles.subtitle}>Tu satisfacción está garantizada</Text>
              </View>
              <Pressable onPress={onDismiss}>
                <Ionicons name="close" size={22} color={Colors.ink3} />
              </Pressable>
            </View>

            <Text style={styles.label}>¿Cuál es el motivo?</Text>
            <View style={styles.reasonsGrid}>
              {REASONS.map(r => (
                <Pressable
                  key={r.id}
                  style={[styles.reasonChip, reason === r.id && styles.reasonChipActive]}
                  onPress={() => setReason(r.id)}
                >
                  <Ionicons
                    name={r.icon as any}
                    size={16}
                    color={reason === r.id ? Colors.warn : Colors.ink3}
                  />
                  <Text style={[styles.reasonText, reason === r.id && styles.reasonTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: Spacing.md }]}>Detalles adicionales (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Cuéntanos qué pasó…"
              placeholderTextColor={Colors.ink4}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={3}
            />

            <View style={styles.guarantee}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
              <Text style={styles.guaranteeText}>
                Programaremos un nuevo servicio sin costo o te reembolsamos. Garantizado.
              </Text>
            </View>

            <Pressable
              style={[styles.submitBtn, (!reason || loading) && { opacity: 0.5 }]}
              onPress={submit}
              disabled={!reason || loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Enviar reclamo</Text>
                  </>
              }
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:   { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
             padding: Spacing.xl, paddingBottom: 40, gap: Spacing.sm, ...Shadow.lg },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
             alignSelf: 'center', marginBottom: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  headerIcon:{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.warnLight,
               alignItems: 'center', justifyContent: 'center' },
  title:    { ...Typography.h4, color: Colors.ink },
  subtitle: { ...Typography.caption, color: Colors.ink3, marginTop: 2 },
  label:    { ...Typography.smallBold, color: Colors.ink2 },
  reasonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  reasonChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9,
                paddingHorizontal: Spacing.md, borderRadius: Radius.lg,
                borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  reasonChipActive: { borderColor: Colors.warn, backgroundColor: Colors.warnLight },
  reasonText: { ...Typography.small, color: Colors.ink2 },
  reasonTextActive: { color: Colors.warn, fontWeight: '700' },
  input:    { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
              borderColor: Colors.border, padding: Spacing.md, ...Typography.body,
              color: Colors.ink, height: 80, textAlignVertical: 'top' },
  guarantee:{ flexDirection: 'row', alignItems: 'flex-start', gap: 6,
              backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md },
  guaranteeText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 16 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
               backgroundColor: Colors.warn, borderRadius: Radius.xl, paddingVertical: 15,
               marginTop: Spacing.sm },
  submitBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  successBox:   { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  successIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.okLight,
                  alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...Typography.h3, color: Colors.ink },
  successSub:   { ...Typography.small, color: Colors.ink3, textAlign: 'center', lineHeight: 20,
                  paddingHorizontal: Spacing.md },
  doneBtn:      { backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 14,
                  paddingHorizontal: Spacing.xxxl, marginTop: Spacing.md },
  doneBtnText:  { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
