import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert, Animated, Linking, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

type FAQ = { q: string; a: string };

const FAQS: FAQ[] = [
  { q: '¿Cómo agendo un servicio?', a: 'Ve a "Inicio", elige el tipo de limpieza que necesitas, selecciona fecha y hora, y elige tu dirección. Recibirás ofertas de pros disponibles en minutos.' },
  { q: '¿Cómo sé que el pro es confiable?', a: 'Todos nuestros profesionales pasan por verificación de identidad y antecedentes. Los marcados con el sello azul ✓ son pros verificados con calificaciones reales de otros clientes.' },
  { q: '¿Qué pasa si necesito cancelar?', a: 'Puedes cancelar hasta 2 horas antes del servicio sin costo. Cancelaciones posteriores pueden generar un cargo del 20%. Ve a "Mis servicios" para gestionar tu reserva.' },
  { q: '¿Cómo funciona el pago?', a: 'Los pagos se procesan de forma segura a través de Wompi. Puedes pagar con tarjeta débito/crédito, PSE o Nequi. El cobro se realiza al confirmar el servicio.' },
  { q: '¿El pro trae sus implementos?', a: 'Sí, todos los pros llegan con sus propios implementos de limpieza. Si tienes preferencia por algún producto específico, puedes comunicarlo por el chat antes del servicio.' },
  { q: '¿Puedo dejar una reseña?', a: 'Al finalizar cada servicio, recibirás una notificación para calificar al pro con estrellas y un comentario opcional. Las reseñas ayudan a toda la comunidad.' },
  { q: '¿Cómo funciona el seguimiento en tiempo real?', a: 'Una vez el pro confirme que está en camino, podrás ver su ubicación en tiempo real en el mapa. Esta función requiere que el pro tenga el GPS activado.' },
  { q: 'Soy un pro, ¿cómo recibo pagos?', a: 'Los pagos se depositan automáticamente a tu cuenta bancaria registrada cada semana. Puedes ver tu historial de ganancias en la pestaña "Ganancias".' },
];

const CHANNELS = [
  { icon: 'chatbubble-ellipses', label: 'Chat en vivo',    sub: 'Lun–Vie 8am–8pm',  color: Colors.primary,  action: () => Alert.alert('Chat en vivo', 'Esta función estará disponible pronto.') },
  { icon: 'mail',                label: 'Enviar correo',   sub: 'soporte@limpiogo.co', color: Colors.sky500,  action: () => Linking.openURL('mailto:soporte@limpiogo.co') },
  { icon: 'logo-whatsapp',       label: 'WhatsApp',        sub: '+57 310 000 0000',  color: Colors.ok,       action: () => Linking.openURL('https://wa.me/573100000000') },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  const anim = useState(new Animated.Value(0))[0];

  const toggle = () => {
    const toValue = open ? 0 : 1;
    setOpen(!open);
    Animated.spring(anim, { toValue, useNativeDriver: false, speed: 20 }).start();
  };

  const maxHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });
  const iconRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={styles.faqItem}>
      <Pressable style={styles.faqQuestion} onPress={toggle}>
        <Text style={styles.faqQ}>{faq.q}</Text>
        <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
          <Ionicons name="chevron-down" size={16} color={Colors.ink3} />
        </Animated.View>
      </Pressable>
      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <Text style={styles.faqA}>{faq.a}</Text>
      </Animated.View>
    </View>
  );
}

export function SupportScreen({ navigation }: any) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        <LinearGradient colors={[Colors.sky100, Colors.sky50]} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <Text style={styles.headerTitle}>Ayuda y soporte</Text>
            <View style={{ width: 38 }} />
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero */}
          <LinearGradient colors={[Colors.primarySoft, Colors.sky100]} style={styles.heroCard}>
            <Text style={styles.heroEmoji}>🙋</Text>
            <Text style={styles.heroTitle}>¿En qué podemos ayudarte?</Text>
            <Text style={styles.heroSub}>Estamos aquí para resolver tus dudas y asegurarnos de que tengas la mejor experiencia.</Text>
          </LinearGradient>

          {/* Canales de contacto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contáctanos</Text>
            {CHANNELS.map((ch, i) => (
              <Pressable key={i} style={[styles.channelCard, Shadow.sm]} onPress={ch.action}>
                <View style={[styles.channelIcon, { backgroundColor: ch.color + '20' }]}>
                  <Ionicons name={ch.icon as any} size={22} color={ch.color} />
                </View>
                <View style={styles.channelText}>
                  <Text style={styles.channelLabel}>{ch.label}</Text>
                  <Text style={styles.channelSub}>{ch.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.ink4} />
              </Pressable>
            ))}
          </View>

          {/* FAQ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
            <View style={[styles.faqCard, Shadow.sm]}>
              {FAQS.map((faq, i) => (
                <View key={i}>
                  {i > 0 && <View style={styles.faqDivider} />}
                  <FAQItem faq={faq} />
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="heart" size={14} color={Colors.danger} />
            <Text style={styles.footerText}> Hecho con amor en Colombia · v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header:    { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn:   { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  headerTitle: { flex: 1, ...Typography.h3, color: Colors.ink, textAlign: 'center', marginRight: 38 },

  scroll: { padding: Spacing.xl, paddingBottom: 40 },

  heroCard:  { borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.xxl, borderWidth: 1, borderColor: Colors.sky200 },
  heroEmoji: { fontSize: 48, marginBottom: Spacing.md },
  heroTitle: { ...Typography.h3, color: Colors.ink, textAlign: 'center', marginBottom: Spacing.sm },
  heroSub:   { ...Typography.body, color: Colors.ink2, textAlign: 'center', lineHeight: 22 },

  section:      { marginBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.md },

  channelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.sky100 },
  channelIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  channelText: { flex: 1 },
  channelLabel:{ ...Typography.bodyMed, color: Colors.ink },
  channelSub:  { ...Typography.small, color: Colors.ink3, marginTop: 2 },

  faqCard:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.sky100 },
  faqDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  faqItem:    { padding: Spacing.lg },
  faqQuestion:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ:       { ...Typography.bodyMed, color: Colors.ink, flex: 1, marginRight: Spacing.md, lineHeight: 22 },
  faqA:       { ...Typography.body, color: Colors.ink2, lineHeight: 22, marginTop: Spacing.md },

  footer:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.md },
  footerText: { ...Typography.small, color: Colors.ink4 },
});
