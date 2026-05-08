import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LEVEL_CONFIG, LevelName } from '../hooks/useHomeLevel';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props {
  levelName: LevelName;
  bookingsCompleted: number;
  nextThreshold: number;
  progress: number;
  onPress?: () => void;
  compact?: boolean;
}

export function HomeLevelBadge({ levelName, bookingsCompleted, nextThreshold, progress, onPress, compact }: Props) {
  const cfg = LEVEL_CONFIG[levelName];
  const isMax = levelName === 'legendario';

  if (compact) {
    return (
      <Pressable onPress={onPress} style={styles.compact}>
        <Text style={styles.compactEmoji}>{cfg.emoji}</Text>
        <Text style={[styles.compactLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#EFF6FF', '#DBEAFE']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.row}>
          <Text style={styles.emoji}>{cfg.emoji}</Text>
          <View style={styles.info}>
            <Text style={[styles.levelLabel, { color: cfg.color }]}>{cfg.label}</Text>
            {cfg.discount ? (
              <Text style={styles.discount}>{cfg.discount} activo</Text>
            ) : null}
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{bookingsCompleted} servicios</Text>
          </View>
        </View>

        {!isMax && (
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(1, progress) * 100}%`, backgroundColor: cfg.color }]} />
          </View>
        )}

        {!isMax && (
          <Text style={styles.hint}>
            {nextThreshold - bookingsCompleted} servicios para {LEVEL_CONFIG[nextLevel(levelName)].label} {LEVEL_CONFIG[nextLevel(levelName)].emoji}
          </Text>
        )}
        {isMax && <Text style={styles.hint}>Nivel máximo — eres una leyenda 👑</Text>}
      </LinearGradient>
    </Pressable>
  );
}

function nextLevel(current: LevelName): LevelName {
  const order: LevelName[] = ['basico', 'cuidado', 'premium', 'elite', 'legendario'];
  const idx = order.indexOf(current);
  return order[Math.min(idx + 1, order.length - 1)];
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
  },
  row:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  emoji:     { fontSize: 24 },
  info:      { flex: 1 },
  levelLabel:{ ...Typography.bodyMed, fontWeight: '700' },
  discount:  { ...Typography.small, color: Colors.ok },
  countPill: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  countText: { ...Typography.small, color: Colors.ink2, fontWeight: '600' },
  barBg:     { height: 6, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: Radius.full },
  hint:      { ...Typography.small, color: Colors.ink3 },
  compact:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactEmoji: { fontSize: 14 },
  compactLabel: { ...Typography.small, fontWeight: '700' },
});
