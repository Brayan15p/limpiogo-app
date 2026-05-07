import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors, Gradients, Radius, Shadow, Spacing, Typography } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  proName?: string;
}

export function FirstBookingModal({ visible, onClose, proName }: Props) {
  const confettiRef = useRef<any>(null);
  const scaleAnim   = useRef(new Animated.Value(0.7)).current;

  const onShow = () => {
    confettiRef.current?.start();
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onShow={onShow} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ConfettiCannon
          ref={confettiRef}
          count={180}
          origin={{ x: 200, y: -20 }}
          autoStart={false}
          fadeOut
          colors={['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']}
        />
        <Animated.View style={[styles.card, Shadow.lg, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={Gradients.heroPrimary} style={styles.topGrad}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.gradTitle}>¡Primer servicio completado!</Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.congrats}>
              ¡Felicidades! Acabas de completar tu primer servicio con LimpioGO.
              {proName ? ` ${proName.split(' ')[0]} hizo un trabajo increíble.` : ''}
            </Text>

            <View style={styles.benefitsBox}>
              {[
                { icon: 'star',            text: 'Ahora eres parte de la familia LimpioGO' },
                { icon: 'wallet-outline',  text: '100 LimpioCoins acreditados a tu cuenta' },
                { icon: 'refresh-circle',  text: 'Agenda el próximo con 1 toque' },
              ].map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name={b.icon as any} size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.benefitText}>{b.text}</Text>
                </View>
              ))}
            </View>

            <Pressable style={[styles.cta, Shadow.cta]} onPress={onClose}>
              <Text style={styles.ctaText}>¡Genial, gracias!</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
                alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card:       { width: '100%', borderRadius: Radius.xxl, overflow: 'hidden', backgroundColor: '#fff' },
  topGrad:    { paddingVertical: Spacing.xxl, alignItems: 'center', gap: Spacing.sm },
  trophy:     { fontSize: 56 },
  gradTitle:  { ...Typography.h3, color: '#fff', textAlign: 'center' },
  body:       { padding: Spacing.xl, gap: Spacing.lg },
  congrats:   { ...Typography.body, color: Colors.ink2, textAlign: 'center', lineHeight: 22 },
  benefitsBox:{ gap: Spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  benefitIcon:{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight,
                alignItems: 'center', justifyContent: 'center' },
  benefitText:{ ...Typography.small, color: Colors.ink2, flex: 1, lineHeight: 18 },
  cta:        { backgroundColor: Colors.primary, borderRadius: Radius.xl,
                paddingVertical: 15, alignItems: 'center' },
  ctaText:    { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
