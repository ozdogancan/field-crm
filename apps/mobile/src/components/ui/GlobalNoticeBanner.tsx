import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStatus } from '../../context/AppStatusContext';
import { theme, toneColors } from '../../theme';

export default function GlobalNoticeBanner() {
  const { notice, clearNotice } = useAppStatus();
  const insets = useSafeAreaInsets();

  if (!notice) return null;

  const palette = toneColors(notice.tone);

  return (
    <Pressable
      onPress={clearNotice}
      style={[styles.wrapper, { top: insets.top + 8 }]}
    >
      <View style={[styles.banner, { backgroundColor: palette.background, borderColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.foreground }]}>{notice.title}</Text>
        <Text style={[styles.message, { color: palette.foreground }]}>{notice.message}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 40,
  },
  banner: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadows.card,
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
