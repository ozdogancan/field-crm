import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StatusBadge from './StatusBadge';
import SurfaceCard from './SurfaceCard';
import { theme } from '../../theme';

interface ProspectCardProps {
  order: number;
  companyName: string;
  contactPerson?: string;
  address?: string;
  statusLabel: string;
  statusTone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  disabled?: boolean;
  onPress: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
}

export default function ProspectCard({
  order,
  companyName,
  contactPerson,
  address,
  statusLabel,
  statusTone = 'neutral',
  disabled = false,
  onPress,
  actionLabel,
  onActionPress,
}: ProspectCardProps) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} activeOpacity={0.9}>
      <SurfaceCard style={[styles.card, disabled ? styles.disabled : null]} elevated>
        <View style={styles.header}>
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{order}</Text>
          </View>
          <View style={styles.copy}>
            <Text style={styles.company}>{companyName}</Text>
            {contactPerson ? <Text style={styles.contact}>{contactPerson}</Text> : null}
          </View>
          <StatusBadge label={statusLabel} tone={statusTone} />
        </View>
        {address ? <Text style={styles.address} numberOfLines={2}>{address}</Text> : null}
        {actionLabel && onActionPress ? (
          <View style={styles.footer}>
            <Text style={styles.detailLabel}>Detay</Text>
            <TouchableOpacity onPress={onActionPress} style={styles.actionButton} disabled={disabled}>
              <Text style={styles.actionLabel}>{actionLabel}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </SurfaceCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    color: theme.colors.surface,
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  company: {
    fontSize: theme.typography.bodyLg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  contact: {
    fontSize: theme.typography.bodySm,
    color: theme.colors.textMuted,
  },
  address: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primaryStrong,
  },
  actionButton: {
    minHeight: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryStrong,
  },
  disabled: {
    opacity: 0.6,
  },
});
