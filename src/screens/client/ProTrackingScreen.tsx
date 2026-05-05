import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

type ProLocation = { lat: number; lng: number; full_name: string; is_online: boolean; avatar_url?: string };

export function ProTrackingScreen({ navigation, route }: any) {
  const { proId, proName, jobId } = route.params as { proId: string; proName: string; jobId: string };
  const mapRef = useRef<MapView>(null);
  const [proLoc, setProLoc] = useState<ProLocation | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('lat, lng, full_name, is_online, avatar_url')
        .eq('id', proId)
        .single();
      if (data?.lat && data?.lng) {
        setProLoc(data as ProLocation);
        animate(data.lat, data.lng);
      }
      setLoading(false);
    })();
  }, [proId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`pro-location-${proId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${proId}` },
        (payload) => {
          const p = payload.new as any;
          if (p.lat && p.lng) {
            setProLoc({ lat: p.lat, lng: p.lng, full_name: p.full_name, is_online: p.is_online, avatar_url: p.avatar_url });
            animate(p.lat, p.lng);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [proId]);

  const animate = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600,
    );
  };

  const initialRegion: Region = proLoc
    ? { latitude: proLoc.lat, longitude: proLoc.lng, latitudeDelta: 0.015, longitudeDelta: 0.015 }
    : { latitude: 4.711, longitude: -74.0721, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        </Pressable>
        <View>
          <Text style={styles.title}>Ubicación del pro</Text>
          <Text style={styles.subtitle}>{proName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: proLoc?.is_online ? Colors.ok : Colors.ink4 }]}>
          <Text style={styles.badgeText}>{proLoc?.is_online ? 'En línea' : 'Sin señal'}</Text>
        </View>
      </View>

      {/* Map */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Buscando ubicación…</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation
        >
          {proLoc && (
            <Marker
              coordinate={{ latitude: proLoc.lat, longitude: proLoc.lng }}
              title={proLoc.full_name}
              description={proLoc.is_online ? 'En camino a ti' : 'Última ubicación conocida'}
            >
              <View style={styles.proMarker}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Info card */}
      {!loading && (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{proName}</Text>
              <Text style={styles.cardStatus}>
                {proLoc?.is_online
                  ? '📍 Compartiendo ubicación en tiempo real'
                  : '⚠️ El pro no está compartiendo su ubicación'}
              </Text>
            </View>
            <Pressable
              style={styles.chatBtn}
              onPress={() => navigation.navigate('Chat', { jobId })}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
                 paddingVertical: 12, backgroundColor: '#fff', ...Shadow.sm, gap: 12 },
  back:        {},
  title:       { ...Typography.h3, color: Colors.ink },
  subtitle:    { ...Typography.small, color: Colors.ink3 },
  badge:       { marginLeft: 'auto', borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { ...Typography.caption, color: '#fff', fontWeight: '700' },
  loadingBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { ...Typography.body, color: Colors.ink3 },
  proMarker:   { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
                 alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  card:        { position: 'absolute', bottom: 24, left: Spacing.md, right: Spacing.md,
                 backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md,
                 ...Shadow.lg },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle:{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '20',
                 alignItems: 'center', justifyContent: 'center' },
  cardName:    { ...Typography.bodyMed, color: Colors.ink },
  cardStatus:  { ...Typography.small, color: Colors.ink3, marginTop: 2 },
  chatBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
                 alignItems: 'center', justifyContent: 'center' },
});
