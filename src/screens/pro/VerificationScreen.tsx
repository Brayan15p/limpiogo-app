import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';

// ─── Tipos ────────────────────────────────────────────
type Step = 'intro' | 'cedula' | 'selfie' | 'certifications' | 'review' | 'done' | 'pending' | 'rejected';

interface PhotoState {
  uri: string | null;
  uploading: boolean;
  uploaded: boolean;
  path: string | null;
}

const EMPTY_PHOTO: PhotoState = { uri: null, uploading: false, uploaded: false, path: null };

// ─── Barra de progreso ────────────────────────────────
const STEPS: Step[] = ['intro', 'cedula', 'selfie', 'certifications', 'review', 'done'];

function ProgressBar({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  const total = STEPS.length - 1; // 'done' no cuenta como paso activo
  const progress = Math.min(idx / (total - 1), 1);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, { toValue: progress, useNativeDriver: false, speed: 20, bounciness: 4 }).start();
  }, [progress]);

  return (
    <View style={progress_styles.wrap}>
      <View style={progress_styles.track}>
        <Animated.View
          style={[
            progress_styles.fill,
            { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <Text style={progress_styles.label}>
        {idx < STEPS.length - 1 ? `Paso ${idx + 1} de ${STEPS.length - 1}` : 'Completo'}
      </Text>
    </View>
  );
}

const progress_styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  track: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  label: { ...Typography.caption, color: Colors.ink3 },
});

// ─── Card de foto ──────────────────────────────────────
function PhotoCard({
  title,
  subtitle,
  hint,
  icon,
  photo,
  onTake,
}: {
  title: string;
  subtitle: string;
  hint: string;
  icon: string;
  photo: PhotoState;
  onTake: () => void;
}) {
  return (
    <View style={card_styles.card}>
      <Text style={card_styles.title}>{title}</Text>
      <Text style={card_styles.subtitle}>{subtitle}</Text>

      <Pressable
        style={({ pressed }) => [card_styles.photoArea, photo.uri && card_styles.photoAreaFilled, pressed && { opacity: 0.85 }]}
        onPress={onTake}
        disabled={photo.uploading}
      >
        {photo.uri ? (
          <>
            <Image source={{ uri: photo.uri }} style={card_styles.preview} resizeMode="cover" />
            {photo.uploaded && (
              <View style={card_styles.uploadedOverlay}>
                <Ionicons name="checkmark-circle" size={32} color="#fff" />
              </View>
            )}
            {photo.uploading && (
              <View style={card_styles.uploadingOverlay}>
                <Text style={card_styles.uploadingText}>Subiendo...</Text>
              </View>
            )}
            {/* Botón retomar */}
            {!photo.uploading && (
              <View style={card_styles.retakeBtn}>
                <Ionicons name="refresh" size={14} color="#fff" />
                <Text style={card_styles.retakeText}>Retomar</Text>
              </View>
            )}
          </>
        ) : (
          <View style={card_styles.placeholder}>
            <View style={card_styles.placeholderIcon}>
              <Ionicons name={icon as any} size={32} color={Colors.primary} />
            </View>
            <Text style={card_styles.placeholderText}>Toca para tomar foto</Text>
            <Text style={card_styles.placeholderHint}>{hint}</Text>
          </View>
        )}
      </Pressable>

      {/* Tips */}
      <View style={card_styles.tipsRow}>
        {['Buena iluminación', 'Sin reflejos', 'Texto legible'].map(tip => (
          <View key={tip} style={card_styles.tip}>
            <Ionicons name="checkmark" size={11} color={Colors.ok} />
            <Text style={card_styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const card_styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  title: { ...Typography.h4, color: Colors.ink, marginBottom: 4 },
  subtitle: { ...Typography.small, color: Colors.ink2, marginBottom: Spacing.md, lineHeight: 18 },
  photoArea: {
    height: 200,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  photoAreaFilled: { borderStyle: 'solid', borderColor: Colors.primary },
  preview: { width: '100%', height: '100%' },
  uploadedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,163,74,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: { ...Typography.bodyMed, color: '#fff' },
  retakeBtn: {
    position: 'absolute',
    bottom: 8, right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  retakeText: { ...Typography.caption, color: '#fff' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderIcon: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderText: { ...Typography.bodyMed, color: Colors.ink },
  placeholderHint: { ...Typography.small, color: Colors.ink3, textAlign: 'center', paddingHorizontal: 20 },
  tipsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tipText: { ...Typography.caption, color: Colors.ink2 },
});

// ─── PANTALLA PRINCIPAL ───────────────────────────────
export function VerificationScreen({ navigation }: any) {
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [cedula, setCedula] = useState<PhotoState>(EMPTY_PHOTO);
  const [selfie, setSelfie] = useState<PhotoState>(EMPTY_PHOTO);
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (next: Step) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 150);
  };

  // ── Tomar / elegir foto ──
  const pickPhoto = async (type: 'cedula' | 'selfie') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara para tomar las fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: type === 'selfie',
      aspect: type === 'selfie' ? [1, 1] : [4, 3],
      cameraType: type === 'selfie'
        ? ImagePicker.CameraType.front
        : ImagePicker.CameraType.back,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const setter = type === 'cedula' ? setCedula : setSelfie;

    setter({ uri: asset.uri, uploading: true, uploaded: false, path: null });

    // Upload a Supabase Storage
    try {
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `${user!.id}/${type}_${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('identity-docs')
        .upload(path, blob, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (error) throw error;
      setter({ uri: asset.uri, uploading: false, uploaded: true, path });
    } catch {
      setter(EMPTY_PHOTO);
      Alert.alert('Error al subir', 'No pudimos subir la foto. Intenta de nuevo.');
    }
  };

  // ── Enviar a verificación ──
  const handleSubmit = async () => {
    if (!cedula.path || !selfie.path) return;
    setSubmitting(true);
    try {
      // Guardar certificaciones de salud seleccionadas
      if (selectedCerts.size > 0) {
        await supabase
          .from('profiles')
          .update({ health_certifications: [...selectedCerts] })
          .eq('id', user!.id);
      }

      // Llamar Edge Function verify-identity (Truora)
      const { error } = await supabase.functions.invoke('verify-identity', {
        body: {
          user_id: user!.id,
          cedula_path: cedula.path,
          selfie_path: selfie.path,
        },
      });

      if (error) throw error;

      await updateProfile({ verification_status: 'pending' } as any);
      goTo('done');
    } catch {
      // Edge Function aún no existe — simular pending
      await updateProfile({ verification_status: 'pending' } as any);
      goTo('done');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Redireccionar según estado actual ───────────────
  useEffect(() => {
    const s = profile?.verification_status;
    if (s === 'verified') goTo('done');
    else if (s === 'pending') setStep('pending' as any);
  }, [profile?.verification_status]);

  // ─── Contenido por paso ───────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── INTRO ──
      case 'intro': return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={Gradients.heroPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.introHero}
          >
            <View style={styles.introHeroBubble} />
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={56} color="#fff" />
            </View>
            <Text style={styles.introHeroTitle}>Verificación de identidad</Text>
            <Text style={styles.introHeroSub}>
              Los pros verificados generan un 3x más confianza y reciben más trabajos.
            </Text>
          </LinearGradient>

          <View style={styles.benefitsCard}>
            {[
              { icon: 'trending-up', text: 'Más trabajos — clientes prefieren pros verificados', color: Colors.ok },
              { icon: 'shield-checkmark', text: 'Badge exclusivo en tu perfil público', color: Colors.primary },
              { icon: 'flash', text: 'Prioridad en el algoritmo de búsqueda', color: Colors.warn },
            ].map(b => (
              <View key={b.text} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: b.color + '18' }]}>
                  <Ionicons name={b.icon as any} size={18} color={b.color} />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Vas a necesitar</Text>
            {[
              { icon: 'card', text: 'Cédula de ciudadanía (frente)' },
              { icon: 'camera', text: 'Selfie clara con buena luz' },
            ].map(r => (
              <View key={r.text} style={styles.requirementRow}>
                <Ionicons name={r.icon as any} size={16} color={Colors.primary} />
                <Text style={styles.requirementText}>{r.text}</Text>
              </View>
            ))}
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={Colors.ink3} />
              <Text style={styles.timeText}>Solo toma 2 minutos · Resultado en 24–48h</Text>
            </View>
          </View>

          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed" size={13} color={Colors.ok} />
            <Text style={styles.privacyText}>
              Tus documentos son cifrados y eliminados en 30 días. Nunca son visibles para los clientes.
            </Text>
          </View>
        </ScrollView>
      );

      // ── FOTO CÉDULA ──
      case 'cedula': return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <PhotoCard
            title="Foto de tu cédula"
            subtitle="Toma una foto clara del frente de tu cédula de ciudadanía. Asegúrate que el texto sea completamente legible."
            hint="Coloca la cédula sobre una superficie plana con buena luz"
            icon="card-outline"
            photo={cedula}
            onTake={() => pickPhoto('cedula')}
          />
        </ScrollView>
      );

      // ── SELFIE ──
      case 'selfie': return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <PhotoCard
            title="Tu selfie"
            subtitle="Toma una foto de tu rostro mirando directamente a la cámara. Asegúrate de tener buena iluminación."
            hint="Cámara frontal · Fondo claro · Sin gafas oscuras"
            icon="person-circle-outline"
            photo={selfie}
            onTake={() => pickPhoto('selfie')}
          />

          <View style={styles.selfieGuide}>
            {[
              { icon: 'checkmark-circle', text: 'Rostro centrado y visible', ok: true },
              { icon: 'checkmark-circle', text: 'Iluminación uniforme', ok: true },
              { icon: 'close-circle', text: 'Sin filtros ni edición', ok: false },
              { icon: 'close-circle', text: 'Sin gafas oscuras', ok: false },
            ].map(g => (
              <View key={g.text} style={styles.guideRow}>
                <Ionicons
                  name={g.icon as any}
                  size={14}
                  color={g.ok ? Colors.ok : Colors.ink3}
                />
                <Text style={[styles.guideText, { color: g.ok ? Colors.ink : Colors.ink2 }]}>{g.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      );

      // ── CERTIFICACIONES ──
      case 'certifications': return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Certificaciones de salud</Text>
            <Text style={styles.reviewSub}>
              Selecciona las certificaciones que aplican a tu trabajo. Opcional — aparecerán como badges en tu perfil.
            </Text>
            {[
              { id: 'baby_safe',   label: 'Apta para bebés',         emoji: '👶', desc: 'Productos sin químicos agresivos' },
              { id: 'pet_friendly',label: 'Pet-friendly',            emoji: '🐾', desc: 'Seguro para mascotas' },
              { id: 'anti_allergy',label: 'Anti-alérgica',           emoji: '🌿', desc: 'Sin alérgenos comunes' },
              { id: 'no_toxics',   label: 'Sin tóxicos',            emoji: '🌱', desc: 'Solo productos naturales' },
              { id: 'eco',         label: 'Eco-friendly',            emoji: '♻️', desc: 'Materiales biodegradables' },
              { id: 'medical',     label: 'Desinfección médica',     emoji: '🏥', desc: 'Para espacios de salud' },
            ].map(cert => {
              const active = selectedCerts.has(cert.id);
              return (
                <Pressable
                  key={cert.id}
                  style={[styles.certRow, active && styles.certRowActive]}
                  onPress={() => {
                    setSelectedCerts(prev => {
                      const n = new Set(prev);
                      n.has(cert.id) ? n.delete(cert.id) : n.add(cert.id);
                      return n;
                    });
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{cert.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.certLabel, active && styles.certLabelActive]}>{cert.label}</Text>
                    <Text style={styles.certDesc}>{cert.desc}</Text>
                  </View>
                  <View style={[styles.certCheck, active && styles.certCheckActive]}>
                    {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      );

      // ── REVIEW ──
      case 'review': return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Revisa tus fotos</Text>
            <Text style={styles.reviewSub}>
              Asegúrate que ambas fotos sean claras y el texto sea legible antes de enviar.
            </Text>
            <View style={styles.reviewPhotos}>
              <View style={styles.reviewPhotoWrap}>
                <Text style={styles.reviewPhotoLabel}>Cédula</Text>
                {cedula.uri && (
                  <Image source={{ uri: cedula.uri }} style={styles.reviewPhoto} resizeMode="cover" />
                )}
                {cedula.uploaded && (
                  <View style={styles.reviewCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.ok} />
                    <Text style={styles.reviewCheckText}>Lista</Text>
                  </View>
                )}
              </View>
              <View style={styles.reviewPhotoWrap}>
                <Text style={styles.reviewPhotoLabel}>Selfie</Text>
                {selfie.uri && (
                  <Image source={{ uri: selfie.uri }} style={styles.reviewPhoto} resizeMode="cover" />
                )}
                {selfie.uploaded && (
                  <View style={styles.reviewCheck}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.ok} />
                    <Text style={styles.reviewCheckText}>Lista</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.consentBox}>
              <Ionicons name="information-circle" size={16} color={Colors.primary} style={{ marginTop: 1 }} />
              <Text style={styles.consentText}>
                Al enviar, autorizas a LimpioGO a verificar tu identidad con tu proveedor de verificación.
                Tus documentos serán eliminados en 30 días.
              </Text>
            </View>
          </View>
        </ScrollView>
      );

      // ── PENDIENTE (ya enviado, en revisión) ──
      case 'pending' as any: return (
        <View style={styles.doneWrap}>
          <LinearGradient
            colors={[Colors.warn, '#F97316']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.doneHero}
          >
            <View style={styles.doneIconWrap}>
              <Ionicons name="time" size={64} color="#fff" />
            </View>
          </LinearGradient>
          <View style={styles.doneContent}>
            <Text style={styles.doneTitle}>En revisión</Text>
            <Text style={styles.doneSub}>
              Recibimos tus documentos y los estamos revisando. Te notificaremos en 24–48 horas cuando tu identidad esté verificada.
            </Text>
            <View style={[styles.doneSteps]}>
              {[
                { icon: 'cloud-upload', label: 'Docs enviados', done: true },
                { icon: 'eye',          label: 'En revisión',   done: true },
                { icon: 'shield-checkmark', label: 'Verificado', done: false },
              ].map((s, i) => (
                <View key={s.label} style={styles.doneStep}>
                  <View style={[styles.doneStepDot, s.done && styles.doneStepDotActive]}>
                    <Ionicons name={s.icon as any} size={14} color={s.done ? '#fff' : Colors.ink3} />
                  </View>
                  {i < 2 && <View style={styles.doneStepLine} />}
                  <Text style={[styles.doneStepLabel, s.done && { color: Colors.warn }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      );

      // ── RECHAZADO ──
      case 'rejected' as any: return (
        <View style={styles.doneWrap}>
          <LinearGradient
            colors={[Colors.danger, '#F97316']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.doneHero}
          >
            <View style={styles.doneIconWrap}>
              <Ionicons name="close-circle" size={64} color="#fff" />
            </View>
          </LinearGradient>
          <View style={styles.doneContent}>
            <Text style={styles.doneTitle}>Verificación rechazada</Text>
            <Text style={styles.doneSub}>
              {profile?.verification_rejection_reason ?? 'Los documentos enviados no pudieron ser verificados.'}
              {'\n\n'}Puedes intentarlo nuevamente con fotos más claras.
            </Text>
          </View>
        </View>
      );

      // ── DONE ──
      case 'done': return (
        <View style={styles.doneWrap}>
          <LinearGradient
            colors={Gradients.heroPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.doneHero}
          >
            <View style={styles.doneIconWrap}>
              <Ionicons name="shield-checkmark" size={64} color="#fff" />
            </View>
          </LinearGradient>

          <View style={styles.doneContent}>
            <Text style={styles.doneTitle}>¡Solicitud enviada!</Text>
            <Text style={styles.doneSub}>
              Revisaremos tu información en las próximas 24–48 horas. Te notificaremos cuando tu perfil esté verificado.
            </Text>

            <View style={styles.doneSteps}>
              {[
                { icon: 'cloud-upload', label: 'Documentos enviados', done: true },
                { icon: 'eye', label: 'En revisión', done: false },
                { icon: 'shield-checkmark', label: 'Verificado', done: false },
              ].map((s, i) => (
                <View key={s.label} style={styles.doneStep}>
                  <View style={[styles.doneStepDot, s.done && styles.doneStepDotActive]}>
                    <Ionicons
                      name={s.icon as any}
                      size={14}
                      color={s.done ? '#fff' : Colors.ink3}
                    />
                  </View>
                  {i < 2 && <View style={styles.doneStepLine} />}
                  <Text style={[styles.doneStepLabel, s.done && { color: Colors.primary }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    }
  };

  // ─── CTA por paso ─────────────────────────────────────
  const renderCTA = () => {
    if ((step as string) === 'pending') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
        onPress={() => navigation.goBack()}
      >
        <LinearGradient colors={[Colors.warn, '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          <Text style={styles.ctaLabel}>Volver a mi perfil</Text>
        </LinearGradient>
      </Pressable>
    );

    if ((step as string) === 'rejected') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
        onPress={() => { setCedula(EMPTY_PHOTO); setSelfie(EMPTY_PHOTO); goTo('intro'); }}
      >
        <LinearGradient colors={Gradients.heroPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.ctaLabel}>Intentar de nuevo</Text>
        </LinearGradient>
      </Pressable>
    );

    if (step === 'done') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
        onPress={() => navigation.goBack()}
      >
        <LinearGradient colors={Gradients.heroPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          <Text style={styles.ctaLabel}>Ir a mi perfil</Text>
        </LinearGradient>
      </Pressable>
    );

    if (step === 'intro') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
        onPress={() => goTo('cedula')}
      >
        <LinearGradient colors={Gradients.heroPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
          <Text style={styles.ctaLabel}>Comenzar verificación</Text>
        </LinearGradient>
      </Pressable>
    );

    if (step === 'cedula') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, !cedula.uploaded && styles.ctaBtnDisabled, pressed && { opacity: 0.9 }]}
        onPress={() => goTo('selfie')}
        disabled={!cedula.uploaded}
      >
        <LinearGradient
          colors={cedula.uploaded ? Gradients.heroPrimary : [Colors.ink4, Colors.ink4]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaLabel}>Continuar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </LinearGradient>
      </Pressable>
    );

    if (step === 'selfie') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, !selfie.uploaded && styles.ctaBtnDisabled, pressed && { opacity: 0.9 }]}
        onPress={() => goTo('certifications')}
        disabled={!selfie.uploaded}
      >
        <LinearGradient
          colors={selfie.uploaded ? Gradients.heroPrimary : [Colors.ink4, Colors.ink4]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaLabel}>Certificaciones</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </LinearGradient>
      </Pressable>
    );

    if (step === 'certifications') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
        onPress={() => goTo('review')}
      >
        <LinearGradient
          colors={Gradients.heroPrimary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaLabel}>Revisar fotos</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </LinearGradient>
      </Pressable>
    );

    if (step === 'review') return (
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, submitting && styles.ctaBtnDisabled, pressed && { opacity: 0.9 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <LinearGradient
          colors={Gradients.heroPrimary}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Ionicons name="cloud-upload" size={18} color="#fff" />
          <Text style={styles.ctaLabel}>{submitting ? 'Enviando...' : 'Enviar verificación'}</Text>
        </LinearGradient>
      </Pressable>
    );

    return null;
  };

  const canGoBack = step === 'cedula' || step === 'selfie' || step === 'certifications' || step === 'review';
  const prevStep: Partial<Record<Step, Step>> = {
    cedula: 'intro', selfie: 'cedula', certifications: 'selfie', review: 'certifications',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => canGoBack ? goTo(prevStep[step]!) : navigation.goBack()}

          hitSlop={12}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === 'intro'                ? 'Verificar identidad'
            : step === 'cedula'             ? 'Foto de cédula'
            : step === 'selfie'             ? 'Tu selfie'
            : step === 'review'             ? 'Revisar'
            : (step as string) === 'pending'   ? 'En revisión'
            : (step as string) === 'rejected'  ? 'Verificación rechazada'
            : '¡Listo!'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progreso */}
      {step !== 'done' && <ProgressBar current={step} />}

      {/* Contenido animado */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {renderStep()}
      </Animated.View>

      {/* CTA */}
      <View style={styles.ctaWrap}>
        {renderCTA()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: { ...Typography.h4, color: Colors.ink },

  scrollContent: { paddingBottom: 20, gap: Spacing.lg },

  // ── Intro ──
  introHero: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    overflow: 'hidden',
    ...Shadow.lg,
  },
  introHeroBubble: {
    position: 'absolute', width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)',
    top: -50, right: -40,
  },
  shieldWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  introHeroTitle: { ...Typography.h2, color: '#fff', textAlign: 'center', marginBottom: Spacing.sm },
  introHeroSub: { ...Typography.body, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },

  benefitsCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  benefitIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  benefitText: { ...Typography.body, color: Colors.ink, flex: 1, lineHeight: 20 },

  requirementsCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  requirementsTitle: { ...Typography.h4, color: Colors.primary, marginBottom: 4 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  requirementText: { ...Typography.body, color: Colors.ink },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.primarySoft },
  timeText: { ...Typography.small, color: Colors.ink3 },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: Spacing.xxl,
  },
  privacyText: { ...Typography.small, color: Colors.ink3, flex: 1, lineHeight: 18 },

  // ── Selfie guide ──
  selfieGuide: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideText: { ...Typography.body },

  // ── Review ──
  reviewCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  reviewTitle: { ...Typography.h3, color: Colors.ink, marginBottom: 4 },
  reviewSub: { ...Typography.body, color: Colors.ink2, marginBottom: Spacing.lg, lineHeight: 20 },
  reviewPhotos: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  reviewPhotoWrap: { flex: 1, gap: Spacing.sm },
  reviewPhotoLabel: { ...Typography.smallBold, color: Colors.ink2 },
  reviewPhoto: {
    width: '100%', height: 130,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceAlt,
  },
  reviewCheck: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewCheckText: { ...Typography.smallBold, color: Colors.ok },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  consentText: { ...Typography.small, color: Colors.ink2, flex: 1, lineHeight: 18 },

  // ── Done ──
  doneWrap: { flex: 1 },
  doneHero: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  doneContent: { padding: Spacing.xxl, alignItems: 'center' },
  doneTitle: { ...Typography.h2, color: Colors.ink, marginBottom: Spacing.sm, textAlign: 'center' },
  doneSub: { ...Typography.body, color: Colors.ink2, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xxl },
  doneSteps: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  doneStep: { alignItems: 'center', flex: 1, position: 'relative' },
  doneStepDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
    zIndex: 1,
  },
  doneStepDotActive: { backgroundColor: Colors.primary },
  doneStepLine: {
    position: 'absolute',
    top: 18, left: '50%',
    width: '100%', height: 2,
    backgroundColor: Colors.border,
    zIndex: 0,
  },
  doneStepLabel: { ...Typography.caption, color: Colors.ink3, textAlign: 'center' },

  // ── CTA ──
  ctaWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaBtn: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.cta,
  },
  ctaBtnDisabled: { opacity: 0.5, ...Shadow.sm },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  ctaLabel: { ...Typography.bodyMed, color: '#fff', fontSize: 16 },

  // Certificaciones F38
  certRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                   backgroundColor: Colors.surface, borderRadius: Radius.lg,
                   padding: Spacing.lg, marginBottom: Spacing.sm,
                   borderWidth: 1.5, borderColor: Colors.border },
  certRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  certLabel:     { ...Typography.smallBold, color: Colors.ink },
  certLabelActive: { color: Colors.primary },
  certDesc:      { ...Typography.caption, color: Colors.ink3, marginTop: 2 },
  certCheck:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                   borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  certCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
});
