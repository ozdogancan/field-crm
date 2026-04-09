import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../context/ToastContext';
import { theme, toneColors } from '../../theme';

export default function ToastViewport() {
  const { toast, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (!toast) return null;

  const palette = toneColors(toast.tone);

  return (
    <Pressable
      onPress={hideToast}
      style={[
        styles.wrapper,
        {
          top: insets.top + theme.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: palette.background,
            borderColor: palette.border,
            opacity: toast.visible ? 1 : 0,
          },
        ]}
      >
        {toast.title ? <Text style={[styles.title, { color: palette.foreground }]}>{toast.title}</Text> : null}
        <Text style={[styles.message, { color: palette.foreground }]}>{toast.message}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 50,
  },
  toast: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadows.lift,
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
