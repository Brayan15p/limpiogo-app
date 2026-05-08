import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { VerifiedBadge } from '../../components/VerifiedBadge';

const NOTIF_KEY = 'limpiogo_notif_enabled';

type MenuItem = {
  icon: string;
  label: string;
  sub?: string;
  action?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
};

export function ProfileScreen({ navigation }: any) {
  const { profile, signOut, updateProfile } = useAuth();
  const [notifications, setNotificationsState] = useState(true);
  const [location, setLocationState] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const isPro = profile?.role === 'pro';
  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? 'U';
  const name = profile?.full_name ?? 'Usuario';

  // Cargar preferencias persistidas al montar
  useEffect(() => {
    SecureStore.getItemAsync(NOTIF_KEY).then(val => {
      if (val !== null) setNotificationsState(val === '1');
    });
    // Ubicación viene de profiles.is_online
    if (profile?.is_online !== undefined) setLocationState(!!profile.is_online);
  }, [profile?.is_online]);

  const toggleNotifications = async (value: boolean) => {
    setNotificationsState(value);
    await SecureStore.setItemAsync(NOTIF_KEY, value ? '1' : '0');
  };

  const toggleLocation = async (value: boolean) => {
    setLocationState(value);
    await supabase.from('profiles').update({ is_online: value }).eq('id', profile!.id);
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  };

  const openEditProfile = () => {
    setEditName(profile?.full_name ?? '');
    setEditPhone(profile?.phone ?? '');
    setEditVisible(true);
  };

  const saveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) { Alert.alert('Error', 'El nombre no puede estar vacío'); return; }
    setSaving(true);
    const { error } = await updateProfile({ full_name: trimmedName, phone: editPhone.trim() || undefined });
    setSaving(false);
    if (error) { Alert.alert('Error', 'No se pudo guardar. Intenta de nuevo.'); return; }
    setEditVisible(false);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Cambiar contraseña',
      `Se enviará un enlace de recuperación a ${profile?.email ?? 'tu correo'}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            if (!profile?.email) return;
            const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
            if (error) Alert.alert('Error', error.message);
            else Alert.alert('Enviado', 'Revisa tu bandeja de entrada.');
          },
        },
      ],
    );
  };

  const comingSoon = (label: string) =>
    Alert.alert(label, 'Esta función estará disponible pronto.');

  const SECTIONS: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Mi cuenta',
      items: [
        { icon: 'person-outline', label: 'Editar perfil', sub: 'Nombre, teléfono', action: openEditProfile },
        { icon: 'lock-closed-outline', label: 'Cambiar contraseña', action: handleChangePassword },
        ...(isPro ? [
          { icon: 'calendar-outline',   label: 'Mi disponibilidad',  sub: 'Configura tus horarios',       action: () => navigation.navigate('ProAvailability') },
          { icon: 'images-outline',     label: 'Mi portafolio',      sub: 'Sube fotos de tus trabajos',   action: () => navigation.navigate('ProPortfolio') },
          {
            icon: profile?.verification_status === 'verified' ? 'shield-checkmark' : 'shield-outline',
            label: 'Verificar identidad',
            sub: profile?.verification_status === 'verified' ? 'Identidad verificada ✓'
              : profile?.verification_status === 'pending' ? 'En revisión...'
              : 'Genera más confianza',
            action: () => navigation.navigate('Verification'),
          },
          { icon: 'card-outline',       label: 'Método de cobro',    sub: 'Configura cómo recibes pagos', action: () => comingSoon('Método de cobro') },
          { icon: 'star-outline',       label: 'Mis reseñas',        sub: `${profile?.rating ?? 0} ★ promedio`, action: () => comingSoon('Mis reseñas') },
          { icon: 'people-outline',     label: 'Referidos',          sub: 'Invita y gana coins',           action: () => navigation.navigate('Referrals') },
        ] : [
          { icon: 'card-outline',     label: 'Métodos de pago',  sub: 'Tarjetas y saldo',    action: () => comingSoon('Métodos de pago') },
          { icon: 'location-outline', label: 'Mis direcciones',                               action: () => comingSoon('Mis direcciones') },
          { icon: 'trophy-outline',   label: 'Mi nivel del hogar', sub: 'Ver beneficios',    action: () => navigation.navigate('HomeLevel') },
          { icon: 'logo-bitcoin',     label: 'LimpioCoins',       sub: `${profile?.limpio_coins ?? 0} coins`, action: () => navigation.navigate('Coins') },
          { icon: 'analytics-outline',label: 'Mi LimpioScore',    sub: `${profile?.limpio_score ?? 0} / 1000 · ${(profile?.limpio_score_tier ?? 'standard').charAt(0).toUpperCase() + (profile?.limpio_score_tier ?? 'standard').slice(1)}`, action: () => comingSoon('LimpioScore') },
          { icon: 'people-outline',   label: 'Referidos',         sub: 'Invita y gana coins', action: () => navigation.navigate('Referrals') },
        ]),
      ],
    },
    {
      title: 'Preferencias',
      items: [
        {
          icon: 'notifications-outline', label: 'Notificaciones',
          sub: notifications ? 'Activadas' : 'Desactivadas',
          toggle: true, toggleValue: notifications, onToggle: toggleNotifications,
        },
        {
          icon: 'navigate-outline', label: 'Compartir ubicación',
          sub: location ? 'Activa' : 'Inactiva',
          toggle: true, toggleValue: location, onToggle: toggleLocation,
        },
        { icon: 'language-outline', label: 'Idioma', sub: 'Español' },
      ],
    },
    {
      title: 'Soporte',
      items: [
        { icon: 'settings-outline',           label: 'Configuración',       action: () => navigation.navigate('Settings') },
        { icon: 'help-circle-outline',        label: 'Centro de ayuda',     action: () => navigation.navigate('Support') },
        { icon: 'notifications-outline',      label: 'Notificaciones',      action: () => navigation.navigate('Notifications') },
        { icon: 'document-text-outline',      label: 'Términos y privacidad' },
        { icon: 'information-circle-outline', label: 'Versión',             sub: '1.0.0 (beta)' },
      ],
    },
    {
      title: '',
      items: [
        { icon: 'log-out-outline', label: 'Cerrar sesión', danger: true, action: handleSignOut },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero */}
          <LinearGradient colors={[Colors.sky100, Colors.sky50, Colors.bg]} style={styles.hero}>
            <View style={[styles.avatarWrap, Shadow.md]}>
              <LinearGradient
                colors={isPro ? ['#0C4A6E', '#0EA5E9'] : ['#38BDF8', '#2563EB']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={10} color="#fff" />
              </View>
            </View>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.rolePill}>
              <Ionicons name={isPro ? 'briefcase' : 'home'} size={11} color={isPro ? Colors.proAccent : Colors.primary} />
              <Text style={[styles.roleText, { color: isPro ? Colors.proAccent : Colors.primary }]}>
                {isPro ? 'Profesional' : 'Cliente'}
              </Text>
            </View>
            {isPro && (
              <View style={{ marginTop: 6 }}>
                <VerifiedBadge status={profile?.verification_status} size="sm" />
              </View>
            )}
            <Text style={styles.email}>{profile?.email ?? ''}</Text>

            {isPro && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>0</Text>
                  <Text style={styles.statLabel}>Trabajos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{profile?.rating ?? '—'}</Text>
                  <Text style={styles.statLabel}>Rating ★</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>$0</Text>
                  <Text style={styles.statLabel}>Ganado</Text>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Menú */}
          {SECTIONS.map((section, si) => (
            <View key={si} style={styles.section}>
              {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
              <View style={[styles.card, Shadow.sm]}>
                {section.items.map((item, ii) => (
                  <View key={ii}>
                    {ii > 0 && <View style={styles.sep} />}
                    <Pressable
                      style={styles.row}
                      onPress={item.action ?? (() => {})}
                      disabled={item.toggle}
                    >
                      <View style={[styles.iconWrap, item.danger && styles.iconWrapDanger]}>
                        <Ionicons
                          name={item.icon as any}
                          size={18}
                          color={item.danger ? Colors.danger : Colors.primary}
                        />
                      </View>
                      <View style={styles.rowContent}>
                        <Text style={[styles.rowLabel, item.danger && styles.rowLabelDanger]}>
                          {item.label}
                        </Text>
                        {item.sub ? <Text style={styles.rowSub}>{item.sub}</Text> : null}
                      </View>
                      {item.toggle ? (
                        <Switch
                          value={item.toggleValue}
                          onValueChange={item.onToggle}
                          trackColor={{ false: Colors.border, true: Colors.primarySoft }}
                          thumbColor={item.toggleValue ? Colors.primary : Colors.ink4}
                        />
                      ) : (
                        !item.danger && (
                          <Ionicons name="chevron-forward" size={16} color={Colors.ink4} />
                        )
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))}

        </ScrollView>
      </SafeAreaView>

      {/* Modal editar perfil */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalSheet, Shadow.md]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <Pressable onPress={() => setEditVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={Colors.ink} />
              </Pressable>
            </View>
            <Text style={styles.modalLabel}>Nombre completo</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              placeholderTextColor={Colors.ink4}
              autoCapitalize="words"
            />
            <Text style={styles.modalLabel}>Teléfono</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+57 300 000 0000"
              placeholderTextColor={Colors.ink4}
              keyboardType="phone-pad"
            />
            <Pressable style={[styles.modalSaveBtn, Shadow.cta]} onPress={saveProfile} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.modalSaveTxt}>Guardar cambios</Text>
              }
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },

  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#fff' },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { ...Typography.h2, color: Colors.ink, marginBottom: Spacing.xs },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingVertical: 4, paddingHorizontal: 10,
    borderWidth: 1, borderColor: Colors.sky200,
    marginBottom: Spacing.xs,
  },
  roleText: { ...Typography.caption, fontWeight: '700' },
  email: { ...Typography.small, color: Colors.ink3, marginBottom: Spacing.lg },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl, width: '100%',
    borderWidth: 1, borderColor: Colors.sky100, ...Shadow.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...Typography.h3, color: Colors.ink },
  statLabel: { ...Typography.caption, color: Colors.ink3, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.sky100 },

  section: { paddingHorizontal: Spacing.xl, marginTop: Spacing.xl },
  sectionTitle: { ...Typography.caption, color: Colors.ink3, marginBottom: Spacing.sm, letterSpacing: 0.8, textTransform: 'uppercase' },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.sky100, overflow: 'hidden',
  },
  sep: { height: 1, backgroundColor: Colors.sky100, marginLeft: 56 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  iconWrapDanger: { backgroundColor: Colors.dangerLight },
  rowContent: { flex: 1 },
  rowLabel: { ...Typography.bodyMed, color: Colors.ink },
  rowLabelDanger: { color: Colors.danger },
  rowSub: { ...Typography.caption, color: Colors.ink3, marginTop: 1 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: 36, gap: Spacing.sm,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h3, color: Colors.ink },
  modalLabel: { ...Typography.caption, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.sm },
  modalInput: {
    ...Typography.body, color: Colors.ink,
    borderWidth: 1, borderColor: Colors.sky200,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: 13,
    backgroundColor: Colors.bg,
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingVertical: 15, alignItems: 'center', marginTop: Spacing.lg,
  },
  modalSaveTxt: { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
});
