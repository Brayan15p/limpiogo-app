import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import {
  Alert, Image, Modal, Pressable, Share,
  StyleSheet, Text, View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Colors, Gradients, Radius, Spacing, Typography } from '../theme';

interface Props {
  visible: boolean;
  before: string;
  after: string;
  proName: string;
  serviceLabel: string;
  onClose: () => void;
}

export function BeforeAfterCard({ visible, before, after, proName, serviceLabel, onClose }: Props) {
  const shotRef = useRef<ViewShot>(null);

  const shareCard = async () => {
    try {
      const uri = await (shotRef.current as any).capture();
      await Share.share({
        url: uri,
        message: `¡Mi hogar limpísimo gracias a ${proName} en LimpioGO! 🏠✨ Descarga la app: limpiogo.app`,
        title: 'Mi transformación LimpioGO',
      });
    } catch {
      Alert.alert('Error', 'No se pudo generar la imagen para compartir.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>¡Comparte tu transformación!</Text>
          <Text style={styles.sub}>Genera una tarjeta para Stories</Text>

          {/* Tarjeta capturada */}
          <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 0.95 }} style={styles.card}>
            <LinearGradient colors={Gradients.heroPrimary} style={styles.cardGradient}>
              {/* Fotos */}
              <View style={styles.photosRow}>
                <View style={styles.photoBox}>
                  <Image source={{ uri: before }} style={styles.photo} resizeMode="cover" />
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoLabelText}>ANTES</Text>
                  </View>
                </View>
                <View style={styles.dividerBox}>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
                  </View>
                </View>
                <View style={styles.photoBox}>
                  <Image source={{ uri: after }} style={styles.photo} resizeMode="cover" />
                  <View style={[styles.photoLabel, styles.photoLabelAfter]}>
                    <Text style={styles.photoLabelText}>DESPUÉS</Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardProLabel}>Limpiado por</Text>
                  <Text style={styles.cardProName}>{proName}</Text>
                  <Text style={styles.cardService}>{serviceLabel}</Text>
                </View>
                <View style={styles.brandBox}>
                  <Text style={styles.brandIcon}>🏠</Text>
                  <Text style={styles.brandName}>LimpioGO</Text>
                </View>
              </View>
            </LinearGradient>
          </ViewShot>

          {/* Acciones */}
          <Pressable style={styles.shareBtn} onPress={shareCard}>
            <Ionicons name="share-social" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Compartir en Stories</Text>
          </Pressable>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:   {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 36, gap: Spacing.md, alignItems: 'center',
  },
  title: { ...Typography.h3, color: Colors.ink },
  sub:   { ...Typography.small, color: Colors.ink3, marginTop: -Spacing.sm },

  card:         { width: '100%', borderRadius: Radius.xl, overflow: 'hidden' },
  cardGradient: { padding: Spacing.lg, gap: Spacing.md },

  photosRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  photoBox:  { flex: 1, position: 'relative', borderRadius: Radius.lg, overflow: 'hidden' },
  photo:     { width: '100%', aspectRatio: 3 / 4 },
  photoLabel: {
    position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8,
  },
  photoLabelAfter: { backgroundColor: Colors.primary },
  photoLabelText: { ...Typography.micro, color: '#fff', fontWeight: '800', letterSpacing: 1 },

  dividerBox:  { alignItems: 'center', justifyContent: 'center' },
  arrowCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },

  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardProLabel:{ ...Typography.micro, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  cardProName: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
  cardService: { ...Typography.small, color: 'rgba(255,255,255,0.8)' },
  brandBox:    { alignItems: 'center', gap: 2 },
  brandIcon:   { fontSize: 22 },
  brandName:   { ...Typography.caption, color: '#fff', fontWeight: '800', letterSpacing: 1 },

  shareBtn:     {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 15,
  },
  shareBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
  closeBtn:     { paddingVertical: 10 },
  closeBtnText: { ...Typography.small, color: Colors.ink3 },
});
