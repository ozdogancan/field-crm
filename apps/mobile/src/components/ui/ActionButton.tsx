import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}: ActionButtonProps) {
  const palette = palettes[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        fullWidth ? styles.fullWidth : null,
        { backgroundColor: palette.background, borderColor: palette.border },
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.foreground} />
      ) : (
        <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const palettes = {
  primary: {
    background: theme.colors.primary,
    border: theme.colors.primary,
    foreground: theme.colors.surface,
  },
  secondary: {
    background: theme.colors.surface,
    border: theme.colors.borderStrong,
    foreground: theme.colors.text,
  },
  success: {
    background: theme.colors.success,
    border: theme.colors.success,
    foreground: theme.colors.surface,
  },
  danger: {
    background: theme.colors.danger,
    border: theme.colors.danger,
    foreground: theme.colors.surface,
  },
  ghost: {
    background: 'transparent',
    border: 'transparent',
    foreground: theme.colors.textMuted,
  },
} as const;

const styles = StyleSheet.create({
  button: {
    minHeight: theme.touch.minHeight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  disabled: {
    opacity: 0.55,
  },
});
