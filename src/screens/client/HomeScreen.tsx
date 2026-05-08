import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Animated, Dimensions, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites, useHeartAnim } from '../../hooks/useFavorites';
import { useAuth } from '../../hooks/useAuth';
import { useHomeLevel } from '../../hooks/useHomeLevel';
import { usePreferredPro } from '../../hooks/usePreferredPro';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { HomeLevelBadge } from '../../components/HomeLevelBadge';
import { VoiceBookingSheet } from '../../components/VoiceBookingSheet';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - Spacing.xl * 2 - Spacing.md) / 2;

const SERVICES = [
  { id: 'basic',  emoji: '🧹', label: 'Básica',   desc: 'Hasta 2h',  price: 'desde $80.000' },
  { id: 'deep',   emoji: '✨', label: 'Profunda', desc: '3–5h',      price: 'desde $150.000' },
  { id: 'move',   emoji: '📦', label: 'Mudanza',  desc: 'Vaciado',   price: 'desde $220.000' },
  { id: 'office', emoji: '🏢', label: 'Oficinas', desc: 'Flexible',  price: 'desde $120.000' },
];

const AVATAR_COLORS = [Colors.sky300, Colors.sky400, Colors.sky200, '#BAE6FD', Colors.primarySoft];

type TopPro = {
  id: string;
  full_name: string;
  rating: number | null;
  total_reviews: number;
  is_verified: boolean;
  verification_status?: import('../../types').VerificationStatus;
  bio: string | null;
};

function ProCard({ pro, isFav, onToggleFav }: {
  pro: TopPro;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const { scale, fire } = useHeartAnim();
  const initials = pro.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const bg = AVATAR_COLORS[pro.full_name.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <View style={[styles.proCard, Shadow.card]}>
      {/* Botón corazón */}
      <Pressable
        style={styles.favBtn}
        hitSlop={6}
        onPress={() => { fire(); onToggleFav(); }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? Colors.danger : Colors.ink4}
          />
        </Animated.View>
      </Pressable>

      <View style={[styles.proAvatar, { backgroundColor: bg }]}>
        <Text style={styles.proInitial}>{initials}</Text>
        {(pro.verification_status === 'verified' || pro.is_verified) && (
          <View style={styles.verifiedDot}>
            <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
          </View>
        )}
      </View>

      <Text style={styles.proName} numberOfLines={1}>{pro.full_name.split(' ')[0]}</Text>

      {pro.rating ? (
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color={Colors.warn} />
          <Text style={styles.rating}>{Number(pro.rating).toFixed(1)}</Text>
        </View>
      ) : null}

      <Text style={styles.proJobs}>
        {pro.total_reviews > 0 ? `${pro.total_reviews} reseñas` : 'Nuevo'}
      </Text>
    </View>
  );
}

export function HomeScreen({ navigation }: any) {
  const { profile, signOut } = useAuth();
  const { favIds, toggle } = useFavorites();
  const [topPros, setTopPros]         = useState<TopPro[]>([]);
  const [voiceOpen, setVoiceOpen]     = useState(false);
  const { level }                     = useHomeLevel();
  const { preferred }                 = usePreferredPro();

  const firstName = profile?.full_name?.split(' ')[0] ?? 'ahí';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, rating, total_reviews, is_verified, bio, verification_status')
      .eq('role', 'pro')
      .order('rating', { ascending: false })
      .limit(8)
      .then(({ data }) => setTopPros(data ?? []));
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces>

          {/* Header */}
          <LinearGradient colors={[Colors.sky100, Colors.sky50, Colors.bg]} style={styles.headerGrad}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.greeting}>{greeting} 👋</Text>
                <Text style={styles.name} numberOfLines={1}>{firstName}</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')} hitSlop={8}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.ink2} />
                </Pressable>
                <Pressable style={styles.avatar} onPress={() => navigation.navigate('Settings')} hitSlop={8}>
                  <Text style={styles.avatarTxt}>
                    {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Búsqueda — navega a SearchScreen */}
            <View style={styles.searchRow}>
              <Pressable style={[styles.search, Shadow.sm, { flex: 1 }]} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={18} color={Colors.ink3} />
                <Text style={styles.searchPh}>Buscar servicio o limpiador…</Text>
                <View style={styles.filterBtn}>
                  <Ionicons name="options-outline" size={16} color={Colors.primary} />
                </View>
              </Pressable>
              {/* F33: Voice Booking */}
              <Pressable style={[styles.micBtn, Shadow.sm]} onPress={() => setVoiceOpen(true)}>
                <Ionicons name="mic" size={20} color={Colors.primary} />
              </Pressable>
            </View>
          </LinearGradient>

          {/* F48: Nivel del Hogar */}
          {level && (
            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Mi hogar</Text>
                <Pressable hitSlop={8} onPress={() => navigation.navigate('HomeLevel')}>
                  <Text style={styles.seeAll}>Ver niveles</Text>
                </Pressable>
              </View>
              <HomeLevelBadge
                levelName={level.levelName}
                bookingsCompleted={level.bookingsCompleted}
                nextThreshold={level.nextThreshold}
                progress={level.progress}
                onPress={() => navigation.navigate('HomeLevel')}
              />
            </View>
          )}

          {/* F50: Mi Pro de Confianza */}
          {preferred && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mi Pro de Confianza</Text>
              <Pressable
                style={[styles.preferredCard, Shadow.card]}
                onPress={() => navigation.navigate('ProPublicProfile', { proId: preferred.proId })}
              >
                <View style={[styles.preferredAvatar, { backgroundColor: Colors.primarySoft }]}>
                  <Text style={styles.preferredInitial}>
                    {preferred.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.preferredInfo}>
                  <Text style={styles.preferredName}>{preferred.fullName}</Text>
                  <View style={styles.preferredMeta}>
                    {preferred.rating && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="star" size={11} color={Colors.warn} />
                        <Text style={styles.preferredRating}>{Number(preferred.rating).toFixed(1)}</Text>
                      </View>
                    )}
                    <Text style={styles.preferredTogether}>· {preferred.bookingsTogether} servicios juntos</Text>
                  </View>
                </View>
                <Pressable
                  style={styles.preferredBtn}
                  onPress={() => navigation.navigate('Booking', { preferredProId: preferred.proId })}
                >
                  <Text style={styles.preferredBtnText}>Agendar</Text>
                </Pressable>
              </Pressable>
            </View>
          )}

          {/* Servicios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Qué necesitas hoy?</Text>
            <View style={styles.grid}>
              {SERVICES.map(s => (
                <Pressable
                  key={s.id}
                  style={[styles.serviceCard, Shadow.card]}
                  onPress={() => navigation.navigate('ServiceDetail', { serviceId: s.id })}
                >
                  <Text style={styles.emoji}>{s.emoji}</Text>
                  <Text style={styles.serviceLabel}>{s.label}</Text>
                  <Text style={styles.serviceDesc}>{s.desc}</Text>
                  <View style={styles.pricePill}>
                    <Text style={styles.priceText}>{s.price}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Pros mejor calificados */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Mejor calificados</Text>
              <Pressable hitSlop={8} onPress={() => navigation.navigate('Favorites')}>
                <Text style={styles.seeAll}>Ver favoritos</Text>
              </Pressable>
            </View>

            {topPros.length === 0 ? (
              <View style={styles.prosEmpty}>
                <Text style={styles.prosEmptyText}>Los pros llegarán pronto 🧹</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.proList}
              >
                {topPros.map(pro => (
                  <ProCard
                    key={pro.id}
                    pro={pro}
                    isFav={favIds.has(pro.id)}
                    onToggleFav={() => toggle(pro.id, {
                      pro_id: pro.id,
                      full_name: pro.full_name,
                      rating: pro.rating,
                      total_reviews: pro.total_reviews,
                      bio: pro.bio,
                      is_verified: pro.is_verified,
                    })}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* AR Scan Banner — F34 */}
          <Pressable
            style={[styles.arBanner, Shadow.sm]}
            onPress={() => navigation.navigate('ARScan')}
          >
            <View style={styles.arBannerIcon}>
              <Text style={{ fontSize: 22 }}>📐</Text>
            </View>
            <View style={styles.arBannerText}>
              <Text style={styles.arBannerTitle}>Escanea tu espacio con IA</Text>
              <Text style={styles.arBannerSub}>Foto → m² → precio al instante</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </Pressable>

          {/* Banner CTA */}
          <Pressable
            style={[styles.postBanner, Shadow.cta]}
            onPress={() => navigation.navigate('Booking')}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>¿Necesitas algo específico?</Text>
              <Text style={styles.bannerSub}>Publica y recibe ofertas en minutos</Text>
            </View>
            <View style={styles.bannerArrow}>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </Pressable>

        </ScrollView>
      </SafeAreaView>

      {/* F33: Voice Booking Sheet */}
      <VoiceBookingSheet
        visible={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onConfirm={(parsed) => {
          navigation.navigate('Booking', {
            prefServiceType:   parsed.service_type,
            prefDate:          parsed.date,
            prefTime:          parsed.time,
            prefNotes:         parsed.notes ?? '',
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  safe:   { flex: 1 },
  scroll: { paddingBottom: 48 },

  headerGrad: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: Spacing.xl },
  headerText: { flex: 1, marginRight: Spacing.md },
  greeting:   { ...Typography.small, color: Colors.ink3 },
  name:       { ...Typography.h2, color: Colors.ink },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  bellBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surface,
                alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
                borderWidth: 1, borderColor: Colors.sky200 },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:  { ...Typography.bodyMed, color: '#fff', fontWeight: '800' },

  searchRow:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  search:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
              borderRadius: Radius.full, paddingVertical: 13, paddingHorizontal: Spacing.lg,
              borderWidth: 1, borderColor: Colors.sky200 },
  searchPh: { flex: 1, ...Typography.body, color: Colors.ink4, marginLeft: Spacing.sm },
  filterBtn:{ width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.primarySoft,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  micBtn:   { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: Colors.primarySoft },

  preferredCard:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
                      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                      borderWidth: 1.5, borderColor: Colors.primarySoft },
  preferredAvatar:  { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  preferredInitial: { ...Typography.h4, color: Colors.primary, fontWeight: '800' },
  preferredInfo:    { flex: 1 },
  preferredName:    { ...Typography.bodyMed, color: Colors.ink, fontWeight: '700' },
  preferredMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  preferredRating:  { ...Typography.small, color: Colors.ink2, fontWeight: '600' },
  preferredTogether:{ ...Typography.small, color: Colors.ink3 },
  preferredBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.full,
                      paddingHorizontal: 14, paddingVertical: 7 },
  preferredBtnText: { ...Typography.small, color: '#fff', fontWeight: '700' },

  section:      { paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.md },
  seeAll:       { ...Typography.small, color: Colors.primary, fontWeight: '700' },

  grid:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  serviceCard: { width: CARD_W, backgroundColor: Colors.surface, borderRadius: Radius.xl,
                 padding: Spacing.lg, marginBottom: Spacing.md,
                 borderWidth: 1, borderColor: Colors.sky100 },
  emoji:        { fontSize: 26, marginBottom: Spacing.sm },
  serviceLabel: { ...Typography.smallBold, color: Colors.ink, marginBottom: 2 },
  serviceDesc:  { ...Typography.caption, color: Colors.ink3, marginBottom: Spacing.sm },
  pricePill:    { alignSelf: 'flex-start', backgroundColor: Colors.primaryLight,
                  borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: 8,
                  borderWidth: 1, borderColor: Colors.sky200 },
  priceText:    { ...Typography.caption, color: Colors.primary, fontWeight: '700' },

  proList:  { paddingRight: Spacing.xl },
  proCard:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
              marginRight: Spacing.md, width: 118, alignItems: 'center',
              borderWidth: 1, borderColor: Colors.sky100 },
  favBtn:   { position: 'absolute', top: Spacing.sm, right: Spacing.sm,
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  proAvatar:{ width: 52, height: 52, borderRadius: 26,
              alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  proInitial: { fontSize: 20, fontWeight: '700', color: Colors.navy },
  verifiedDot:{ position: 'absolute', bottom: -1, right: -1, backgroundColor: '#fff', borderRadius: 8 },
  proName:    { ...Typography.smallBold, color: Colors.ink, textAlign: 'center',
                marginBottom: 4, width: '100%' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  rating:     { ...Typography.smallBold, color: Colors.dark, marginLeft: 3 },
  proJobs:    { ...Typography.caption, color: Colors.ink4 },

  prosEmpty:     { paddingVertical: Spacing.xl, alignItems: 'center' },
  prosEmptyText: { ...Typography.small, color: Colors.ink4 },

  arBanner:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
                   marginHorizontal: Spacing.xl, marginTop: Spacing.xl,
                   borderRadius: Radius.xl, padding: Spacing.lg,
                   borderWidth: 1.5, borderColor: Colors.primarySoft, gap: Spacing.md },
  arBannerIcon:  { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primaryLight,
                   alignItems: 'center', justifyContent: 'center' },
  arBannerText:  { flex: 1 },
  arBannerTitle: { ...Typography.smallBold, color: Colors.ink },
  arBannerSub:   { ...Typography.caption, color: Colors.ink3, marginTop: 2 },

  postBanner:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
                   marginHorizontal: Spacing.xl, marginTop: Spacing.xxl,
                   borderRadius: Radius.xl, padding: Spacing.xl },
  bannerContent: { flex: 1, marginRight: Spacing.md },
  bannerTitle:   { ...Typography.bodyMed, color: '#fff', fontWeight: '700' },
  bannerSub:     { ...Typography.small, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bannerArrow:   { width: 38, height: 38, borderRadius: 19,
                   backgroundColor: 'rgba(255,255,255,0.2)',
                   alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
