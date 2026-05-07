import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Colors, Radius, Shadow, Typography } from '../theme';

interface Props {
  bookingId: string;
}

export function SosButton({ bookingId }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const pulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const trigger = () => {
    Alert.alert(
      '🚨 Botón SOS',
      '¿Confirmas que necesitas ayuda urgente? Se enviará tu ubicación al equipo de soporte.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'SÍ, pedir ayuda',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            let lat: number | undefined;
            let lng: number | undefined;

            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                lat = loc.coords.latitude;
                lng = loc.coords.longitude;
              }
            } catch { /* ubicación no disponible, igual enviamos */ }

            await supabase.from('sos_alerts').insert({
              user_id: profile!.id,
              booking_id: bookingId,
              lat: lat ?? null,
              lng: lng ?? null,
            });
            setLoading(false);
            setSent(true);
            Alert.alert('🚨 Alerta enviada', 'Nuestro equipo fue notificado y te contactará de inmediato.');
          },
        },
      ],
    );
  };

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale: pulse }] }]}>
      <Pressable style={[styles.btn, sent && styles.btnSent, Shadow.lg]} onPress={trigger} disabled={loading || sent}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <><Ionicons name="warning" size={18} color="#fff" />
             <Text style={styles.label}>{sent ? 'SOS enviado' : 'SOS'}</Text></>
        }
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap:    { position: 'absolute', bottom: 110, right: 20, zIndex: 99 },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 5,
             backgroundColor: Colors.danger, borderRadius: Radius.full,
             paddingVertical: 12, paddingHorizontal: 18, borderWidth: 2, borderColor: '#fff' },
  btnSent: { backgroundColor: Colors.ink3 },
  label:   { ...Typography.smallBold, color: '#fff' },
});
