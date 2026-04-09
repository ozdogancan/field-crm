import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

interface AppHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailingLabel?: string;
  onTrailingPress?: () => void;
}

export default function AppHeader({
  eyebrow,
  title,
  subtitle,
  trailingLabel,
  onTrailingPress,
}: AppHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailingLabel && onTrailingPress ? (
        <TouchableOpacity style={styles.action} onPress={onTrailingPress}>
          <Text style={styles.actionText}>{trailingLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primaryStrong,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: theme.typography.title,
    lineHeight: 30,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: theme.typography.body,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
  action: {
    minHeight: theme.touch.minHeight,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
});
