import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';

interface SkeletonBlockProps {
  height: number;
  width?: number | `${number}%` | '100%';
  style?: ViewStyle;
}

export default function SkeletonBlock({ height, width = '100%', style }: SkeletonBlockProps) {
  return <View style={[styles.block, { height, width }, style]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: theme.colors.surfaceStrong,
    borderRadius: theme.radius.sm,
  },
});
