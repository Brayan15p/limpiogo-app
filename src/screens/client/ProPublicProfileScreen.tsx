import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, FlatList,
  Pressable, ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites, useHeartAnim } from '../../hooks/useFavorites';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { VerifiedBadge } from '../../components/VerifiedBadge';

const { width: W } = Dimensions.get('window');
const AVATAR_COLORS = [Colors.sky300, Colors.sky400, Colors.sky200, '#BAE6FD', Colors.primarySoft];

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { full_name: string } | null;
};

type ProProfile = {
  id: string;
  full_name: string;
  bio: string | null;
  rating: number | null;
  total_reviews: number;
  is_verified: boolean;
  phone: string | null;
  verification_status?: import('../../types').VerificationStatus;
  health_certifications?: string[];
};

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={Colors.warn}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const name = review.reviewer?.full_name ?? 'Cliente';
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const date = new Date(review.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewInitials}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewName}>{name.split(' ')[0]}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <StarRow rating={review.rating} size={12} />
      </View>
      {review.comment ? (
        <Text style={styles.reviewComment}>{review.comment}</Text>
      ) : null}
    </View>
  );
}

export function ProPublicProfileScreen({ route, navigation }: any) {
  const { proId } = route.params;
  const { favIds, toggle } = useFavorites();
  const { scale, fire } = useHeartAnim();
  const [pro, setPro] = useState<ProProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({ inputRange: [80, 140], outputRange: [0, 1], extrapolate: 'clamp' });
  const avatarScale  = scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0.7], extrapolate: 'clamp' });

  useEffect(() => {
    Promise.all([
      supabase.from('profiles')
        .select('id, full_name, bio, rating, total_reviews, is_verified, phone, verification_status, health_certifications')
        .eq('id', proId).single(),
      supabase.from('reviews')
        .select('id, rating, comment, created_at, reviewer:reviewer_id(full_name)')
        .eq('pro_id', proId).order('created_at', { ascending: false }).limit(20),
    ]).then(([{ data: p }, { data: r }]) => {
      setPro(p);
      setReviews((r as any) ?? []);
      setLoading(false);
    });
  }, [proId]);

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!pro) return null;

  const bg = AVATAR_COLORS[pro.full_name.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = pro.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const isFav = favIds.has(pro.id);

  const ratingBars = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const pct = reviews.length > 0 ? count / reviews.length : 0;
    return { star, count, pct };
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header flotante scroll */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.floatingHeaderInner}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.floatingBack}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <Text style={styles.floatingName} numberOfLines={1}>{pro.full_name}</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <LinearGradient colors={[Colors.sky100, Colors.sky50, Colors.bg]} style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroNav}>
              <Pressable style={styles.heroBackBtn} onPress={() => navigation.goBack()} hitSlop={8}>
                <Ionicons name="arrow-back" size={20} color={Colors.ink} />
              </Pressable>
              <Pressable
                style={styles.shareBtn}
                onPress={() => { fire(); toggle(pro.id, { pro_id: pro.id, full_name: pro.full_name, rating: pro.rating, total_reviews: pro.total_reviews, bio: pro.bio, is_verified: pro.is_verified }); }}
                hitSlop={8}
              >
                <Animated.View style={{ transform: [{ scale }] }}>
                  <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? Colors.danger : Colors.ink3} />
                </Animated.View>
              </Pressable>
            </View>

            {/* Avatar grande */}
            <View style={styles.heroCenter}>
              <Animated.View style={[styles.heroBigAvatar, { backgroundColor: bg, transform: [{ scale: avatarScale }] }]}>
                <Text style={styles.heroBigInitials}>{initials}</Text>
                {pro.is_verified && (
                  <View style={styles.heroBigVerified}>
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  </View>
                )}
              </Animated.View>
              <Text style={styles.heroName}>{pro.full_name}</Text>
              <VerifiedBadge status={pro.verification_status ?? (pro.is_verified ? 'verified' : 'unverified')} size="md" />
              {pro.bio ? (
                <Text style={styles.heroBio}>{pro.bio}</Text>
              ) : null}
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Stats row */}
        <View style={[styles.statsRow, Shadow.md]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pro.rating ? Number(pro.rating).toFixed(1) : '—'}</Text>
            <View style={{ flexDirection: 'row', marginVertical: 2 }}>
              {pro.rating ? <StarRow rating={pro.rating} size={11} /> : null}
            </View>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pro.total_reviews}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.onlineDot, { backgroundColor: Colors.ok }]} />
            <Text style={styles.statLabel}>Disponible</Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* Certificaciones de salud — F38 */}
          {pro.health_certifications && pro.health_certifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Certificaciones</Text>
              <View style={styles.certBadgesRow}>
                {pro.health_certifications.map(cert => {
                  const MAP: Record<string, { emoji: string; label: string }> = {
                    baby_safe:    { emoji: '👶', label: 'Apta bebés' },
                    pet_friendly: { emoji: '🐾', label: 'Pet-friendly' },
                    anti_allergy: { emoji: '🌿', label: 'Anti-alérgica' },
                    no_toxics:    { emoji: '🌱', label: 'Sin tóxicos' },
                    eco:          { emoji: '♻️', label: 'Eco-friendly' },
                    medical:      { emoji: '🏥', label: 'Desinfección médica' },
                  };
                  const info = MAP[cert];
                  if (!info) return null;
                  return (
                    <View key={cert} style={styles.certBadge}>
                      <Text style={{ fontSize: 14 }}>{info.emoji}</Text>
                      <Text style={styles.certBadgeLabel}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Rating breakdown */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Calificaciones</Text>
              <View style={styles.ratingBreakdown}>
                <View style={styles.bigRatingCol}>
                  <Text style={styles.bigRatingNum}>{Number(pro.rating ?? 0).toFixed(1)}</Text>
                  <StarRow rating={pro.rating ?? 0} size={16} />
                  <Text style={styles.bigRatingTotal}>{pro.total_reviews} reseñas</Text>
                </View>
                <View style={styles.barsCol}>
                  {ratingBars.map(({ star, count, pct }) => (
                    <View key={star} style={styles.barRow}>
                      <Text style={styles.barLabel}>{star}</Text>
                      <Ionicons name="star" size={10} color={Colors.warn} />
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
                      </View>
                      <Text style={styles.barCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Reseñas recientes */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reseñas recientes</Text>
              {reviews.slice(0, 5).map(r => <ReviewCard key={r.id} review={r} />)}
            </View>
          )}

          {reviews.length === 0 && (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsEmoji}>💬</Text>
              <Text style={styles.noReviewsText}>Aún no tiene reseñas</Text>
              <Text style={styles.noReviewsSub}>¡Sé el primero en contratar a {pro.full_name.split(' ')[0]}!</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* CTA fijo abajo */}
      <View style={[styles.ctaBar, Shadow.lg]}>
        {/* F14: Ver disponibilidad */}
        <Pressable
          style={styles.availBtn}
          onPress={() => navigation.navigate('ProCalendar', { proId: pro.id, proName: pro.full_name })}
        >
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.availBtnText}>Ver agenda</Text>
        </Pressable>
        <Pressable
          style={[styles.ctaBtn, { flex: 1 }]}
          onPress={() => navigation.navigate('Booking', { proId: pro.id })}
        >
          <LinearGradient colors={[Colors.primary, Colors.sky500]} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="calendar" size={18} color="#fff" />
            <Text style={styles.ctaText}>Contratar a {pro.full_name.split(' ')[0]}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  loadWrap:{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  floatingHeader:      { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: Colors.surface, borderBottomWidth: 1, borderColor: Colors.border },
  floatingHeaderInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  floatingBack:        { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  floatingName:        { flex: 1, ...Typography.h4, color: Colors.ink, textAlign: 'center', marginHorizontal: Spacing.md },

  hero:     { paddingBottom: Spacing.xxl },
  heroNav:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  heroBackBtn: { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  shareBtn:    { width: 38, height: 38, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  heroCenter:  { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  heroBigAvatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, borderWidth: 3, borderColor: '#fff' },
  heroBigInitials: { fontSize: 34, fontWeight: '800', color: Colors.navy },
  heroBigVerified: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#fff', borderRadius: 12 },
  heroName:        { ...Typography.h2, color: Colors.ink, marginBottom: Spacing.sm, textAlign: 'center' },
  verifiedPill:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySoft, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, marginBottom: Spacing.md },
  verifiedText:    { ...Typography.caption, color: Colors.primary, marginLeft: 4 },
  heroBio:         { ...Typography.body, color: Colors.ink2, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg },

  statsRow:    { flexDirection: 'row', backgroundColor: Colors.surface, marginHorizontal: Spacing.xl, borderRadius: Radius.xl, padding: Spacing.lg, marginTop: -Spacing.lg },
  statItem:    { flex: 1, alignItems: 'center' },
  statNum:     { ...Typography.h3, color: Colors.ink, marginBottom: 2 },
  statLabel:   { ...Typography.caption, color: Colors.ink3, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  onlineDot:   { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },

  body:    { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.md },

  ratingBreakdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.sky100 },
  bigRatingCol:    { alignItems: 'center', marginRight: Spacing.xl, paddingRight: Spacing.xl, borderRightWidth: 1, borderColor: Colors.border },
  bigRatingNum:    { fontSize: 40, fontWeight: '800', color: Colors.ink, lineHeight: 44 },
  bigRatingTotal:  { ...Typography.small, color: Colors.ink3, marginTop: 4 },
  barsCol:         { flex: 1 },
  barRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  barLabel:        { ...Typography.small, color: Colors.ink3, width: 12, textAlign: 'right', marginRight: 4 },
  barTrack:        { flex: 1, height: 6, backgroundColor: Colors.bg, borderRadius: 3, marginHorizontal: 6, overflow: 'hidden' },
  barFill:         { height: '100%', backgroundColor: Colors.warn, borderRadius: 3 },
  barCount:        { ...Typography.small, color: Colors.ink4, width: 16, textAlign: 'right' },

  reviewCard:    { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.sky100 },
  reviewHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  reviewAvatar:  { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.sky200, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  reviewInitials:{ fontSize: 13, fontWeight: '700', color: Colors.navy },
  reviewName:    { ...Typography.smallBold, color: Colors.ink },
  reviewDate:    { ...Typography.caption, color: Colors.ink4 },
  reviewComment: { ...Typography.body, color: Colors.ink2, lineHeight: 22 },

  noReviews:     { alignItems: 'center', paddingVertical: Spacing.xxxl },
  noReviewsEmoji:{ fontSize: 42, marginBottom: Spacing.md },
  noReviewsText: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.sm },
  noReviewsSub:  { ...Typography.body, color: Colors.ink3, textAlign: 'center' },

  ctaBar:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface,
             paddingHorizontal: Spacing.xl, paddingBottom: 32, paddingTop: Spacing.lg,
             borderTopWidth: 1, borderColor: Colors.border, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  availBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.xl,
                  paddingVertical: 16, paddingHorizontal: Spacing.lg,
                  borderWidth: 1.5, borderColor: Colors.primarySoft, backgroundColor: Colors.primaryLight },
  availBtnText: { ...Typography.smallBold, color: Colors.primary },
  ctaBtn:  { borderRadius: Radius.xl, overflow: 'hidden' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  ctaText: { ...Typography.bodyMed, color: '#fff', marginLeft: Spacing.sm, fontWeight: '700' },

  certBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  certBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4,
                   backgroundColor: Colors.okLight, borderRadius: Radius.full,
                   paddingHorizontal: 10, paddingVertical: 4 },
  certBadgeLabel:{ ...Typography.small, color: Colors.ok, fontWeight: '600' },
});
