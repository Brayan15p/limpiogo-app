import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated, Keyboard, KeyboardAvoidingView, Modal,
  Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../theme';

type Props = {
  visible: boolean;
  jobId: string;
  proId: string;
  proName: string;
  onDone: () => void;
  onDismiss: () => void;
};

const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!'];

export function ReviewSheet({ visible, jobId, proId, proName, onDone, onDismiss }: Props) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Animaciones por estrella
  const scales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const tapStar = (n: number) => {
    setRating(n);
    // Bouncy scale en la estrella tocada
    Animated.sequence([
      Animated.spring(scales[n - 1], { toValue: 1.4, useNativeDriver: true, speed: 50 }),
      Animated.spring(scales[n - 1], { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
  };

  const submit = async () => {
    if (!profile || rating === 0) return;
    setLoading(true);
    Keyboard.dismiss();

    const { error } = await supabase.from('reviews').insert({
      job_id:      jobId,
      reviewer_id: profile.id,
      reviewed_id: proId,
      rating,
      comment: comment.trim() || null,
    });

    if (!error) {
      // Actualizar rating promedio en el perfil del pro
      await supabase.rpc('update_pro_rating', { pro_uuid: proId });
      setDone(true);
    }
    setLoading(false);
  };

  const reset = () => {
    setRating(0);
    setComment('');
    setDone(false);
  };

  const handleDone = () => {
    reset();
    onDone();
  };

  const handleDismiss = () => {
    reset();
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDismiss}>
      <Pressable style={styles.overlay} onPress={handleDismiss} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>

          {/* Handle */}
          <View style={styles.handle} />

          {done ? (
            /* ── Estado: review enviada ── */
            <View style={styles.successBox}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={36} color="#fff" />
              </View>
              <Text style={styles.successTitle}>¡Gracias por calificar!</Text>
              <Text style={styles.successSub}>
                Tu opinión ayuda a mantener la calidad de LimpioGO.
              </Text>
              <Pressable style={styles.doneBtn} onPress={handleDone}>
                <Text style={styles.doneBtnText}>Listo</Text>
              </Pressable>
            </View>
          ) : (
            /* ── Formulario ── */
            <>
              <Text style={styles.title}>¿Cómo estuvo el servicio?</Text>
              <Text style={styles.sub}>{proName}</Text>

              {/* Estrellas */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable key={n} onPress={() => tapStar(n)} hitSlop={8}>
                    <Animated.View style={{ transform: [{ scale: scales[n - 1] }] }}>
                      <Ionicons
                        name={n <= rating ? 'star' : 'star-outline'}
                        size={44}
                        color={n <= rating ? Colors.warn : Colors.ink4}
                      />
                    </Animated.View>
                  </Pressable>
                ))}
              </View>

              {/* Label dinámico */}
              <Text style={[styles.ratingLabel, rating > 0 && { color: Colors.warn }]}>
                {rating > 0 ? LABELS[rating] : 'Toca para calificar'}
              </Text>

              {/* Comentario opcional */}
              <TextInput
                style={styles.textarea}
                placeholder="Cuéntanos más (opcional)"
                placeholderTextColor={Colors.ink4}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={300}
              />
              <Text style={styles.charCount}>{comment.length}/300</Text>

              {/* Botón submit */}
              <Pressable
                style={[styles.submitBtn, (rating === 0 || loading) && styles.submitBtnDisabled]}
                onPress={submit}
                disabled={rating === 0 || loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? 'Enviando…' : 'Enviar calificación'}
                </Text>
              </Pressable>

              <Pressable onPress={handleDismiss} style={styles.skip}>
                <Text style={styles.skipText}>Ahora no</Text>
              </Pressable>
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  kav:          { justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
                  paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xl,
                  ...Shadow.lg },
  handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.ink4,
                  alignSelf: 'center', marginBottom: Spacing.xl },

  title:        { ...Typography.h3, color: Colors.ink, textAlign: 'center' },
  sub:          { ...Typography.body, color: Colors.ink3, textAlign: 'center', marginTop: 4,
                  marginBottom: Spacing.xl },

  starsRow:     { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md,
                  marginBottom: Spacing.sm },
  ratingLabel:  { ...Typography.bodyMed, color: Colors.ink4, textAlign: 'center',
                  marginBottom: Spacing.xl, height: 22 },

  textarea:     { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
                  padding: Spacing.md, ...Typography.body, color: Colors.ink,
                  minHeight: 80, textAlignVertical: 'top' },
  charCount:    { ...Typography.caption, color: Colors.ink4, textAlign: 'right',
                  marginTop: 4, marginBottom: Spacing.lg },

  submitBtn:         { backgroundColor: Colors.primary, borderRadius: Radius.md,
                       paddingVertical: 15, alignItems: 'center', ...Shadow.cta },
  submitBtnDisabled: { backgroundColor: Colors.ink4, shadowOpacity: 0 },
  submitBtnText:     { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  skip:         { alignItems: 'center', marginTop: Spacing.md, paddingVertical: 8 },
  skipText:     { ...Typography.small, color: Colors.ink3 },

  // Estado éxito
  successBox:    { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.lg },
  successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.ok,
                   alignItems: 'center', justifyContent: 'center' },
  successTitle:  { ...Typography.h3, color: Colors.ink },
  successSub:    { ...Typography.body, color: Colors.ink3, textAlign: 'center',
                   paddingHorizontal: Spacing.xl },
  doneBtn:       { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 14,
                   paddingHorizontal: Spacing.xxxl, ...Shadow.cta },
  doneBtnText:   { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
