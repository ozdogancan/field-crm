import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../../theme';

interface SurfaceCardProps extends ViewProps {
  elevated?: boolean;
}

export default function SurfaceCard({ children, style, elevated = false, ...props }: SurfaceCardProps) {
  return (
    <View style={[styles.card, elevated ? styles.elevated : null, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  elevated: {
    ...theme.shadows.card,
  },
});
