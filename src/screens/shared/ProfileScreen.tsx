import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

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

export function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);

  const isPro = profile?.role === 'pro';
  const initial = profile?.full_name?.charAt(0).toUpperCase() ?? 'U';
  const name = profile?.full_name ?? 'Usuario';

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  };

  const SECTIONS: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Mi cuenta',
      items: [
        { icon: 'person-outline', label: 'Editar perfil', sub: 'Nombre, foto, descripción' },
        { icon: 'lock-closed-outline', label: 'Cambiar contraseña' },
        ...(isPro ? [
          { icon: 'card-outline', label: 'Método de cobro', sub: 'Configura cómo recibes pagos' },
          { icon: 'star-outline', label: 'Mis reseñas', sub: `${profile?.rating ?? 0} ★ promedio` },
        ] : [
          { icon: 'card-outline', label: 'Métodos de pago', sub: 'Tarjetas y saldo' },
          { icon: 'location-outline', label: 'Mis direcciones' },
        ]),
      ],
    },
    {
      title: 'Preferencias',
      items: [
        {
          icon: 'notifications-outline', label: 'Notificaciones',
          toggle: true, toggleValue: notifications, onToggle: setNotifications,
        },
        {
          icon: 'navigate-outline', label: 'Ubicación',
          toggle: true, toggleValue: location, onToggle: setLocation,
        },
        { icon: 'moon-outline', label: 'Idioma', sub: 'Español' },
      ],
    },
    {
      title: 'Soporte',
      items: [
        { icon: 'help-circle-outline', label: 'Centro de ayuda' },
        { icon: 'chatbubble-outline', label: 'Contactar soporte' },
        { icon: 'document-text-outline', label: 'Términos y privacidad' },
        { icon: 'information-circle-outline', label: 'Versión', sub: '1.0.0 (beta)' },
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
});
