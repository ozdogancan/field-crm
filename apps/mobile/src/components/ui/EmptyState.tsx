import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActionButton from './ActionButton';
import SurfaceCard from './SurfaceCard';
import { theme } from '../../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.titleSm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  description: {
    fontSize: theme.typography.body,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
  action: {
    marginTop: theme.spacing.sm,
  },
});
