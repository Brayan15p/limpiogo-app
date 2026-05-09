import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Linking, Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../../theme';

const COVERAGE = [
  { icon: 'cube-outline',          text: 'Daños accidentales a objetos del hogar' },
  { icon: 'home-outline',          text: 'Daños en pisos, paredes o muebles' },
  { icon: 'diamond-outline',       text: 'Pérdida de objetos de valor durante el servicio' },
  { icon: 'medkit-outline',        text: 'Lesiones accidentales del profesional en tu hogar' },
];

const STEPS = [
  { n: '1', text: 'Completa tu servicio con un pro verificado LimpioGO' },
  { n: '2', text: 'Si ocurre un incidente, repórtalo en 24h desde la app' },
  { n: '3', text: 'LimpioGO abre el caso con nuestra aseguradora' },
  { n: '4', text: 'Resolución en máximo 5 días hábiles' },
];

export function InsuranceScreen({ navigation, route }: any) {
  const { jobId } = (route?.params ?? {}) as { jobId?: string };

  const reportIncident = () => {
    if (jobId) {
      navigation.navigate('Dispute', { jobId });
    } else {
      Linking.openURL('mailto:seguros@limpiogo.co?subject=Reporte%20de%20incidente');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={Gradients.heroPrimary} style={styles.hero}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.shieldWrap}>
            <Ionicons name="shield-checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Seguro LimpioGO</Text>
          <Text style={styles.heroSub}>Todos los servicios están protegidos</Text>
          <View style={styles.heroPill}>
            <Ionicons name="cash-outline" size={14} color={Colors.sky200} />
            <Text style={styles.heroPillTxt}>Cobertura hasta $2.000.000 COP por servicio</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Qué cubre */}
          <View style={[styles.card, Shadow.card]}>
            <Text style={styles.cardTitle}>¿Qué cubre?</Text>
            {COVERAGE.map(c => (
              <View key={c.text} style={styles.coverRow}>
                <View style={styles.coverIcon}>
                  <Ionicons name={c.icon as any} size={16} color={Colors.ok} />
                </View>
                <Text style={styles.coverText}>{c.text}</Text>
              </View>
            ))}
          </View>

          {/* Qué NO cubre */}
          <View style={[styles.card, Shadow.card]}>
            <Text style={styles.cardTitle}>¿Qué no cubre?</Text>
            {[
              'Daños previos al servicio no reportados',
              'Objetos de valor no informados al pro al inicio',
              'Servicios realizados fuera de la plataforma LimpioGO',
            ].map(text => (
              <View key={text} style={styles.coverRow}>
                <View style={[styles.coverIcon, { backgroundColor: Colors.dangerLight }]}>
                  <Ionicons name="close" size={14} color={Colors.danger} />
                </View>
                <Text style={styles.coverText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Cómo funciona */}
          <View style={[styles.card, Shadow.card]}>
            <Text style={styles.cardTitle}>¿Cómo funciona?</Text>
            {STEPS.map(s => (
              <View key={s.n} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumTxt}>{s.n}</Text>
                </View>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            ))}
          </View>

          {/* Nota legal */}
          <View style={styles.legalBox}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.ink3} />
            <Text style={styles.legalText}>
              El seguro es gestionado por LimpioGO en alianza con aseguradora certificada.
              Aplican términos y condiciones. La cobertura se activa automáticamente al confirmar el servicio.
            </Text>
          </View>

          {/* CTAs */}
          <Pressable style={[styles.reportBtn, Shadow.cta]} onPress={reportIncident}>
            <Ionicons name="alert-circle-outline" size={16} color="#fff" />
            <Text style={styles.reportBtnTxt}>Reportar un incidente</Text>
          </Pressable>

          <Pressable
            style={styles.conditionsBtn}
            onPress={() => Linking.openURL('https://limpiogo.app/seguro-terminos')}
          >
            <Text style={styles.conditionsBtnTxt}>Ver condiciones completas</Text>
            <Ionicons name="open-outline" size={13} color={Colors.primary} />
          </Pressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  hero:   { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxl,
            alignItems: 'center', gap: Spacing.sm },
  back:   { alignSelf: 'flex-start', width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  shieldWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  heroTitle:  { ...Typography.h2, color: '#fff' },
  heroSub:    { ...Typography.body, color: 'rgba(255,255,255,0.8)' },
  heroPill:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: Radius.full, paddingVertical: 6, paddingHorizontal: 14, marginTop: Spacing.sm },
  heroPillTxt:{ ...Typography.small, color: Colors.sky100, fontWeight: '600' },

  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.xxxl, gap: Spacing.lg },
  card:   { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
            borderWidth: 1, borderColor: Colors.sky100 },
  cardTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.xs },

  coverRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  coverIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.okLight,
               alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  coverText: { ...Typography.small, color: Colors.ink2, flex: 1, lineHeight: 18 },

  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stepNum:    { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumTxt: { ...Typography.smallBold, color: Colors.primary },
  stepText:   { ...Typography.small, color: Colors.ink2, flex: 1, lineHeight: 18 },

  legalBox:  { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.surfaceAlt,
               borderRadius: Radius.md, padding: Spacing.md, alignItems: 'flex-start' },
  legalText: { ...Typography.caption, color: Colors.ink3, flex: 1, lineHeight: 16 },

  reportBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                  backgroundColor: Colors.danger, borderRadius: Radius.xl, paddingVertical: 15 },
  reportBtnTxt: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
  conditionsBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                  paddingVertical: 12 },
  conditionsBtnTxt: { ...Typography.small, color: Colors.primary, fontWeight: '600' },
});
