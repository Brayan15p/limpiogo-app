import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
  password?: boolean;
}

export function Input({ label, icon, error, hint, password, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.box,
        focused && styles.boxFocused,
        !!error && styles.boxError,
        Shadow.sm,
      ]}>
        {icon && (
          <Ionicons name={icon} size={17}
            color={focused ? Colors.primary : Colors.ink3}
            style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.ink4}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={password && !show}
          {...rest}
        />
        {password && (
          <TouchableOpacity onPress={() => setShow(v => !v)} style={styles.eye}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={17} color={Colors.ink3} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  label: {
    ...Typography.smallBold, color: Colors.ink2,
    marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  box: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, minHeight: 52,
  },
  boxFocused: { borderColor: Colors.primary, backgroundColor: Colors.sky50 },
  boxError: { borderColor: Colors.danger },
  icon: { marginRight: Spacing.sm },
  input: { flex: 1, ...Typography.body, color: Colors.ink, paddingVertical: Spacing.md },
  eye: { padding: Spacing.xs },
  error: { ...Typography.small, color: Colors.danger, marginTop: Spacing.xs },
  hint: { ...Typography.small, color: Colors.ink3, marginTop: Spacing.xs },
});
