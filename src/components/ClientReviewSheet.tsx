import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Animated, Modal, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../theme';

interface Props {
  visible: boolean;
  jobId: string;
  clientId: string;
  clientName: string;
  onDone: () => void;
  onDismiss: () => void;
}

export function ClientReviewSheet({ visible, jobId, clientId, clientName, onDone, onDismiss }: Props) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const starAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;

  const tapStar = (idx: number) => {
    setRating(idx + 1);
    Animated.sequence([
      Animated.timing(starAnims[idx], { toValue: 1.5, duration: 100, useNativeDriver: true }),
      Animated.spring(starAnims[idx],  { toValue: 1,   useNativeDriver: true }),
    ]).start();
  };

  const submit = async () => {
    if (rating === 0) return;
    setLoading(true);
    await supabase
      .from('jobs')
      .update({ client_rating: rating, client_review: comment || null })
      .eq('id', jobId);

    // Recalcula client_score via RPC
    await supabase.rpc('update_client_score', { p_client_id: clientId });

    setLoading(false);
    setDone(true);
    setTimeout(() => { setDone(false); setRating(0); setComment(''); onDone(); }, 1200);
  };

  const LABELS = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {done ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={52} color={Colors.ok} />
            <Text style={styles.successTitle}>¡Gracias por tu reseña!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Califica al cliente</Text>
            <Text style={styles.subtitle}>{clientName}</Text>

            <View style={styles.starsRow}>
              {[0, 1, 2, 3, 4].map(i => (
                <Pressable key={i} onPress={() => tapStar(i)}>
                  <Animated.View style={{ transform: [{ scale: starAnims[i] }] }}>
                    <Ionicons
                      name={rating > i ? 'star' : 'star-outline'}
                      size={40}
                      color={rating > i ? Colors.warn : Colors.ink4}
                    />
                  </Animated.View>
                </Pressable>
              ))}
            </View>

            {rating > 0 && (
              <Text style={styles.ratingLabel}>{LABELS[rating - 1]}</Text>
            )}

            <View style={styles.criteriaRow}>
              {['Puntualidad', 'Acceso', 'Respeto'].map(c => (
                <View key={c} style={styles.criteriaPill}>
                  <Text style={styles.criteriaText}>{c}</Text>
                </View>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Comentario opcional..."
              placeholderTextColor={Colors.ink3}
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />

            <Pressable
              style={[styles.btn, rating === 0 && styles.btnDisabled, Shadow.cta]}
              onPress={submit}
              disabled={rating === 0 || loading}
            >
              <Text style={styles.btnText}>{loading ? 'Guardando…' : 'Enviar reseña'}</Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:   {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    padding: Spacing.xl, paddingBottom: 40, alignItems: 'center', gap: Spacing.md,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.ink4, marginBottom: Spacing.sm,
  },
  title:    { ...Typography.h3, color: Colors.ink },
  subtitle: { ...Typography.body, color: Colors.ink2, marginTop: -Spacing.sm },

  starsRow:    { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.sm },
  ratingLabel: { ...Typography.bodyMed, color: Colors.warn, fontWeight: '700' },

  criteriaRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  criteriaPill:{ backgroundColor: Colors.primaryLight, borderRadius: Radius.full,
                 paddingVertical: 5, paddingHorizontal: 14 },
  criteriaText:{ ...Typography.small, color: Colors.primary, fontWeight: '600' },

  input: {
    width: '100%', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg,
    padding: Spacing.md, ...Typography.body, color: Colors.ink,
    borderWidth: 1, borderColor: Colors.border, minHeight: 72, textAlignVertical: 'top',
  },

  btn:         { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.xl,
                 paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { backgroundColor: Colors.ink4 },
  btnText:     { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },

  successBox:  { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  successTitle:{ ...Typography.h3, color: Colors.ink },
});
