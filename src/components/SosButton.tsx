import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Linking, Modal, Pressable,
  StyleSheet, Text, View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../theme';

interface Props {
  bookingId: string;
}

const COUNTDOWN_SECS = 5;
// Número de soporte LimpioGO (WhatsApp)
const SOPORTE_WA = '573100000000';
// Número emergencias Colombia
const EMERGENCIAS = '123';

export function SosButton({ bookingId }: Props) {
  const { profile } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown]       = useState(COUNTDOWN_SECS);
  const [phase, setPhase]               = useState<'confirm' | 'counting' | 'done'>('confirm');
  const [locationText, setLocationText] = useState<string | null>(null);

  const pulse     = useRef(new Animated.Value(1)).current;
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef = useRef(false);

  // Pulso permanente en el botón flotante
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.14, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // Limpiar timer al desmontar
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const openModal = () => {
    cancelRef.current = false;
    setCountdown(COUNTDOWN_SECS);
    setPhase('confirm');
    setLocationText(null);
    setModalVisible(true);
  };

  const cancel = () => {
    cancelRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setModalVisible(false);
  };

  const startCountdown = () => {
    setPhase('counting');
    let secs = COUNTDOWN_SECS;

    timerRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current!);
        if (!cancelRef.current) executeSOSActions();
      }
    }, 1000);
  };

  const executeSOSActions = async () => {
    setPhase('done');

    // 1. Obtener ubicación de alta precisión
    let lat: number | null = null;
    let lng: number | null = null;
    let mapsLink = '';

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
        setLocationText(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch { /* continuar sin ubicación */ }

    // 2. Guardar alerta SOS en DB (también dispara el trigger push al equipo)
    await supabase.from('sos_alerts').insert({
      user_id:    profile!.id,
      booking_id: bookingId,
      lat,
      lng,
    });

    // 3. Mensaje WhatsApp al soporte LimpioGO
    const nombreUsuario = profile?.full_name ?? 'Usuario';
    const waMsg = encodeURIComponent(
      `🚨 *ALERTA SOS — LimpioGO*\n\n` +
      `Usuario: *${nombreUsuario}*\n` +
      `Servicio ID: ${bookingId}\n` +
      (mapsLink ? `📍 Ubicación: ${mapsLink}\n` : '📍 Ubicación no disponible\n') +
      `\nNecesito ayuda urgente.`,
    );
    const waUrl = `https://wa.me/${SOPORTE_WA}?text=${waMsg}`;

    try {
      const canWA = await Linking.canOpenURL(waUrl);
      if (canWA) await Linking.openURL(waUrl);
    } catch { /* WhatsApp no disponible */ }

    // 4. Llamar al 123 (emergencias Colombia)
    // Pequeño delay para que WhatsApp abra primero
    setTimeout(async () => {
      if (cancelRef.current) return;
      try {
        await Linking.openURL(`tel:${EMERGENCIAS}`);
      } catch { /* llamada no disponible */ }
    }, 1500);
  };

  // ─── Pantalla de cuenta regresiva (barra animada)
  const CountdownBar = () => {
    const progress = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: COUNTDOWN_SECS * 1000,
        useNativeDriver: false,
      }).start();
    }, []);
    return (
      <View style={modalStyles.barTrack}>
        <Animated.View
          style={[
            modalStyles.barFill,
            { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    );
  };

  return (
    <>
      {/* Botón flotante */}
      <Animated.View style={[styles.wrap, { transform: [{ scale: pulse }] }]}>
        <Pressable style={[styles.btn, Shadow.lg]} onPress={openModal}>
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.label}>SOS</Text>
        </Pressable>
      </Animated.View>

      {/* Modal SOS */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cancel}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            {/* Ícono */}
            <View style={modalStyles.iconBox}>
              <Ionicons name="warning" size={36} color="#fff" />
            </View>

            {phase === 'confirm' && (
              <>
                <Text style={modalStyles.title}>¿Necesitas ayuda urgente?</Text>
                <Text style={modalStyles.sub}>
                  Al confirmar se ejecutarán estas acciones automáticamente:
                </Text>

                <View style={modalStyles.actionList}>
                  <ActionRow icon="location" text="Se captura y envía tu ubicación en tiempo real" />
                  <ActionRow icon="logo-whatsapp" text="Mensaje automático a soporte LimpioGO por WhatsApp" />
                  <ActionRow icon="call" text={`Llamada al ${EMERGENCIAS} (Emergencias Colombia) en 5 s`} />
                  <ActionRow icon="shield-checkmark" text="Alerta registrada con ID de servicio" />
                </View>

                <Pressable style={modalStyles.confirmBtn} onPress={startCountdown}>
                  <Ionicons name="warning" size={16} color="#fff" />
                  <Text style={modalStyles.confirmBtnText}>Sí, necesito ayuda ahora</Text>
                </Pressable>

                <Pressable style={modalStyles.cancelBtn} onPress={cancel}>
                  <Text style={modalStyles.cancelBtnText}>Cancelar — fue un error</Text>
                </Pressable>
              </>
            )}

            {phase === 'counting' && (
              <>
                <Text style={modalStyles.title}>Activando SOS…</Text>
                <Text style={modalStyles.countdownNum}>{countdown}</Text>
                <CountdownBar />
                <Text style={modalStyles.countdownSub}>
                  Se abrirá WhatsApp y se llamará al {EMERGENCIAS}
                </Text>
                <Pressable style={modalStyles.cancelBtn} onPress={cancel}>
                  <Ionicons name="close-circle-outline" size={16} color={Colors.danger} />
                  <Text style={modalStyles.cancelBtnText}>Cancelar</Text>
                </Pressable>
              </>
            )}

            {phase === 'done' && (
              <>
                <Text style={modalStyles.title}>🚨 SOS Activado</Text>
                <Text style={modalStyles.sub}>
                  {'✅'} Alerta registrada en LimpioGO{'\n'}
                  {'✅'} Mensaje enviado a soporte WhatsApp{'\n'}
                  {'✅'} Llamando al {EMERGENCIAS}…
                  {locationText ? `\n\n📍 Tu ubicación: ${locationText}` : ''}
                </Text>
                <Pressable style={modalStyles.doneBtn} onPress={() => setModalVisible(false)}>
                  <Text style={modalStyles.doneBtnText}>Cerrar</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function ActionRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={modalStyles.actionRow}>
      <View style={modalStyles.actionIcon}>
        <Ionicons name={icon as any} size={14} color={Colors.danger} />
      </View>
      <Text style={modalStyles.actionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { position: 'absolute', bottom: 110, right: 20, zIndex: 99 },
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 5,
           backgroundColor: Colors.danger, borderRadius: Radius.full,
           paddingVertical: 12, paddingHorizontal: 18,
           borderWidth: 2.5, borderColor: '#fff' },
  label: { ...Typography.smallBold, color: '#fff' },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center',
             alignItems: 'center', padding: Spacing.xl },
  sheet:   { width: '100%', backgroundColor: Colors.surface, borderRadius: 24,
             padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },

  iconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.danger,
             alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  title:   { ...Typography.h3, color: Colors.ink, textAlign: 'center' },
  sub:     { ...Typography.small, color: Colors.ink2, textAlign: 'center', lineHeight: 20 },

  actionList: { width: '100%', gap: Spacing.sm, marginVertical: Spacing.sm },
  actionRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  actionIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.dangerLight,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionText: { ...Typography.small, color: Colors.ink2, flex: 1, lineHeight: 18 },

  confirmBtn:     { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: Spacing.sm, backgroundColor: Colors.danger, borderRadius: Radius.xl,
                    paddingVertical: 15 },
  confirmBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
  cancelBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: Spacing.xs, paddingVertical: 10 },
  cancelBtnText:  { ...Typography.small, color: Colors.danger, fontWeight: '600' },

  // Countdown
  countdownNum: { fontSize: 72, fontWeight: '800', color: Colors.danger, lineHeight: 80 },
  countdownSub: { ...Typography.small, color: Colors.ink3, textAlign: 'center' },
  barTrack:     { width: '100%', height: 8, backgroundColor: Colors.dangerLight,
                  borderRadius: 4, overflow: 'hidden' },
  barFill:      { height: '100%', backgroundColor: Colors.danger, borderRadius: 4 },

  // Done
  doneBtn:     { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.xl,
                 paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
