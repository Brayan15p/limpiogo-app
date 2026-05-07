import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';

const SERVICE_LABEL: Record<string, string> = {
  basic: 'Básica', deep: 'Profunda', move: 'Mudanza', office: 'Oficinas', custom: 'Personalizada',
};
const SERVICE_EMOJI: Record<string, string> = {
  basic: '🧹', deep: '✨', move: '📦', office: '🏢', custom: '⚙️',
};
const CONFIDENCE_COLOR: Record<string, string> = {
  high: Colors.ok, medium: Colors.warn, low: Colors.danger,
};
const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Alta confianza', medium: 'Estimado', low: 'Baja confianza',
};

function fmt(n: number) { return n.toLocaleString('es-CO'); }

interface EstimateResult {
  sqm_estimate: number;
  service_type: string;
  price_min: number;
  price_max: number;
  confidence: string;
  reasoning: string;
}

export function PhotoEstimateScreen({ navigation }: any) {
  const [imageUri, setImageUri]     = useState<string | null>(null);
  const [imageB64, setImageB64]     = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<EstimateResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const pickPhoto = async (fromCamera: boolean) => {
    const perms = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perms.status !== 'granted') return;

    const picker = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const res = await picker({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (res.canceled || !res.assets[0]) return;
    setImageUri(res.assets[0].uri);
    setImageB64(res.assets[0].base64 ?? null);
    setResult(null);
    setError(null);
  };

  const analyze = async () => {
    if (!imageB64) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('estimate-from-photo', {
        body: { image_base64: imageB64, media_type: 'image/jpeg' },
      });

      if (fnError || data?.error) {
        setError('No pudimos analizar la foto. Intenta con otra imagen más clara.');
      } else {
        setResult(data as EstimateResult);
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    }

    setLoading(false);
  };

  const goToEstimate = () => {
    if (!result) return;
    navigation.navigate('Estimate', {
      prefillSqm: result.sqm_estimate,
      prefillService: result.service_type,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={Colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Foto → Cotización IA</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero explicativo */}
          {!imageUri && (
            <LinearGradient colors={Gradients.heroPrimary} style={styles.hero}>
              <Text style={styles.heroEmoji}>📸</Text>
              <Text style={styles.heroTitle}>Toma una foto de tu espacio</Text>
              <Text style={styles.heroSub}>
                Nuestra IA analiza los metros cuadrados, nivel de suciedad y tipo de espacio para darte un precio al instante.
              </Text>
              <View style={styles.heroPills}>
                {['Instantáneo', 'Sin registro', 'IA Claude'].map(t => (
                  <View key={t} style={styles.heroPill}>
                    <Text style={styles.heroPillText}>{t}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          )}

          {/* Imagen seleccionada */}
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              <Pressable style={styles.imageOverlay} onPress={() => { setImageUri(null); setImageB64(null); setResult(null); }}>
                <Ionicons name="close-circle" size={28} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Botones de cámara */}
          {!imageUri && (
            <View style={styles.pickRow}>
              <Pressable style={[styles.pickBtn, Shadow.sm]} onPress={() => pickPhoto(true)}>
                <Ionicons name="camera" size={22} color={Colors.primary} />
                <Text style={styles.pickBtnText}>Tomar foto</Text>
              </Pressable>
              <Pressable style={[styles.pickBtn, Shadow.sm]} onPress={() => pickPhoto(false)}>
                <Ionicons name="images" size={22} color={Colors.primary} />
                <Text style={styles.pickBtnText}>Galería</Text>
              </Pressable>
            </View>
          )}

          {/* Analizar */}
          {imageUri && !result && (
            <Pressable
              style={[styles.analyzeBtn, Shadow.cta, loading && { opacity: 0.7 }]}
              onPress={analyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.analyzeBtnText}>Analizando con IA…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.analyzeBtnText}>Analizar con IA</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Resultado */}
          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultEmoji}>{SERVICE_EMOJI[result.service_type]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultService}>{SERVICE_LABEL[result.service_type]}</Text>
                  <View style={[styles.confidenceBadge, { backgroundColor: CONFIDENCE_COLOR[result.confidence] + '20' }]}>
                    <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLOR[result.confidence] }]} />
                    <Text style={[styles.confidenceText, { color: CONFIDENCE_COLOR[result.confidence] }]}>
                      {CONFIDENCE_LABEL[result.confidence]}
                    </Text>
                  </View>
                </View>
              </View>

              <LinearGradient colors={Gradients.heroPrimary} style={styles.priceBox}>
                <Text style={styles.priceLabel}>Estimado IA</Text>
                <Text style={styles.priceValue}>${fmt(result.price_min)}</Text>
                <Text style={styles.priceRange}>hasta ${fmt(result.price_max)} COP</Text>
              </LinearGradient>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{result.sqm_estimate}</Text>
                  <Text style={styles.statLabel}>m² estimados</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{SERVICE_EMOJI[result.service_type]}</Text>
                  <Text style={styles.statLabel}>{SERVICE_LABEL[result.service_type]}</Text>
                </View>
              </View>

              <View style={styles.reasoningBox}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
                <Text style={styles.reasoningText}>{result.reasoning}</Text>
              </View>

              <View style={styles.resultActions}>
                <Pressable style={styles.retakeBtn} onPress={() => { setImageUri(null); setImageB64(null); setResult(null); }}>
                  <Ionicons name="camera-outline" size={16} color={Colors.ink3} />
                  <Text style={styles.retakeBtnText}>Otra foto</Text>
                </Pressable>
                <Pressable style={[styles.useBtn, Shadow.cta]} onPress={goToEstimate}>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                  <Text style={styles.useBtnText}>Usar este estimado</Text>
                </Pressable>
              </View>
            </View>
          )}

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
  scroll:      { paddingHorizontal: Spacing.xl },

  hero:       { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center',
                gap: Spacing.sm, marginBottom: Spacing.xl },
  heroEmoji:  { fontSize: 48 },
  heroTitle:  { ...Typography.h3, color: '#fff', textAlign: 'center' },
  heroSub:    { ...Typography.small, color: Colors.sky200, textAlign: 'center', lineHeight: 20 },
  heroPills:  { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  heroPill:   { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full,
                paddingVertical: 4, paddingHorizontal: 12 },
  heroPillText:{ ...Typography.caption, color: '#fff', fontWeight: '700' },

  imageContainer: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md, position: 'relative' },
  image:          { width: '100%', aspectRatio: 4 / 3 },
  imageOverlay:   { position: 'absolute', top: 10, right: 10 },

  pickRow:    { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  pickBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.xl,
                paddingVertical: 18, borderWidth: 1.5, borderColor: Colors.primarySoft },
  pickBtnText:{ ...Typography.bodyMed, color: Colors.primary },

  analyzeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.xl,
                    paddingVertical: 16, marginBottom: Spacing.md },
  analyzeBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700', fontSize: 16 },

  errorBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8,
               backgroundColor: Colors.dangerLight, borderRadius: Radius.md, padding: Spacing.md,
               marginBottom: Spacing.md },
  errorText: { ...Typography.small, color: Colors.danger, flex: 1, lineHeight: 18 },

  resultCard:   { backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden',
                  borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
  resultEmoji:  { fontSize: 36 },
  resultService:{ ...Typography.h4, color: Colors.ink },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4,
                     alignSelf: 'flex-start', borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: 8 },
  confidenceDot:   { width: 6, height: 6, borderRadius: 3 },
  confidenceText:  { ...Typography.caption, fontWeight: '700' },

  priceBox:   { padding: Spacing.xl, alignItems: 'center', gap: 4 },
  priceLabel: { ...Typography.small, color: Colors.sky200, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue: { ...Typography.display, color: '#fff' },
  priceRange: { ...Typography.small, color: Colors.sky300 },

  statsRow:    { flexDirection: 'row', padding: Spacing.lg },
  statBox:     { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { ...Typography.h3, color: Colors.ink },
  statLabel:   { ...Typography.caption, color: Colors.ink3 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  reasoningBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6,
                   backgroundColor: Colors.primaryLight, margin: Spacing.md,
                   borderRadius: Radius.md, padding: Spacing.md },
  reasoningText: { ...Typography.small, color: Colors.primary, flex: 1, lineHeight: 18, fontStyle: 'italic' },

  resultActions: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingTop: 0 },
  retakeBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 6, borderRadius: Radius.lg, paddingVertical: 12,
                   borderWidth: 1, borderColor: Colors.border },
  retakeBtnText: { ...Typography.smallBold, color: Colors.ink3 },
  useBtn:        { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                   gap: 6, borderRadius: Radius.lg, paddingVertical: 12, backgroundColor: Colors.primary },
  useBtnText:    { ...Typography.smallBold, color: '#fff' },
});
