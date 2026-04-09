import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusTone, theme, toneColors } from '../../theme';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

export default function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  const palette = toneColors(tone);

  return (
    <View style={[styles.badge, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  label: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
  },
});
