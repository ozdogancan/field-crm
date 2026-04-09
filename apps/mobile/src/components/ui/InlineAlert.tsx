import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusTone, theme, toneColors } from '../../theme';

interface InlineAlertProps {
  title?: string;
  message: string;
  tone?: StatusTone;
}

export default function InlineAlert({ title, message, tone = 'danger' }: InlineAlertProps) {
  const palette = toneColors(tone);

  return (
    <View style={[styles.alert, { backgroundColor: palette.background, borderColor: palette.border }]}>
      {title ? <Text style={[styles.title, { color: palette.foreground }]}>{title}</Text> : null}
      <Text style={[styles.message, { color: palette.foreground }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
  },
  message: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
  },
});
