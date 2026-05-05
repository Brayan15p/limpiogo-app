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
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

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
        {pro.is_verified && (
          <View style={styles.verifiedDot}>
            <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
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
  const [topPros, setTopPros] = useState<TopPro[]>([]);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'ahí';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, rating, total_reviews, is_verified, bio')
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
              <Pressable style={styles.avatar} onPress={signOut} hitSlop={8}>
                <Text style={styles.avatarTxt}>
                  {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </Text>
              </Pressable>
            </View>

            {/* Búsqueda */}
            <Pressable style={[styles.search, Shadow.sm]}>
              <Ionicons name="search-outline" size={18} color={Colors.ink3} />
              <Text style={styles.searchPh}>Buscar servicio o limpiador…</Text>
              <View style={styles.filterBtn}>
                <Ionicons name="options-outline" size={16} color={Colors.primary} />
              </View>
            </Pressable>
          </LinearGradient>

          {/* Servicios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Qué necesitas hoy?</Text>
            <View style={styles.grid}>
              {SERVICES.map(s => (
                <Pressable
                  key={s.id}
                  style={[styles.serviceCard, Shadow.card]}
                  onPress={() => navigation.navigate('Booking')}
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
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:  { ...Typography.bodyMed, color: '#fff', fontWeight: '800' },

  search:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
              borderRadius: Radius.full, paddingVertical: 13, paddingHorizontal: Spacing.lg,
              borderWidth: 1, borderColor: Colors.sky200 },
  searchPh: { flex: 1, ...Typography.body, color: Colors.ink4, marginLeft: Spacing.sm },
  filterBtn:{ width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.primarySoft,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

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
