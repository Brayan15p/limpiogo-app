import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert, Pressable, ScrollView, StatusBar,
  StyleSheet, Switch, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

type ToggleItem = { id: string; icon: string; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void };
type ActionItem = { id: string; icon: string; label: string; sub?: string; action: () => void; danger?: boolean; badge?: string; iconColor?: string };
type SectionDef = { title: string; items: (ToggleItem | ActionItem)[] };

export function SettingsScreen({ navigation }: any) {
  const { profile, signOut } = useAuth();
  const isPro = profile?.role === 'pro';

  const [pushEnabled,    setPushEnabled]    = useState(true);
  const [emailEnabled,   setEmailEnabled]   = useState(true);
  const [chatSounds,     setChatSounds]     = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode,       setDarkMode]       = useState(false);

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir',    style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Eliminar cuenta', 'Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => Alert.alert('Contacta soporte', 'Escríbenos a soporte@limpiogo.co para procesar tu solicitud.') },
    ]);
  };

  const sections: SectionDef[] = [
    {
      title: 'Notificaciones',
      items: [
        { id: 'push',  icon: 'notifications',   label: 'Notificaciones push',   sub: 'Alertas de bookings y mensajes', value: pushEnabled,    onChange: setPushEnabled },
        { id: 'email', icon: 'mail',             label: 'Correo electrónico',    sub: 'Resúmenes y confirmaciones',     value: emailEnabled,   onChange: setEmailEnabled },
        { id: 'chat',  icon: 'chatbubble-ellipses', label: 'Sonidos de chat',   sub: 'Sonido al recibir mensajes',     value: chatSounds,     onChange: setChatSounds },
      ] as ToggleItem[],
    },
    {
      title: 'Privacidad',
      items: [
        { id: 'location', icon: 'location',    label: 'Compartir ubicación',  sub: 'Para tracking en tiempo real', value: locationEnabled, onChange: setLocationEnabled },
      ] as ToggleItem[],
    },
    {
      title: 'Apariencia',
      items: [
        { id: 'dark', icon: 'moon', label: 'Modo oscuro', sub: 'Próximamente', value: darkMode, onChange: (v) => { /* coming soon */ } },
      ] as ToggleItem[],
    },
    {
      title: 'Cuenta',
      items: [
        { id: 'profile',   icon: 'person-circle',  label: 'Editar perfil',       action: () => navigation.navigate('Profile'), iconColor: Colors.primary } as ActionItem,
        { id: 'password',  icon: 'lock-closed',    label: 'Cambiar contraseña',  action: () => navigation.navigate('ForgotPassword'), iconColor: Colors.ink2 } as ActionItem,
        ...(isPro ? [{ id: 'payout', icon: 'wallet', label: 'Datos de pago', sub: 'Cuenta Bancolombia / Nequi', action: () => {}, iconColor: Colors.ok } as ActionItem] : []),
        { id: 'support',   icon: 'help-circle',    label: 'Ayuda y soporte',     action: () => navigation.navigate('Support'), iconColor: Colors.sky500 } as ActionItem,
        { id: 'terms',     icon: 'document-text',  label: 'Términos y condiciones', action: () => {}, iconColor: Colors.ink3 } as ActionItem,
        { id: 'privacy',   icon: 'shield-checkmark', label: 'Política de privacidad', action: () => {}, iconColor: Colors.ink3 } as ActionItem,
      ],
    },
    {
      title: 'Sesión',
      items: [
        { id: 'logout', icon: 'log-out', label: 'Cerrar sesión', action: handleSignOut, danger: true } as ActionItem,
        { id: 'delete', icon: 'trash',   label: 'Eliminar cuenta', action: handleDeleteAccount, danger: true } as ActionItem,
      ],
    },
  ];

  const isToggle = (item: any): item is ToggleItem => 'value' in item;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        <LinearGradient colors={[Colors.sky100, Colors.sky50]} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <Text style={styles.headerTitle}>Configuración</Text>
            <View style={{ width: 38 }} />
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* User card */}
          <View style={[styles.userCard, Shadow.card]}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>{profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile?.full_name ?? 'Usuario'}</Text>
              <View style={[styles.rolePill, isPro && styles.rolePillPro]}>
                <Text style={[styles.roleText, isPro && styles.roleTextPro]}>{isPro ? 'Profesional' : 'Cliente'}</Text>
              </View>
            </View>
            <Pressable style={styles.editBtn} onPress={() => navigation.navigate('Profile')} hitSlop={8}>
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
            </Pressable>
          </View>

          {/* Sections */}
          {sections.map(sec => (
            <View key={sec.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <View style={[styles.sectionCard, Shadow.sm]}>
                {sec.items.map((item, idx) => (
                  <View key={item.id}>
                    {idx > 0 && <View style={styles.divider} />}
                    {isToggle(item) ? (
                      <View style={styles.row}>
                        <View style={[styles.rowIcon, { backgroundColor: Colors.primarySoft }]}>
                          <Ionicons name={item.icon as any} size={16} color={Colors.primary} />
                        </View>
                        <View style={styles.rowText}>
                          <Text style={styles.rowLabel}>{item.label}</Text>
                          {item.sub && <Text style={styles.rowSub}>{item.sub}</Text>}
                        </View>
                        <Switch
                          value={item.value}
                          onValueChange={item.onChange}
                          trackColor={{ false: Colors.ink4, true: Colors.primary }}
                          thumbColor="#fff"
                        />
                      </View>
                    ) : (
                      <Pressable style={styles.row} onPress={(item as ActionItem).action}>
                        <View style={[styles.rowIcon, { backgroundColor: (item as ActionItem).danger ? Colors.dangerLight : Colors.surfaceAlt }]}>
                          <Ionicons
                            name={item.icon as any}
                            size={16}
                            color={(item as ActionItem).danger ? Colors.danger : ((item as ActionItem).iconColor ?? Colors.ink3)}
                          />
                        </View>
                        <View style={styles.rowText}>
                          <Text style={[styles.rowLabel, (item as ActionItem).danger && styles.rowLabelDanger]}>{item.label}</Text>
                          {(item as any).sub && <Text style={styles.rowSub}>{(item as any).sub}</Text>}
                        </View>
                        {!(item as ActionItem).danger && (
                          <Ionicons name="chevron-forward" size={16} color={Colors.ink4} />
                        )}
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text style={styles.versionText}>LimpioGO v1.0.0 · hecho con 💙 en Colombia</Text>
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

  scroll: { padding: Spacing.xl },

  userCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.sky100 },
  userAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  userInitial:{ fontSize: 20, fontWeight: '800', color: '#fff' },
  userInfo:   { flex: 1 },
  userName:   { ...Typography.bodyMed, color: Colors.ink, marginBottom: 4 },
  rolePill:   { alignSelf: 'flex-start', backgroundColor: Colors.primarySoft, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  rolePillPro:{ backgroundColor: Colors.proLight },
  roleText:   { ...Typography.caption, color: Colors.primary },
  roleTextPro:{ color: Colors.proAccent },
  editBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },

  section:      { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.caption, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginLeft: Spacing.sm },
  sectionCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.sky100 },
  divider:      { height: 1, backgroundColor: Colors.border, marginLeft: 68 },

  row:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
  rowIcon:   { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  rowText:   { flex: 1 },
  rowLabel:  { ...Typography.body, color: Colors.ink },
  rowLabelDanger: { color: Colors.danger },
  rowSub:    { ...Typography.small, color: Colors.ink3, marginTop: 2 },

  versionText: { ...Typography.caption, color: Colors.ink4, textAlign: 'center', marginTop: Spacing.xl, marginBottom: Spacing.xxl },
});
