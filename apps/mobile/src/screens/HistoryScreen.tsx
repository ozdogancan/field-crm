import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/ui/AppHeader';
import ActiveVisitBanner from '../components/ui/ActiveVisitBanner';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import RouteListSkeleton from '../components/ui/RouteListSkeleton';
import ScreenContainer from '../components/ui/ScreenContainer';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import SurfaceCard from '../components/ui/SurfaceCard';
import { theme } from '../theme';
import { getMyVisitHistory } from '../lib/api';

interface VisitHistoryItem {
  id: string;
  startTime: string;
  endTime?: string | null;
  result?: string | null;
  status: string;
  durationMinutes?: number | null;
  prospect?: {
    companyName: string;
    contactPerson?: string | null;
    address?: string | null;
  } | null;
}

const filters = [
  { key: 'all', label: 'Tümü' },
  { key: 'completed', label: 'Tamamlandı' },
  { key: 'cancelled', label: 'İptal' },
] as const;

export default function HistoryScreen() {
  const [items, setItems] = useState<VisitHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]['key']>('all');

  const loadHistory = useCallback(async (filter = selectedFilter) => {
    try {
      setErrorMessage('');
      const res = await getMyVisitHistory({
        limit: 30,
        status: filter === 'all' ? undefined : filter,
      });

      if (res.success && res.data) {
        setItems(res.data as VisitHistoryItem[]);
      } else {
        setItems([]);
        setErrorMessage(res.error?.message || res.message || 'Geçmiş ziyaretler yüklenemedi.');
      }
    } catch (error) {
      setErrorMessage('Geçmiş ziyaretler yüklenemedi.');
    }
    setLoading(false);
  }, [selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadHistory(selectedFilter);
    }, [loadHistory, selectedFilter]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory(selectedFilter);
    setRefreshing(false);
  };

  const toneForStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success' as const;
      case 'cancelled':
        return 'danger' as const;
      case 'started':
        return 'warning' as const;
      default:
        return 'neutral' as const;
    }
  };

  const labelForStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      case 'started':
        return 'Aktif';
      default:
        return status;
    }
  };

  const labelForResult = (result?: string | null) => {
    switch (result) {
      case 'positive':
        return 'Yatkın';
      case 'neutral':
        return 'Nötr';
      case 'negative':
        return 'Yatkın Değil';
      default:
        return 'Sonuç yok';
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.content}
      >
        <AppHeader
          eyebrow="Geçmiş"
          title="Ziyaret geçmişi"
          subtitle="Son ziyaretleri hızlıca tarayın, sonuçları net görün."
        />

        <ActiveVisitBanner />

        <SectionHeader title="Filtre" subtitle="Duruma göre daraltın" />
        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const selected = selectedFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                onPress={() => {
                  setSelectedFilter(filter.key);
                  setLoading(true);
                  loadHistory(filter.key);
                }}
              >
                <Text style={[styles.filterLabel, selected ? styles.filterLabelSelected : null]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorMessage ? (
          <InlineAlert
            title="Geçmiş verisi alınamadı"
            message={errorMessage}
            tone="warning"
          />
        ) : null}

        {refreshing ? (
          <InlineAlert
            message="Geçmiş ziyaret listesi yenileniyor."
            tone="info"
          />
        ) : null}

        {loading ? (
          <RouteListSkeleton count={3} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Geçmiş ziyaret yok"
            description="Henüz bu filtre için kayıt görünmüyor. Ziyaret tamamlandıkça burada listelenecek."
            actionLabel="Tekrar Dene"
            onAction={() => {
              setLoading(true);
              loadHistory(selectedFilter);
            }}
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <SurfaceCard key={item.id} elevated style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.companyName}>{item.prospect?.companyName || 'Müşteri'}</Text>
                    <Text style={styles.metaText}>
                      {new Date(item.startTime).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <StatusBadge label={labelForStatus(item.status)} tone={toneForStatus(item.status)} />
                </View>

                <Text style={styles.address} numberOfLines={2}>
                  {item.prospect?.address || 'Adres bilgisi yok'}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillLabel}>Sonuç</Text>
                    <Text style={styles.metaPillValue}>{labelForResult(item.result)}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillLabel}>Süre</Text>
                    <Text style={styles.metaPillValue}>
                      {item.durationMinutes ? `${item.durationMinutes} dk` : '-'}
                    </Text>
                  </View>
                </View>
              </SurfaceCard>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
    gap: theme.spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterChip: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  filterLabel: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textMuted,
  },
  filterLabelSelected: {
    color: theme.colors.primaryStrong,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  cardCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  companyName: {
    fontSize: theme.typography.bodyLg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  metaText: {
    fontSize: theme.typography.bodySm,
    color: theme.colors.textMuted,
  },
  address: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metaPill: {
    flex: 1,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metaPillLabel: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaPillValue: {
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
});
