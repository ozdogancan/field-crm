import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

interface VisitResultCardProps {
  label: string;
  description: string;
  accentColor: string;
  backgroundColor: string;
  selected?: boolean;
  onPress: () => void;
}

export default function VisitResultCard({
  label,
  description,
  accentColor,
  backgroundColor,
  selected = false,
  onPress,
}: VisitResultCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[
        styles.card,
        {
          backgroundColor: selected ? backgroundColor : theme.colors.surface,
          borderColor: selected ? accentColor : theme.colors.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      <Text style={[styles.label, { color: selected ? accentColor : theme.colors.text }]}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 128,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.pill,
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  description: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
});
