import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Spacing, Typography } from '../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  label, onPress, variant = 'primary', loading, disabled, icon, fullWidth = true, size = 'lg',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const pad = size === 'sm' ? { py: 10, px: 16 } : size === 'md' ? { py: 13, px: 20 } : { py: 17, px: 24 };

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
        styles.wrap, fullWidth && styles.full,
        isDisabled && styles.disabled, pressed && styles.pressed,
      ]}>
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={[styles.gradBtn, { paddingVertical: pad.py, paddingHorizontal: pad.px }]}
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <View style={styles.row}>
                {icon}
                <Text style={[styles.label, styles.labelPrimary, size === 'sm' && styles.labelSm]}>{label}</Text>
              </View>
          }
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={isDisabled} style={({ pressed }) => [
      styles.btn,
      styles[variant] as any,
      { paddingVertical: pad.py, paddingHorizontal: pad.px },
      fullWidth && styles.full,
      isDisabled && styles.disabled,
      pressed && styles.pressed,
    ]}>
      {loading
        ? <ActivityIndicator color="#2563EB" size="small" />
        : <View style={styles.row}>
            {icon}
            <Text style={[
              styles.label,
              variant === 'secondary' && styles.labelSecondary,
              variant === 'ghost' && styles.labelGhost,
              variant === 'danger' && styles.labelDanger,
              size === 'sm' && styles.labelSm,
            ]}>{label}</Text>
          </View>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.full, overflow: 'hidden' },
  full: { width: '100%' },
  gradBtn: {
    borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center',
    // Sombra CTA azul — igual al original
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38, shadowRadius: 14, elevation: 10,
  },
  btn: {
    borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center',
  },
  secondary: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#BAE6FD',
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#FEE2E2', borderWidth: 1.5, borderColor: '#DC2626' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.87, transform: [{ scale: 0.98 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { ...Typography.bodyMed, fontWeight: '700', letterSpacing: -0.2 },
  labelPrimary: { color: '#fff' },
  labelSecondary: { color: '#0F172A' },
  labelGhost: { color: '#2563EB' },
  labelDanger: { color: '#DC2626' },
  labelSm: { fontSize: 13 },
});
