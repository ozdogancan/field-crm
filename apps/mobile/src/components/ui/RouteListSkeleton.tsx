import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkeletonBlock from './SkeletonBlock';
import SurfaceCard from './SurfaceCard';
import { theme } from '../../theme';

interface RouteListSkeletonProps {
  count?: number;
}

export default function RouteListSkeleton({ count = 3 }: RouteListSkeletonProps) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SurfaceCard key={index} style={styles.card}>
          <View style={styles.row}>
            <SkeletonBlock height={36} width={36} style={styles.round} />
            <View style={styles.copy}>
              <SkeletonBlock height={18} width="72%" />
              <SkeletonBlock height={14} width="42%" />
            </View>
            <SkeletonBlock height={28} width={84} style={styles.badge} />
          </View>
          <SkeletonBlock height={14} width="88%" />
          <SkeletonBlock height={14} width="46%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  round: {
    borderRadius: theme.radius.pill,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  badge: {
    borderRadius: theme.radius.pill,
  },
});
