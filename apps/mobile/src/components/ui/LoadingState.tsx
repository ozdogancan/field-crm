import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../theme';

interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = 'Veriler hazırlanıyor...' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing['2xl'],
  },
  label: {
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
