import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable, ScrollView,
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

function fmt(n: number) { return n.toLocaleString('es-CO'); }

interface ScanResult {
  sqm_estimate: number;
  service_type: string;
  price_min: number;
  price_max: number;
  confidence: string;
  reasoning: string;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: Colors.ok, medium: Colors.warn, low: Colors.danger,
};
const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Alta precisión', medium: 'Estimado', low: 'Baja confianza',
};

const TIPS = [
  { icon: 'sunny-outline',    text: 'Buena iluminación — abre cortinas o prende la luz' },
  { icon: 'expand-outline',   text: 'Captura toda la habitación de una esquina a la otra' },
  { icon: 'phone-portrait-outline', text: 'Sostén el teléfono en horizontal para más área' },
];

export function ARScanScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ScanResult | null>(null);
  const [error, setError]       = useState<string | null>(null);

  const capture = async (fromCamera: boolean) => {
    const perms = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perms.status !== 'granted') {
      Alert.alert('Permiso requerido', fromCamera
        ? 'Necesitamos acceso a la cámara para escanear tu espacio.'
        : 'Necesitamos acceso a tu galería.');
      return;
    }
    const picker = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const res = await picker({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setImageUri(asset.uri);
    setImageB64(asset.base64 ?? null);
    setResult(null);
    setError(null);
  };

  const analyze = async () => {
    if (!imageB64) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('estimate-from-photo', {
        body: { image_base64: imageB64 },
      });
      if (fnErr || !data) throw new Error(fnErr?.message ?? 'Sin respuesta');
      setResult(data as ScanResult);
    } catch (e: any) {
      setError('No pudimos analizar la imagen. Intenta con mejor iluminación o encuadre.');
    } finally {
      setLoading(false);
    }
  };

  const goEstimate = () => {
    if (!result) return;
    navigation.navigate('Estimate', {
      prefilterType: result.service_type,
      prefilterSqm:  result.sqm_estimate,
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
          <Text style={styles.headerTitle}>Escanear espacio</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero o foto capturada */}
          {imageUri ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              <Pressable style={styles.retakeBtn} onPress={() => { setImageUri(null); setImageB64(null); setResult(null); }}>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.retakeTxt}>Nueva foto</Text>
              </Pressable>
            </View>
          ) : (
            <LinearGradient colors={Gradients.heroPrimary} style={styles.hero}>
              <Text style={styles.heroIcon}>📐</Text>
              <Text style={styles.heroTitle}>IA mide tu espacio</Text>
              <Text style={styles.heroSub}>
                Toma una foto de tu habitación y la IA estimará los m² y el servicio ideal.
              </Text>
            </LinearGradient>
          )}

          {/* Botones de captura */}
          {!imageUri && (
            <>
              <View style={styles.captureRow}>
                <Pressable style={[styles.captureBtn, Shadow.sm]} onPress={() => capture(true)}>
                  <Ionicons name="camera" size={22} color={Colors.primary} />
                  <Text style={styles.captureTxt}>Cámara</Text>
                </Pressable>
                <Pressable style={[styles.captureBtn, Shadow.sm]} onPress={() => capture(false)}>
                  <Ionicons name="images" size={22} color={Colors.primary} />
                  <Text style={styles.captureTxt}>Galería</Text>
                </Pressable>
              </View>

              {/* Tips */}
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>Tips para mejor resultado</Text>
                {TIPS.map((t, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={styles.tipIcon}>
                      <Ionicons name={t.icon as any} size={16} color={Colors.primary} />
                    </View>
                    <Text style={styles.tipText}>{t.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Analizar */}
          {imageUri && !result && (
            <Pressable
              style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
              onPress={analyze}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.analyzeTxt}>Analizando con IA…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="scan" size={20} color="#fff" />
                  <Text style={styles.analyzeTxt}>Analizar espacio</Text>
                </>
              )}
            </Pressable>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          {/* Resultado */}
          {result && (
            <View style={[styles.resultCard, Shadow.card]}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Resultado del escaneo</Text>
                <View style={[styles.confidenceBadge, { backgroundColor: CONFIDENCE_COLOR[result.confidence] + '20' }]}>
                  <View style={[styles.confidenceDot, { backgroundColor: CONFIDENCE_COLOR[result.confidence] }]} />
                  <Text style={[styles.confidenceTxt, { color: CONFIDENCE_COLOR[result.confidence] }]}>
                    {CONFIDENCE_LABEL[result.confidence]}
                  </Text>
                </View>
              </View>

              <View style={styles.resultGrid}>
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatVal}>{result.sqm_estimate}</Text>
                  <Text style={styles.resultStatLabel}>m² estimados</Text>
                </View>
                <View style={styles.resultDivider} />
                <View style={styles.resultStat}>
                  <Text style={styles.resultStatVal}>
                    {SERVICE_EMOJI[result.service_type]} {SERVICE_LABEL[result.service_type]}
                  </Text>
                  <Text style={styles.resultStatLabel}>Servicio sugerido</Text>
                </View>
              </View>

              <LinearGradient colors={Gradients.heroPrimary} style={styles.priceGrad}>
                <Text style={styles.priceLabel}>Rango de precio estimado</Text>
                <Text style={styles.priceValue}>${fmt(result.price_min)} – ${fmt(result.price_max)}</Text>
                <Text style={styles.priceSub}>COP · precio final se acuerda con el pro</Text>
              </LinearGradient>

              {result.reasoning ? (
                <View style={styles.reasoningBox}>
                  <Ionicons name="information-circle-outline" size={15} color={Colors.ink3} />
                  <Text style={styles.reasoningTxt}>{result.reasoning}</Text>
                </View>
              ) : null}

              <Pressable style={[styles.goBtn, Shadow.cta]} onPress={goEstimate}>
                <Ionicons name="calculator-outline" size={18} color="#fff" />
                <Text style={styles.goBtnTxt}>Ver cotización completa</Text>
              </Pressable>

              <Pressable style={styles.searchBtn} onPress={() => navigation.navigate('Search', {
                prefilterBudget: result.price_min,
                prefilterType: result.service_type,
              })}>
                <Ionicons name="search" size={16} color={Colors.primary} />
                <Text style={styles.searchBtnTxt}>Buscar pros para este precio</Text>
              </Pressable>
            </View>
          )}

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
  back:   { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
            alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { ...Typography.h4, color: Colors.ink },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },

  hero:      { borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center',
               gap: Spacing.sm, marginBottom: Spacing.xl },
  heroIcon:  { fontSize: 52 },
  heroTitle: { ...Typography.h3, color: '#fff', textAlign: 'center' },
  heroSub:   { ...Typography.small, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },

  captureRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  captureBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.xl,
                paddingVertical: 18, borderWidth: 1.5, borderColor: Colors.primarySoft },
  captureTxt: { ...Typography.bodyMed, color: Colors.primary, fontWeight: '700' },

  tipsCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
               gap: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  tipsTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.xs },
  tipRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tipIcon:   { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryLight,
               alignItems: 'center', justifyContent: 'center' },
  tipText:   { ...Typography.small, color: Colors.ink2, flex: 1, lineHeight: 18 },

  imageWrap: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.xl,
               position: 'relative', height: 220 },
  image:     { width: '100%', height: '100%' },
  retakeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md,
               flexDirection: 'row', alignItems: 'center', gap: 5,
               backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radius.full,
               paddingVertical: 7, paddingHorizontal: 14 },
  retakeTxt: { ...Typography.caption, color: '#fff', fontWeight: '700' },

  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.xl,
                paddingVertical: 18, marginBottom: Spacing.lg, ...Shadow.cta },
  analyzeTxt: { ...Typography.bodyMed, color: '#fff', fontWeight: '700', fontSize: 16 },

  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
              backgroundColor: Colors.dangerLight, borderRadius: Radius.lg,
              padding: Spacing.lg, marginBottom: Spacing.lg },
  errorTxt: { ...Typography.small, color: Colors.danger, flex: 1, lineHeight: 18 },

  resultCard:   { backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden',
                  borderWidth: 1, borderColor: Colors.border },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  padding: Spacing.xl, paddingBottom: Spacing.md },
  resultTitle:  { ...Typography.h4, color: Colors.ink },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5,
                     borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10 },
  confidenceDot:   { width: 7, height: 7, borderRadius: 4 },
  confidenceTxt:   { ...Typography.caption, fontWeight: '700' },

  resultGrid:    { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: 0 },
  resultStat:    { flex: 1, alignItems: 'center', gap: 4 },
  resultStatVal: { ...Typography.h3, color: Colors.ink },
  resultStatLabel:{ ...Typography.caption, color: Colors.ink3 },
  resultDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },

  priceGrad:  { padding: Spacing.xl, alignItems: 'center', gap: 4 },
  priceLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5 },
  priceValue: { ...Typography.h2, color: '#fff' },
  priceSub:   { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },

  reasoningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
                  padding: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 0 },
  reasoningTxt: { ...Typography.caption, color: Colors.ink3, flex: 1, lineHeight: 16 },

  goBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
              backgroundColor: Colors.primary, margin: Spacing.xl, marginBottom: Spacing.sm,
              borderRadius: Radius.xl, paddingVertical: 16 },
  goBtnTxt: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  searchBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                  marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
                  paddingVertical: 12 },
  searchBtnTxt: { ...Typography.small, color: Colors.primary, fontWeight: '700' },
});
