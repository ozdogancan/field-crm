import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StatusBadge from './StatusBadge';
import SurfaceCard from './SurfaceCard';
import { theme } from '../../theme';

interface StickyBannerProps {
  title: string;
  description: string;
  badge?: string;
  onPress?: () => void;
}

export default function StickyBanner({ title, description, badge, onPress }: StickyBannerProps) {
  const pulse = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.96,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={0.9}>
      <SurfaceCard elevated style={styles.card}>
        <View style={styles.header}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulse }] }]} />
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
          {badge ? <StatusBadge label={badge} tone="warning" /> : null}
        </View>
      </SurfaceCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.warningSoft,
    borderColor: '#F4D59C',
    paddingVertical: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.warning,
    marginTop: 3,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  description: {
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
  },
});
