import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator, Animated, FlatList, Pressable,
  RefreshControl, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FavPro, useFavorites, useHeartAnim } from '../../hooks/useFavorites';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../theme';

function FavCard({ item, onRemove, onBook }: {
  item: FavPro;
  onRemove: () => void;
  onBook: () => void;
}) {
  const { scale, fire } = useHeartAnim();
  const initials = item.full_name
    .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const COLORS = [Colors.sky300, Colors.sky400, Colors.sky200, '#BAE6FD'];
  const bg = COLORS[item.full_name.charCodeAt(0) % COLORS.length];

  return (
    <View style={[styles.card, Shadow.sm]}>
      <View style={[styles.avatar, { backgroundColor: bg }]}>
        <Text style={styles.avatarText}>{initials}</Text>
        {item.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.full_name}</Text>
        {item.bio ? (
          <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
        ) : null}
        <View style={styles.metaRow}>
          {item.rating ? (
            <>
              <Ionicons name="star" size={12} color={Colors.warn} />
              <Text style={styles.rating}>{Number(item.rating).toFixed(1)}</Text>
              {item.total_reviews > 0 && (
                <Text style={styles.reviews}>({item.total_reviews})</Text>
              )}
            </>
          ) : (
            <Text style={styles.newPro}>Nuevo profesional</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {/* Corazón animado */}
        <Pressable
          hitSlop={8}
          onPress={() => { fire(); onRemove(); }}
          style={styles.heartBtn}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="heart" size={18} color={Colors.danger} />
          </Animated.View>
        </Pressable>

        <Pressable style={[styles.bookBtn, Shadow.sm]} onPress={onBook}>
          <Text style={styles.bookBtnText}>Contratar</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function FavoritesScreen({ navigation }: any) {
  const { favPros, loading, toggle, reload } = useFavorites();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Favoritos</Text>
          <Text style={styles.sub}>
            {favPros.length > 0
              ? `${favPros.length} guardado${favPros.length !== 1 ? 's' : ''}`
              : 'Ninguno aún'}
          </Text>
        </View>

        <FlatList
          data={favPros}
          keyExtractor={f => f.pro_id}
          renderItem={({ item }) => (
            <FavCard
              item={item}
              onRemove={() => toggle(item.pro_id)}
              onBook={() => navigation.navigate('Booking')}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={36} color={Colors.ink4} />
              </View>
              <Text style={styles.emptyTitle}>Sin favoritos aún</Text>
              <Text style={styles.emptySub}>
                Guarda a tus limpiadores preferidos para contratarlos con un toque
              </Text>
              <Pressable
                style={[styles.exploreBtn, Shadow.sm]}
                onPress={() => navigation.getParent()?.navigate('Home')}
              >
                <Ionicons name="search-outline" size={16} color="#fff" />
                <Text style={styles.exploreBtnText}>Explorar profesionales</Text>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.ink },
  sub:   { ...Typography.small, color: Colors.ink3, marginTop: 2 },
  list:  { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.md, paddingTop: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.sky100, gap: Spacing.md,
  },
  avatar:       { width: 54, height: 54, borderRadius: 27,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:   { fontSize: 20, fontWeight: '800', color: Colors.navy },
  verifiedBadge:{ position: 'absolute', bottom: -2, right: -2,
                  backgroundColor: '#fff', borderRadius: 8 },
  info:         { flex: 1 },
  name:         { ...Typography.bodyMed, color: Colors.ink },
  bio:          { ...Typography.small, color: Colors.ink3, marginTop: 1 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating:       { ...Typography.caption, color: Colors.dark, fontWeight: '700' },
  reviews:      { ...Typography.caption, color: Colors.ink3 },
  newPro:       { ...Typography.caption, color: Colors.ink4 },

  actions:  { alignItems: 'center', gap: Spacing.sm },
  heartBtn: { width: 34, height: 34, borderRadius: 17,
              backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center' },
  bookBtn:  { backgroundColor: Colors.primary, borderRadius: Radius.md,
              paddingVertical: 7, paddingHorizontal: 12 },
  bookBtnText: { ...Typography.caption, color: '#fff', fontWeight: '700' },

  empty:     { alignItems: 'center', paddingTop: 64, gap: Spacing.md, paddingHorizontal: Spacing.xxl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight,
               alignItems: 'center', justifyContent: 'center' },
  emptyTitle:{ ...Typography.h4, color: Colors.ink },
  emptySub:  { ...Typography.small, color: Colors.ink3, textAlign: 'center', lineHeight: 20 },
  exploreBtn:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
               backgroundColor: Colors.primary, borderRadius: Radius.lg,
               paddingVertical: 12, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  exploreBtnText: { ...Typography.bodyMed, color: '#fff' },
});
