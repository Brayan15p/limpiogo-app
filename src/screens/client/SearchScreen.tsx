import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, FlatList, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';
import { VerifiedBadge } from '../../components/VerifiedBadge';

const { width: W } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all',    label: 'Todos',    emoji: '✨' },
  { id: 'basic',  label: 'Básica',   emoji: '🧹' },
  { id: 'deep',   label: 'Profunda', emoji: '🫧' },
  { id: 'move',   label: 'Mudanza',  emoji: '📦' },
  { id: 'office', label: 'Oficinas', emoji: '🏢' },
];

const SORT_OPTIONS = [
  { id: 'rating', label: 'Mejor calificados' },
  { id: 'price',  label: 'Menor precio' },
  { id: 'reviews', label: 'Más reseñas' },
];

const AVATAR_COLORS = [Colors.sky300, Colors.sky400, Colors.sky200, '#BAE6FD', Colors.primarySoft];

type Pro = {
  id: string;
  full_name: string;
  rating: number | null;
  total_reviews: number;
  is_verified: boolean;
  verification_status?: import('../../types').VerificationStatus;
  bio: string | null;
};

function ProListCard({ pro, onPress }: { pro: Pro; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bg = AVATAR_COLORS[pro.full_name.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = pro.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.proCard, Shadow.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.proAvatar, { backgroundColor: bg }]}>
          <Text style={styles.proInitials}>{initials}</Text>
          {(pro.verification_status === 'verified' || pro.is_verified) && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            </View>
          )}
        </View>

        <View style={styles.proInfo}>
          <View style={styles.proNameRow}>
            <Text style={styles.proName} numberOfLines={1}>{pro.full_name}</Text>
            <VerifiedBadge
              status={pro.verification_status ?? (pro.is_verified ? 'verified' : 'unverified')}
              size="sm"
            />
          </View>
          {pro.bio ? (
            <Text style={styles.proBio} numberOfLines={2}>{pro.bio}</Text>
          ) : (
            <Text style={styles.proBio}>Profesional de limpieza disponible</Text>
          )}
          <View style={styles.proMeta}>
            {pro.rating ? (
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={11} color={Colors.warn} />
                <Text style={styles.ratingText}>{Number(pro.rating).toFixed(1)}</Text>
              </View>
            ) : null}
            <Text style={styles.reviewCount}>
              {pro.total_reviews > 0 ? `${pro.total_reviews} reseñas` : 'Nuevo'}
            </Text>
          </View>
        </View>

        <View style={styles.arrowWrap}>
          <Ionicons name="chevron-forward" size={16} color={Colors.ink4} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const HEALTH_FILTERS = [
  { id: 'baby_safe',    label: 'Apta bebés',    emoji: '👶' },
  { id: 'pet_friendly', label: 'Pet-friendly',  emoji: '🐾' },
  { id: 'anti_allergy', label: 'Anti-alérgica', emoji: '🌿' },
  { id: 'no_toxics',    label: 'Sin tóxicos',   emoji: '🌱' },
  { id: 'eco',          label: 'Eco',           emoji: '♻️' },
];

export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);
    Animated.spring(filterAnim, { toValue, useNativeDriver: false, speed: 14, bounciness: 4 }).start();
  };

  const filterHeight = filterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] });

  const fetchPros = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('profiles')
      .select('id, full_name, rating, total_reviews, is_verified, bio, verification_status, health_certifications')
      .eq('role', 'pro');

    if (query.trim()) {
      q = q.ilike('full_name', `%${query.trim()}%`);
    }
    if (healthFilter) {
      q = q.contains('health_certifications', [healthFilter]);
    }
    if (sortBy === 'rating') q = q.order('rating', { ascending: false });
    else if (sortBy === 'reviews') q = q.order('total_reviews', { ascending: false });

    const { data } = await q.limit(40);
    setPros(data ?? []);
    setLoading(false);
  }, [query, category, sortBy, healthFilter]);

  useEffect(() => {
    const t = setTimeout(fetchPros, 350);
    return () => clearTimeout(t);
  }, [fetchPros]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.sky50} />
      <SafeAreaView edges={['top']} style={styles.safe}>

        {/* Header buscador */}
        <LinearGradient colors={[Colors.sky100, Colors.sky50]} style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={Colors.ink} />
            </Pressable>
            <View style={[styles.searchBox, Shadow.sm]}>
              <Ionicons name="search" size={17} color={Colors.primary} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Buscar limpiador o servicio…"
                placeholderTextColor={Colors.ink4}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={6}>
                  <Ionicons name="close-circle" size={17} color={Colors.ink3} />
                </Pressable>
              )}
            </View>
            <Pressable
              style={[styles.filterIconBtn, showFilters && styles.filterIconActive]}
              onPress={toggleFilters}
              hitSlop={6}
            >
              <Ionicons name="options" size={18} color={showFilters ? '#fff' : Colors.primary} />
            </Pressable>
          </View>

          {/* Categorías */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c.id}
                style={[styles.catChip, category === c.id && styles.catChipActive]}
                onPress={() => setCategory(c.id)}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, category === c.id && styles.catLabelActive]}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Panel filtros */}
          <Animated.View style={[styles.filterPanel, { height: filterHeight, overflow: 'hidden' }]}>
            <View style={styles.filterPanelInner}>
              <Text style={styles.filterTitle}>Ordenar por</Text>
              <View style={styles.sortRow}>
                {SORT_OPTIONS.map(o => (
                  <Pressable
                    key={o.id}
                    style={[styles.sortChip, sortBy === o.id && styles.sortChipActive]}
                    onPress={() => setSortBy(o.id)}
                  >
                    <Text style={[styles.sortLabel, sortBy === o.id && styles.sortLabelActive]}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.filterTitle, { marginTop: Spacing.sm }]}>Certificación de salud</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sortRow}>
                  <Pressable
                    style={[styles.sortChip, healthFilter === null && styles.sortChipActive]}
                    onPress={() => setHealthFilter(null)}
                  >
                    <Text style={[styles.sortLabel, healthFilter === null && styles.sortLabelActive]}>Todos</Text>
                  </Pressable>
                  {HEALTH_FILTERS.map(f => (
                    <Pressable
                      key={f.id}
                      style={[styles.sortChip, healthFilter === f.id && styles.sortChipActive]}
                      onPress={() => setHealthFilter(healthFilter === f.id ? null : f.id)}
                    >
                      <Text style={[styles.sortLabel, healthFilter === f.id && styles.sortLabelActive]}>
                        {f.emoji} {f.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Resultados */}
        {loading ? (
          <View style={styles.loadWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={pros}
            keyExtractor={p => p.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={styles.resultCount}>
                {pros.length} {pros.length === 1 ? 'resultado' : 'resultados'}
              </Text>
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySub}>Intenta con otro nombre o categoría</Text>
              </View>
            }
            renderItem={({ item }) => (
              <ProListCard
                pro={item}
                onPress={() => navigation.navigate('ProPublicProfile', { proId: item.id })}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },

  backBtn: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.sky200,
  },
  searchInput: { flex: 1, ...Typography.body, color: Colors.ink, marginHorizontal: Spacing.sm, padding: 0 },
  filterIconBtn: {
    width: 38, height: 38, borderRadius: Radius.md, marginLeft: Spacing.sm,
    backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  filterIconActive: { backgroundColor: Colors.primary },

  catList: { paddingRight: Spacing.md },
  catChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, backgroundColor: Colors.surface, marginRight: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catEmoji:  { fontSize: 13, marginRight: 5 },
  catLabel:  { ...Typography.smallBold, color: Colors.ink2 },
  catLabelActive: { color: '#fff' },

  filterPanel:      { marginTop: Spacing.sm },
  filterPanelInner: { paddingTop: Spacing.sm },
  filterTitle:      { ...Typography.caption, color: Colors.ink3, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  sortRow:          { flexDirection: 'row', flexWrap: 'wrap' },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    backgroundColor: Colors.surface, marginRight: Spacing.sm, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primarySoft },
  sortLabel:      { ...Typography.small, color: Colors.ink2 },
  sortLabelActive: { color: Colors.primary, fontWeight: '700' },

  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list:        { padding: Spacing.xl },
  resultCount: { ...Typography.caption, color: Colors.ink3, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },

  proCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.sky100,
  },
  proAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  proInitials: { fontSize: 18, fontWeight: '700', color: Colors.navy },
  verifiedBadge: { position: 'absolute', bottom: -1, right: -1, backgroundColor: '#fff', borderRadius: 8 },

  proInfo:    { flex: 1, marginLeft: Spacing.md },
  proNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  proName:    { ...Typography.bodyMed, color: Colors.ink, flex: 1 },
  verifiedPill: { backgroundColor: Colors.primarySoft, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  verifiedText: { ...Typography.caption, color: Colors.primary },
  proBio:       { ...Typography.small, color: Colors.ink3, marginBottom: 6, lineHeight: 18 },
  proMeta:      { flexDirection: 'row', alignItems: 'center' },
  ratingChip:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warnLight, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  ratingText:   { ...Typography.smallBold, color: '#92400E', marginLeft: 3 },
  reviewCount:  { ...Typography.small, color: Colors.ink3 },
  arrowWrap:    { marginLeft: Spacing.sm },

  emptyWrap:  { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h4, color: Colors.ink, marginBottom: Spacing.sm },
  emptySub:   { ...Typography.body, color: Colors.ink3, textAlign: 'center' },
});
