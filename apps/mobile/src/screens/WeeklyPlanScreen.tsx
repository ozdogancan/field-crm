import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ActiveVisitBanner from '../components/ui/ActiveVisitBanner';
import AppHeader from '../components/ui/AppHeader';
import DataStatusBanner from '../components/ui/DataStatusBanner';
import EmptyState from '../components/ui/EmptyState';
import ProspectCard from '../components/ui/ProspectCard';
import RouteListSkeleton from '../components/ui/RouteListSkeleton';
import ScreenContainer from '../components/ui/ScreenContainer';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import SurfaceCard from '../components/ui/SurfaceCard';
import { readCache, writeCache } from '../lib/cache';
import { getMyCurrentPlan } from '../lib/api';
import { StatusTone, theme } from '../theme';

interface PlanItem {
  id: string;
  prospectId: string;
  visitOrder: number;
  plannedDate: string;
  status: string;
  prospect: {
    id: string;
    companyName: string;
    contactPerson: string;
    address: string;
  } | null;
}

interface Plan {
  id: string;
  year: number;
  weekNumber: number;
  items: PlanItem[];
}

const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const weeklySegments = [
  { key: 'day', label: 'Günlük' },
  { key: 'pending', label: 'Bekleyen' },
  { key: 'completed', label: 'Tamamlanan' },
] as const;

export default function WeeklyPlanScreen() {
  const WEEKLY_PLAN_CACHE_KEY = 'mobile_weekly_plan';
  const navigation = useNavigation<any>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<(typeof weeklySegments)[number]['key']>('day');
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);

  const loadPlan = useCallback(async () => {
    try {
      setErrorMessage('');
      const res = await getMyCurrentPlan();
      if (res.success) {
        const nextPlan = (res.data as Plan) || null;
        const updatedAt = new Date().toISOString();
        setPlan(nextPlan);
        setLastUpdatedAt(updatedAt);
        setIsShowingCachedData(false);
        await writeCache(WEEKLY_PLAN_CACHE_KEY, {
          plan: nextPlan,
          lastUpdatedAt: updatedAt,
        });
      } else {
        setPlan(null);
        setErrorMessage(res.error?.message || res.message || 'Haftalık plan yüklenemedi.');
        const cached = await readCache<{ plan: Plan | null; lastUpdatedAt: string }>(WEEKLY_PLAN_CACHE_KEY);
        if (cached) {
          setPlan(cached.plan);
          setLastUpdatedAt(cached.lastUpdatedAt);
          setIsShowingCachedData(true);
        }
      }
    } catch {
      setErrorMessage('Haftalık plan yüklenemedi.');
      const cached = await readCache<{ plan: Plan | null; lastUpdatedAt: string }>(WEEKLY_PLAN_CACHE_KEY);
      if (cached) {
        setPlan(cached.plan);
        setLastUpdatedAt(cached.lastUpdatedAt);
        setIsShowingCachedData(true);
      }
    }
    setLoading(false);
  }, [WEEKLY_PLAN_CACHE_KEY]);

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  };

  const groupedItems = useMemo(() => {
    const groups = Array.from({ length: 7 }, () => [] as PlanItem[]);
    (plan?.items || []).forEach((item) => {
      const date = new Date(item.plannedDate);
      const jsDay = date.getDay();
      const index = jsDay === 0 ? 6 : jsDay - 1;
      groups[index].push(item);
    });
    return groups.map((group) => group.sort((a, b) => a.visitOrder - b.visitOrder));
  }, [plan]);

  const selectedItems = groupedItems[selectedDay] || [];
  const selectedCompleted = selectedItems.filter((item) => item.status === 'visited').length;
  const selectedPending = selectedItems.filter((item) => item.status === 'pending').length;
  const visibleItems =
    selectedSegment === 'pending'
      ? selectedItems.filter((item) => item.status === 'pending' || item.status === 'skipped')
      : selectedSegment === 'completed'
        ? selectedItems.filter((item) => item.status === 'visited')
        : selectedItems;

  const statusTone = (status: string): StatusTone => {
    switch (status) {
      case 'visited':
        return 'success';
      case 'pending':
        return 'primary';
      case 'skipped':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'visited':
        return 'Ziyaret Edildi';
      case 'pending':
        return 'Bekliyor';
      case 'skipped':
        return 'Atlandı';
      default:
        return status;
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
          eyebrow="Haftalık Plan"
          title="Haftanın rotası"
          subtitle={plan ? `${plan.weekNumber}. hafta rotası` : 'Planlanan ziyaretlerin tamamı'}
        />

        <ActiveVisitBanner />

        {errorMessage ? (
          <DataStatusBanner
            title="Plan alınamadı"
            description={errorMessage}
            tone="warning"
            lastUpdatedAt={lastUpdatedAt}
            actionLabel="Tekrar Dene"
            onAction={() => {
              setLoading(true);
              loadPlan();
            }}
          />
        ) : null}

        {refreshing ? (
          <DataStatusBanner
            title="Plan yenileniyor"
            description="Haftalık rota yeniden çekiliyor."
            tone="info"
            lastUpdatedAt={lastUpdatedAt}
          />
        ) : null}

        {isShowingCachedData ? (
          <DataStatusBanner
            title="Kaydedilen plan gösteriliyor"
            description="Bağlantı kurulamadığı için cihazdaki son başarılı haftalık plan kullanılıyor."
            tone="info"
            lastUpdatedAt={lastUpdatedAt}
          />
        ) : null}

        <SurfaceCard elevated style={styles.dayPickerCard}>
          <SectionHeader
            title="Gün seçimi"
            subtitle={selectedItems.length > 0 ? `${selectedItems.length} ziyaret planlı` : 'Bu gün için ziyaret görünmüyor'}
          />
          <View style={styles.dayRow}>
            {dayLabels.map((label, index) => {
              const selected = index === selectedDay;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => setSelectedDay(index)}
                  style={[styles.dayChip, selected ? styles.dayChipSelected : null]}
                >
                  <Text style={[styles.dayChipLabel, selected ? styles.dayChipLabelSelected : null]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SurfaceCard>

        <View style={styles.statsRow}>
          <StatCard label="Günlük toplam" value={String(selectedItems.length)} tone="primary" />
          <StatCard label="Tamamlanan" value={String(selectedCompleted)} tone="success" />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Bekleyen" value={String(selectedPending)} tone="warning" />
          <StatCard label="Haftalık toplam" value={String(plan?.items.length || 0)} tone="info" />
        </View>

        <View style={styles.segmentRow}>
          {weeklySegments.map((segment) => {
            const selected = selectedSegment === segment.key;
            return (
              <TouchableOpacity
                key={segment.key}
                onPress={() => setSelectedSegment(segment.key)}
                style={[styles.segmentChip, selected ? styles.segmentChipSelected : null]}
              >
                <Text style={[styles.segmentLabel, selected ? styles.segmentLabelSelected : null]}>
                  {segment.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeader
          title={`${dayLabels[selectedDay]} rotası`}
          subtitle={
            selectedSegment === 'pending'
              ? `${visibleItems.length} bekleyen kayıt`
              : selectedSegment === 'completed'
                ? `${visibleItems.length} tamamlanan kayıt`
                : 'Kartlara dokunarak müşteri detayını açın'
          }
        />

        {loading ? (
          <RouteListSkeleton count={4} />
        ) : !plan ? (
          <EmptyState
            title="Bu hafta plan yok"
            description="Bu kullanıcı için haftalık rota henüz oluşturulmamış görünüyor."
            actionLabel="Tekrar Dene"
            onAction={() => {
              setLoading(true);
              loadPlan();
            }}
          />
        ) : selectedItems.length === 0 ? (
          <EmptyState
            title="Seçilen gün boş"
            description="Bu gün için ziyaret planlanmamış. Diğer günleri kontrol edin."
          />
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="Bu segment boş"
            description="Seçtiğiniz filtre için bu gün özelinde kayıt görünmüyor."
          />
        ) : (
          <View style={styles.list}>
            {visibleItems.map((item) => (
              <ProspectCard
                key={item.id}
                order={item.visitOrder}
                companyName={item.prospect?.companyName || 'Bilinmeyen'}
                contactPerson={item.prospect?.contactPerson}
                address={item.prospect?.address}
                statusLabel={statusText(item.status)}
                statusTone={statusTone(item.status)}
                onPress={() =>
                  navigation.navigate('ProspectDetail', {
                    prospectId: item.prospect?.id || item.prospectId,
                    routePlanItemId: item.id,
                  })
                }
                actionLabel={item.status === 'visited' ? 'Detay' : 'Başlat'}
                onActionPress={() =>
                  item.status === 'visited'
                    ? navigation.navigate('ProspectDetail', {
                        prospectId: item.prospect?.id || item.prospectId,
                        routePlanItemId: item.id,
                      })
                    : navigation.navigate('StartVisit', {
                        prospectId: item.prospect?.id || item.prospectId,
                        prospectName: item.prospect?.companyName || 'Müşteri',
                        prospectAddress: item.prospect?.address || '',
                        routePlanItemId: item.id,
                      })
                }
                disabled={false}
              />
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
  dayPickerCard: {
    gap: theme.spacing.lg,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  dayChip: {
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  dayChipLabel: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  dayChipLabelSelected: {
    color: theme.colors.primaryStrong,
  },
  list: {
    gap: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  segmentChip: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
  },
  segmentChipSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  segmentLabel: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textMuted,
  },
  segmentLabelSelected: {
    color: theme.colors.primaryStrong,
  },
});
