import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Pressable, SectionList,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

type Notif = {
  id: string;
  type: 'booking' | 'message' | 'offer' | 'review' | 'system';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  booking_id?: string;
  chat_id?: string;
};

const TYPE_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  booking: { icon: 'calendar',      bg: Colors.primarySoft, color: Colors.primary },
  message: { icon: 'chatbubble',    bg: Colors.sky100,      color: Colors.sky500 },
  offer:   { icon: 'pricetag',      bg: Colors.okLight,     color: Colors.ok },
  review:  { icon: 'star',          bg: Colors.warnLight,   color: Colors.warn },
  system:  { icon: 'notifications', bg: Colors.surfaceAlt,  color: Colors.ink3 },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d}d`;
  return new Date(iso).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
}

function NotifItem({ notif, onPress, onRead }: { notif: Notif; onPress: () => void; onRead: () => void }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system;
  const fadeAnim = useRef(new Animated.Value(notif.read ? 1 : 0)).current;

  const handlePress = () => {
    if (!notif.read) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      onRead();
    }
    onPress();
  };

  const bgColor = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [Colors.sky50, Colors.surface] });

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.notifCard, { backgroundColor: bgColor }]}>
        {!notif.read && <View style={styles.unreadDot} />}
        <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
        </View>
        <View style={styles.notifBody}>
          <Text style={[styles.notifTitle, !notif.read && styles.notifTitleBold]}>{notif.title}</Text>
          <Text style={styles.notifText} numberOfLines={2}>{notif.body}</Text>
          <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.ink4} />
      </Animated.View>
    </Pressable>
  );
}

// Genera notificaciones de demostración cuando no hay datos reales aún
function getMockNotifs(): Notif[] {
  const now = new Date();
  const ago = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
  return [
    { id: '1', type: 'booking',  title: 'Servicio confirmado',        body: 'Tu limpieza básica fue aceptada para el sábado a las 9:00 AM',   read: false, created_at: ago(5) },
    { id: '2', type: 'message',  title: 'Mensaje de María G.',        body: '¡Hola! Confirmo que llegaré puntual el sábado 🧹',               read: false, created_at: ago(18) },
    { id: '3', type: 'offer',    title: 'Nueva oferta recibida',      body: 'Carlos P. hizo una oferta de $95.000 por tu servicio',           read: false, created_at: ago(45) },
    { id: '4', type: 'review',   title: 'Deja tu reseña',             body: 'Tu limpieza de ayer finalizó. ¿Cómo te fue con el servicio?',    read: true,  created_at: ago(1440) },
    { id: '5', type: 'system',   title: 'Bienvenido a LimpioGO',      body: 'Completa tu perfil para recibir mejores recomendaciones',        read: true,  created_at: ago(2880) },
    { id: '6', type: 'booking',  title: 'Recordatorio de servicio',   body: 'Mañana a las 10:00 AM tienes limpieza profunda agendada',        read: true,  created_at: ago(2880) },
  ];
}

export function NotificationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        setNotifs(error || !data?.length ? getMockNotifs() : (data as Notif[]));
        setLoading(false);
      });
  }, [user?.id]);

  // Suscripción Realtime para notificaciones entrantes
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifs:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifs(prev => [payload.new as Notif, ...prev]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', user?.id).then(() => {});
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user?.id)
      .eq('read', false)
      .then(() => {});
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  // Agrupar por hoy / ayer / esta semana
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);

  const grouped: { title: string; data: Notif[] }[] = [];
  const todayList   = notifs.filter(n => new Date(n.created_at) >= today);
  const yesterdayList = notifs.filter(n => { const d = new Date(n.created_at); return d >= yesterday && d < today; });
  const olderList   = notifs.filter(n => new Date(n.created_at) < yesterday);
  if (todayList.length)     grouped.push({ title: 'Hoy',         data: todayList });
  if (yesterdayList.length) grouped.push({ title: 'Ayer',        data: yesterdayList });
  if (olderList.length)     grouped.push({ title: 'Más antiguas', data: olderList });

  const handlePress = (notif: Notif) => {
    if (notif.chat_id)   navigation.navigate('Chat', { bookingId: notif.chat_id });
    if (notif.booking_id) navigation.navigate('Bookings');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* Header */}
        <LinearGradient colors={[Colors.sky100, Colors.sky50]} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Notificaciones</Text>
              {unreadCount > 0 && (
                <Text style={styles.headerSub}>{unreadCount} sin leer</Text>
              )}
            </View>
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={styles.markAllBtn}>Marcar todas</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : notifs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptySub}>Aquí aparecerán tus alertas de bookings, mensajes y ofertas</Text>
          </View>
        ) : (
          <SectionList
            sections={grouped}
            keyExtractor={n => n.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <NotifItem
                notif={item}
                onPress={() => handlePress(item)}
                onRead={() => markRead(item.id)}
              />
            )}
          />
        )}
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
  headerTitle: { ...Typography.h3, color: Colors.ink },
  headerSub:   { ...Typography.small, color: Colors.ink3, marginTop: 2 },
  markAllBtn:  { ...Typography.small, color: Colors.primary, fontWeight: '700' },

  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list:          { padding: Spacing.xl },
  sectionHeader: { ...Typography.caption, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.md },

  notifCard: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.sky100, position: 'relative' },
  unreadDot: { position: 'absolute', top: 14, left: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1, marginHorizontal: Spacing.md },
  notifTitle:     { ...Typography.small, color: Colors.ink, marginBottom: 2 },
  notifTitleBold: { fontWeight: '700' },
  notifText:      { ...Typography.small, color: Colors.ink3, lineHeight: 18, marginBottom: 4 },
  notifTime:      { ...Typography.caption, color: Colors.ink4 },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl },
  emptyEmoji: { fontSize: 52, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h3, color: Colors.ink, marginBottom: Spacing.sm },
  emptySub:   { ...Typography.body, color: Colors.ink3, textAlign: 'center', lineHeight: 22 },
});
