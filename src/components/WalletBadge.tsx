import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useWallet } from '../contexts/WalletContext';
import { Colors, Radius, Typography } from '../theme';

interface WalletBadgeProps {
  onPress: () => void;
}

export function WalletBadge({ onPress }: WalletBadgeProps) {
  const { wallet, formatBalance } = useWallet();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevBalance = useRef<number | null>(null);

  // Bounce animation cuando el saldo sube
  useEffect(() => {
    if (wallet === null) return;
    if (prevBalance.current !== null && wallet.balance > prevBalance.current) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.18, useNativeDriver: true, speed: 40, bounciness: 18 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }),
      ]).start();
    }
    prevBalance.current = wallet.balance;
  }, [wallet?.balance]);

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="wallet" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
        <Text style={styles.label} numberOfLines={1}>
          {wallet ? formatBalance() : '—'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    ...Typography.smallBold,
    color: Colors.primary,
    maxWidth: 90,
  },
});
