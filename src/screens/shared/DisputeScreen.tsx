import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

const REASONS = [
  { id: 'quality',    label: 'Servicio deficiente',    icon: 'thumbs-down-outline' },
  { id: 'noshow',     label: 'No se presentó',          icon: 'person-remove-outline' },
  { id: 'damage',     label: 'Daño a propiedad',        icon: 'alert-circle-outline' },
  { id: 'payment',    label: 'Problema con el pago',    icon: 'card-outline' },
  { id: 'harassment', label: 'Conducta inapropiada',    icon: 'ban-outline' },
  { id: 'other',      label: 'Otro',                    icon: 'ellipsis-horizontal-circle-outline' },
];

export function DisputeScreen({ navigation, route }: any) {
  const { jobId } = (route.params ?? {}) as { jobId?: string };
  const { profile } = useAuth();

  const [reason, setReason]       = useState('');
  const [description, setDesc]    = useState('');
  const [evidence, setEvidence]   = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  const pickEvidence = async () => {
    if (evidence.length >= 3) { Alert.alert('Máximo 3 imágenes'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const asset = result.assets[0];
    const ext   = asset.uri.split('.').pop() ?? 'jpg';
    const path  = `disputes/${profile!.id}/${Date.now()}.${ext}`;
    const blob  = await (await fetch(asset.uri)).blob();

    const { error } = await supabase.storage.from('job-photos').upload(path, blob, { contentType: `image/${ext}` });
    if (!error) {
      const { data } = supabase.storage.from('job-photos').getPublicUrl(path);
      setEvidence(prev => [...prev, data.publicUrl]);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!reason || !description.trim()) {
      Alert.alert('Completa motivo y descripción');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('disputes').insert({
      booking_id: jobId ?? null,
      reporter_id: profile!.id,
      reason,
      description,
      evidence_urls: evidence,
      status: 'open',
    });
    setLoading(false);
    if (error) { Alert.alert('Error', 'No se pudo enviar. Intenta de nuevo.'); return; }
    setDone(true);
  };

  if (done) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.centerBox}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.ok} />
          </View>
          <Text style={styles.doneTitle}>Reporte enviado</Text>
          <Text style={styles.doneSub}>
            Nuestro equipo revisará tu caso en las próximas 24 horas. Te notificaremos por la app.
          </Text>
          <Pressable style={[styles.doneBtn, Shadow.cta]} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Volver</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Reportar problema</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Motivo del reporte</Text>
          <View style={styles.reasonsGrid}>
            {REASONS.map(r => (
              <Pressable
                key={r.id}
                style={[styles.reasonChip, reason === r.id && styles.reasonChipActive]}
                onPress={() => setReason(r.id)}
              >
                <Ionicons name={r.icon as any} size={16} color={reason === r.id ? Colors.danger : Colors.ink3} />
                <Text style={[styles.reasonText, reason === r.id && styles.reasonTextActive]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Descripción detallada</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe lo que sucedió con el mayor detalle posible…"
            placeholderTextColor={Colors.ink4}
            value={description}
            onChangeText={setDesc}
            multiline
            numberOfLines={5}
          />

          <Text style={styles.sectionLabel}>Evidencia fotográfica (opcional · máx 3)</Text>
          <View style={styles.evidenceRow}>
            {evidence.map((url, i) => (
              <View key={i} style={styles.evidenceThumb}>
                <Image source={{ uri: url }} style={styles.evidenceImg} resizeMode="cover" />
                <Pressable style={styles.evidenceRemove} onPress={() => setEvidence(prev => prev.filter((_, j) => j !== i))}>
                  <Ionicons name="close-circle" size={18} color={Colors.danger} />
                </Pressable>
              </View>
            ))}
            {evidence.length < 3 && (
              <Pressable style={styles.evidenceAdd} onPress={pickEvidence} disabled={uploading}>
                {uploading
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <><Ionicons name="camera-outline" size={20} color={Colors.primary} />
                     <Text style={styles.evidenceAddText}>Agregar</Text></>
                }
              </Pressable>
            )}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={15} color={Colors.primary} />
            <Text style={styles.infoText}>
              Toda la información es confidencial. Nuestro equipo resolverá tu caso en 24h.
            </Text>
          </View>

          <Pressable
            style={[styles.submitBtn, Shadow.cta, (!reason || !description.trim() || loading) && { opacity: 0.5 }]}
            onPress={submit}
            disabled={!reason || !description.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="send" size={16} color="#fff" />
                 <Text style={styles.submitBtnText}>Enviar reporte</Text></>
            }
          </Pressable>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  back:        { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
                 alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { ...Typography.h4, color: Colors.ink },
  scroll:      { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

  sectionLabel: { ...Typography.smallBold, color: Colors.ink2, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  reasonsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  reasonChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9,
                  paddingHorizontal: Spacing.md, borderRadius: Radius.lg,
                  borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  reasonChipActive: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  reasonText:       { ...Typography.small, color: Colors.ink2 },
  reasonTextActive: { color: Colors.danger, fontWeight: '700' },

  textArea:  { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
               borderColor: Colors.border, padding: Spacing.md, ...Typography.body,
               color: Colors.ink, height: 120, textAlignVertical: 'top' },

  evidenceRow:     { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  evidenceThumb:   { width: 80, height: 80, borderRadius: Radius.md, backgroundColor: Colors.surfaceAlt,
                     position: 'relative', overflow: 'hidden' },
  evidenceImg:     { width: '100%', height: '100%' },
  evidenceRemove:  { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 },
  evidenceAdd:     { width: 80, height: 80, borderRadius: Radius.md, borderWidth: 1.5,
                     borderColor: Colors.primarySoft, borderStyle: 'dashed',
                     backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', gap: 4 },
  evidenceAddText: { ...Typography.micro, color: Colors.primary, fontWeight: '700' },

  infoBox:  { flexDirection: 'row', gap: 6, alignItems: 'flex-start', backgroundColor: Colors.primaryLight,
              borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.lg },
  infoText: { ...Typography.caption, color: Colors.primary, flex: 1, lineHeight: 16 },

  submitBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                   backgroundColor: Colors.danger, borderRadius: Radius.xl, paddingVertical: 15,
                   marginTop: Spacing.xl },
  submitBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  centerBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl, gap: Spacing.lg },
  doneIcon:   { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.okLight,
                alignItems: 'center', justifyContent: 'center' },
  doneTitle:  { ...Typography.h2, color: Colors.ink },
  doneSub:    { ...Typography.body, color: Colors.ink3, textAlign: 'center', lineHeight: 22 },
  doneBtn:    { backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 14,
                paddingHorizontal: Spacing.xxxl },
  doneBtnText:{ ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
