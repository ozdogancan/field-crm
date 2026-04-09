import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SurfaceCard from './SurfaceCard';
import { StatusTone, theme, toneColors } from '../../theme';

interface StatCardProps {
  label: string;
  value: string;
  tone?: StatusTone;
}

export default function StatCard({ label, value, tone = 'primary' }: StatCardProps) {
  const palette = toneColors(tone);

  return (
    <SurfaceCard style={styles.card}>
      <View style={[styles.dot, { backgroundColor: palette.foreground }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: theme.spacing.sm,
    minHeight: 112,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.pill,
  },
  label: {
    fontSize: theme.typography.bodySm,
    color: theme.colors.textMuted,
  },
  value: {
    fontSize: theme.typography.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
});
