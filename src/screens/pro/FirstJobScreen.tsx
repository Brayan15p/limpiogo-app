import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import {
  Animated, Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';

export const FIRST_JOB_KEY = 'pro_first_job_seen';

const STEPS = [
  {
    icon: 'bag-check-outline',
    title: 'Revisa los detalles',
    desc: 'Lee bien el tipo de servicio, m², extras y notas del cliente antes de llegar.',
    color: Colors.primary,
  },
  {
    icon: 'camera-outline',
    title: 'Foto ANTES obligatoria',
    desc: 'Al llegar, toma la foto de "antes" en la app. Sin esta foto no podrás marcar el servicio como completado.',
    color: Colors.warn,
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Comunícate por el chat',
    desc: 'Cualquier duda o cambio, comunícalo por el chat de la app. Queda registrado y protege a ambas partes.',
    color: Colors.ok,
  },
  {
    icon: 'camera-reverse-outline',
    title: 'Foto DESPUÉS al terminar',
    desc: 'Toma la foto final y presiona "Marcar listo". El cliente recibirá la comparativa automáticamente.',
    color: Colors.primary,
  },
  {
    icon: 'star-outline',
    title: 'Solicita la calificación',
    desc: 'Un buen rating aumenta tu visibilidad. Si el cliente quedó feliz, recuérdale calificarte.',
    color: Colors.warn,
  },
];

export function FirstJobScreen({ navigation }: any) {
  const [step, setStep]           = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const videoRef     = useRef<Video>(null);

  const goNext = async () => {
    if (step < STEPS.length - 1) {
      Animated.timing(progressAnim, {
        toValue: (step + 1) / (STEPS.length - 1),
        duration: 300,
        useNativeDriver: false,
      }).start();
      setStep(s => s + 1);
    } else {
      await SecureStore.setItemAsync(FIRST_JOB_KEY, '1');
      navigation.goBack();
    }
  };

  const current = STEPS[step];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={Gradients.heroPrimary} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.skip}>
              <Text style={styles.skipTxt}>Omitir</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Tu primer trabajo</Text>
            <Text style={styles.stepCounter}>{step + 1}/{STEPS.length}</Text>
          </View>
          {/* Barra de progreso */}
          <View style={styles.barTrack}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Video tutorial (solo en step 0) */}
        {step === 0 && (
          <View style={styles.videoWrap}>
            <Video
              ref={videoRef}
              source={{ uri: 'https://limpiogo.app/tutorial-pro.mp4' }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={false}
            />
            <View style={styles.videoOverlay}>
              <Pressable
                style={styles.playBtn}
                onPress={() => {
                  setVideoPlaying(p => !p);
                  videoPlaying ? videoRef.current?.pauseAsync() : videoRef.current?.playAsync();
                }}
              >
                <Ionicons name={videoPlaying ? 'pause' : 'play'} size={32} color="#fff" />
              </Pressable>
              <View style={styles.videoPill}>
                <Text style={styles.videoPillTxt}>Tutorial · 2 min</Text>
              </View>
            </View>
          </View>
        )}

        {/* Card del paso actual */}
        <View style={[styles.card, Shadow.card]}>
          <View style={[styles.iconCircle, { backgroundColor: current.color + '20' }]}>
            <Ionicons name={current.icon as any} size={32} color={current.color} />
          </View>
          <Text style={styles.stepTitle}>{current.title}</Text>
          <Text style={styles.stepDesc}>{current.desc}</Text>
        </View>

        {/* Todos los pasos como checklist */}
        <View style={[styles.checklistCard, Shadow.sm]}>
          <Text style={styles.checklistTitle}>Checklist completo</Text>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.checkRow}>
              <View style={[
                styles.checkDot,
                i < step && styles.checkDotDone,
                i === step && styles.checkDotActive,
              ]}>
                {i < step
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={[styles.checkDotNum, i === step && { color: '#fff' }]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.checkText, i < step && styles.checkTextDone, i === step && styles.checkTextActive]}>
                {s.title}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Botón continuar */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Pressable style={[styles.nextBtn, Shadow.cta]} onPress={goNext}>
          <Text style={styles.nextBtnTxt}>
            {step < STEPS.length - 1 ? 'Siguiente' : '¡Entendido, estoy listo!'}
          </Text>
          <Ionicons name={step < STEPS.length - 1 ? 'arrow-forward' : 'checkmark-circle'} size={18} color="#fff" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               paddingVertical: Spacing.sm },
  headerTitle: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
  skip:        { paddingVertical: 4, paddingHorizontal: 8 },
  skipTxt:     { ...Typography.small, color: 'rgba(255,255,255,0.7)' },
  stepCounter: { ...Typography.small, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  barTrack:    { height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2,
                 marginTop: Spacing.sm, overflow: 'hidden' },
  barFill:     { height: '100%', backgroundColor: '#fff', borderRadius: 2 },

  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },

  videoWrap:    { borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: Colors.dark, aspectRatio: 16 / 9 },
  video:        { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playBtn:      { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center', justifyContent: 'center' },
  videoPill:    { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.55)',
                  borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10 },
  videoPillTxt: { ...Typography.caption, color: '#fff' },

  card:       { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
                alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.sky100 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  stepTitle:  { ...Typography.h3, color: Colors.ink, textAlign: 'center' },
  stepDesc:   { ...Typography.body, color: Colors.ink2, textAlign: 'center', lineHeight: 22 },

  checklistCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl,
                    gap: Spacing.md, borderWidth: 1, borderColor: Colors.sky100 },
  checklistTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.xs },
  checkRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkDot:       { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkDotDone:   { backgroundColor: Colors.ok, borderColor: Colors.ok },
  checkDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkDotNum:    { ...Typography.caption, color: Colors.ink3, fontWeight: '700' },
  checkText:      { ...Typography.small, color: Colors.ink3 },
  checkTextDone:  { color: Colors.ok, textDecorationLine: 'line-through' },
  checkTextActive:{ color: Colors.primary, fontWeight: '700' },

  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0,
                paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: Colors.bg },
  nextBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 16 },
  nextBtnTxt: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
