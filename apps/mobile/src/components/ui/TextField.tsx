import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  trailingLabel?: string;
  onTrailingPress?: () => void;
}

export default function TextField({
  label,
  error,
  helperText,
  trailingLabel,
  onTrailingPress,
  style,
  ...props
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {trailingLabel && onTrailingPress ? (
          <TouchableOpacity onPress={onTrailingPress}>
            <Text style={styles.trailing}>{trailingLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TextInput
        placeholderTextColor={theme.colors.textSubtle}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  trailing: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primaryStrong,
  },
  input: {
    minHeight: theme.touch.minHeight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  helper: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSubtle,
  },
  error: {
    fontSize: theme.typography.caption,
    color: theme.colors.danger,
  },
});
