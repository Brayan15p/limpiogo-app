import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Typography } from '../theme';
import type { VerificationStatus } from '../types';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  status?: VerificationStatus;
  size?: Size;
  showLabel?: boolean;
}

const CONFIG: Record<Size, { icon: number; fontSize: number; padding: [number, number] }> = {
  sm: { icon: 10, fontSize: 10, padding: [3, 6] },
  md: { icon: 12, fontSize: 11, padding: [4, 8] },
  lg: { icon: 14, fontSize: 13, padding: [6, 10] },
};

export function VerifiedBadge({ status = 'unverified', size = 'md', showLabel = true }: Props) {
  if (status === 'unverified') return null;

  const cfg = CONFIG[size];

  if (status === 'pending') {
    return (
      <View style={[
        styles.badge,
        { backgroundColor: Colors.warnLight, paddingVertical: cfg.padding[0], paddingHorizontal: cfg.padding[1] },
      ]}>
        <Ionicons name="time" size={cfg.icon} color={Colors.warn} />
        {showLabel && (
          <Text style={[styles.label, { fontSize: cfg.fontSize, color: Colors.warn }]}>
            En revisión
          </Text>
        )}
      </View>
    );
  }

  if (status === 'rejected') {
    return (
      <View style={[
        styles.badge,
        { backgroundColor: Colors.dangerLight, paddingVertical: cfg.padding[0], paddingHorizontal: cfg.padding[1] },
      ]}>
        <Ionicons name="close-circle" size={cfg.icon} color={Colors.danger} />
        {showLabel && (
          <Text style={[styles.label, { fontSize: cfg.fontSize, color: Colors.danger }]}>
            Rechazado
          </Text>
        )}
      </View>
    );
  }

  // verified
  return (
    <View style={[
      styles.badge,
      { backgroundColor: Colors.primaryLight, paddingVertical: cfg.padding[0], paddingHorizontal: cfg.padding[1] },
    ]}>
      <Ionicons name="shield-checkmark" size={cfg.icon} color={Colors.primary} />
      {showLabel && (
        <Text style={[styles.label, { fontSize: cfg.fontSize, color: Colors.primary }]}>
          Verificado
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.smallBold,
    fontWeight: '700',
  },
});
