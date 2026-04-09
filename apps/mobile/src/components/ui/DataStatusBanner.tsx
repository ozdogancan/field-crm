import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActionButton from './ActionButton';
import SurfaceCard from './SurfaceCard';
import { StatusTone, theme, toneColors } from '../../theme';

interface DataStatusBannerProps {
  title: string;
  description: string;
  tone?: StatusTone;
  lastUpdatedAt?: string | null;
  actionLabel?: string;
  onAction?: () => void;
}

export default function DataStatusBanner({
  title,
  description,
  tone = 'info',
  lastUpdatedAt,
  actionLabel,
  onAction,
}: DataStatusBannerProps) {
  const palette = toneColors(tone);

  return (
    <SurfaceCard style={[styles.card, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: palette.foreground }]}>{title}</Text>
        <Text style={[styles.description, { color: palette.foreground }]}>{description}</Text>
        {lastUpdatedAt ? (
          <Text style={[styles.timestamp, { color: palette.foreground }]}>
            Son başarılı güncelleme: {new Date(lastUpdatedAt).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} />
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  copy: {
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
  },
  description: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: theme.typography.caption,
    opacity: 0.88,
  },
});
