import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

interface InfoRowProps {
  label: string;
  value: string;
  muted?: boolean;
}

export default function InfoRow({ label, value, muted = false }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, muted ? styles.valueMuted : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: theme.typography.body,
    lineHeight: 22,
    color: theme.colors.text,
  },
  valueMuted: {
    color: theme.colors.textMuted,
  },
});
