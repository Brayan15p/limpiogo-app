import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, FlatList, NativeScrollEvent,
  NativeSyntheticEvent, Pressable, StatusBar,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

const { width: W } = Dimensions.get('window');

export const ONBOARDING_KEY = 'limpiogo_onboarding_done';

type Slide = {
  key: string;
  icon: string;
  iconBg: string;
  accentColor: string;
  title: string;
  highlight: string; // palabra a resaltar dentro del título
  sub: string;
  tag: string;
};

const SLIDES: Slide[] = [
  {
    key:         'clean',
    icon:        'sparkles',
    iconBg:      Colors.primarySoft,
    accentColor: Colors.primary,
    title:       'Tu casa,\nimpecable',
    highlight:   'impecable',
    sub:         'Agenda una limpieza profesional desde tu celular. Sin llamadas, sin filas, sin estrés.',
    tag:         'Para ti',
  },
  {
    key:         'pros',
    icon:        'shield-checkmark',
    iconBg:      Colors.okLight,
    accentColor: Colors.ok,
    title:       'Pros\nverificados',
    highlight:   'verificados',
    sub:         'Todos nuestros limpiadores pasan por verificación de identidad, referencias y calificación de clientes.',
    tag:         'Confianza',
  },
  {
    key:         'fast',
    icon:        'flash',
    iconBg:      Colors.warnLight,
    accentColor: Colors.warn,
    title:       'En minutos,\nno en días',
    highlight:   'minutos',
    sub:         'Publica tu servicio y recibe ofertas de pros cercanos en menos de 10 minutos.',
    tag:         'Rapidez',
  },
];

export function OnboardingScreen({ navigation }: any) {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIdx(idx);
  };

  const next = () => {
    if (activeIdx < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIdx + 1, animated: true });
    } else {
      finish();
    }
  };

  const finish = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    navigation.replace('Welcome');
  };

  const isLast = activeIdx === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>

        {/* Skip */}
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          {!isLast && (
            <Pressable onPress={finish} hitSlop={12} style={styles.skipBtn}>
              <Text style={styles.skipText}>Saltar</Text>
            </Pressable>
          )}
        </View>

        {/* Slides */}
        <Animated.FlatList
          ref={flatRef}
          data={SLIDES}
          keyExtractor={s => s.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: onScroll,
          })}
          scrollEventThrottle={16}
          renderItem={({ item }) => <SlideItem slide={item} />}
        />

        {/* Dots + botón */}
        <View style={styles.footer}>
          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((s, i) => {
              const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
              const width = scrollX.interpolate({
                inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp',
              });
              const bg = SLIDES[activeIdx].accentColor;
              return (
                <Animated.View
                  key={s.key}
                  style={[styles.dot, { width, opacity, backgroundColor: bg }]}
                />
              );
            })}
          </View>

          {/* Botón */}
          <Pressable
            style={[styles.nextBtn, { backgroundColor: SLIDES[activeIdx].accentColor }, Shadow.cta]}
            onPress={next}
          >
            {isLast ? (
              <>
                <Text style={styles.nextBtnText}>Empezar ahora</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            ) : (
              <>
                <Text style={styles.nextBtnText}>Siguiente</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}

function SlideItem({ slide }: { slide: Slide }) {
  // Animación de entrada suave del icono
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  // Dividir título en palabras para resaltar la keyword
  const titleParts = slide.title.split(slide.highlight);

  return (
    <View style={styles.slide}>
      {/* Tag pill */}
      <View style={[styles.tagPill, { backgroundColor: slide.iconBg }]}>
        <Text style={[styles.tagText, { color: slide.accentColor }]}>{slide.tag}</Text>
      </View>

      {/* Icono grande */}
      <Animated.View
        style={[
          styles.iconWrap,
          { backgroundColor: slide.iconBg, transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Ionicons name={slide.icon as any} size={64} color={slide.accentColor} />
      </Animated.View>

      {/* Título */}
      <Text style={styles.slideTitle}>
        {titleParts[0]}
        <Text style={[styles.slideTitleAccent, { color: slide.accentColor }]}>
          {slide.highlight}
        </Text>
        {titleParts[1]}
      </Text>

      {/* Subtítulo */}
      <Text style={styles.slideSub}>{slide.sub}</Text>

      {/* Feature pills */}
      <FeaturePills slide={slide} />
    </View>
  );
}

const FEATURES: Record<string, string[]> = {
  clean: ['Básica', 'Profunda', 'Mudanza', 'Oficinas'],
  pros:  ['ID verificada', 'Con reseñas', 'Calificados', 'Asegurados'],
  fast:  ['Sin llamadas', 'Chat directo', 'Pago seguro', 'Tracking'],
};

function FeaturePills({ slide }: { slide: Slide }) {
  const pills = FEATURES[slide.key] ?? [];
  return (
    <View style={styles.pillsRow}>
      {pills.map(p => (
        <View key={p} style={[styles.pill, { borderColor: slide.accentColor + '40' }]}>
          <Ionicons name="checkmark" size={11} color={slide.accentColor} />
          <Text style={[styles.pillText, { color: slide.accentColor }]}>{p}</Text>
        </View>
      ))}
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  topBar:        { flexDirection: 'row', justifyContent: 'flex-end',
                   paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  topBarSpacer:  { flex: 1 },
  skipBtn:       { paddingVertical: 6, paddingHorizontal: Spacing.sm },
  skipText:      { ...Typography.bodyMed, color: Colors.ink3 },

  slide: {
    width: W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl * 1.5,
    gap: Spacing.lg,
  },

  tagPill:  { borderRadius: Radius.full, paddingVertical: 5, paddingHorizontal: 14 },
  tagText:  { ...Typography.caption, fontWeight: '800', letterSpacing: 1 },

  iconWrap: { width: 128, height: 128, borderRadius: 36,
              alignItems: 'center', justifyContent: 'center' },

  slideTitle:       { ...Typography.h1, color: Colors.ink, textAlign: 'center', lineHeight: 40 },
  slideTitleAccent: { fontWeight: '800' },
  slideSub:         { ...Typography.body, color: Colors.ink3, textAlign: 'center', lineHeight: 24 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full,
              borderWidth: 1, paddingVertical: 5, paddingHorizontal: 10 },
  pillText: { ...Typography.caption, fontWeight: '700' },

  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: Spacing.lg },
  dots:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot:    { height: 8, borderRadius: 4 },

  nextBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                 gap: Spacing.sm, borderRadius: Radius.xl, paddingVertical: 16 },
  nextBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700', fontSize: 16 },
});
