import React, { useState, useCallback } from 'react';
import {
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { readCache, writeCache } from '../lib/cache';
import { getMyCurrentPlan, getActiveVisit } from '../lib/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AppHeader from '../components/ui/AppHeader';
import DataStatusBanner from '../components/ui/DataStatusBanner';
import EmptyState from '../components/ui/EmptyState';
import ProspectCard from '../components/ui/ProspectCard';
import RouteListSkeleton from '../components/ui/RouteListSkeleton';
import ScreenContainer from '../components/ui/ScreenContainer';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import StickyBanner from '../components/ui/StickyBanner';
import SurfaceCard from '../components/ui/SurfaceCard';
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
    phone: string;
    address: string;
    sector: string;
  } | null;
}

interface Plan {
  id: string;
  year: number;
  weekNumber: number;
  status: string;
  items: PlanItem[];
}

interface ActiveVisit {
  id: string;
  prospectId: string;
  startTime: string;
  status: string;
  prospect?: {
    id: string;
    companyName: string;
    contactPerson: string;
    address: string;
  };
}

const segments = [
  { key: 'priority', label: 'Öncelikli' },
  { key: 'today', label: 'Bugün' },
  { key: 'completed', label: 'Tamamlanan' },
] as const;

export default function HomeScreen() {
  const HOME_CACHE_KEY = 'mobile_home_today_route';
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [todayItems, setTodayItems] = useState<PlanItem[]>([]);
  const [activeVisit, setActiveVisit] = useState<ActiveVisit | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<(typeof segments)[number]['key']>('priority');
  const [isShowingCachedData, setIsShowingCachedData] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setErrorMessage('');
      const [planRes, activeRes] = await Promise.all([getMyCurrentPlan(), getActiveVisit()]);

      if (activeRes.success && activeRes.data) {
        setActiveVisit(activeRes.data as ActiveVisit);
      } else {
        setActiveVisit(null);
      }

      if (planRes.success && planRes.data) {
        const plan = planRes.data as Plan;
        if (plan?.items?.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const items = plan.items.filter((item) => {
            if (!item.plannedDate) return false;
            return new Date(item.plannedDate).toISOString().split('T')[0] === todayStr;
          });

          setTodayItems(items.sort((a, b) => a.visitOrder - b.visitOrder));
        } else {
          setTodayItems([]);
        }
        const updatedAt = new Date().toISOString();
        setLastUpdatedAt(updatedAt);
        setIsShowingCachedData(false);
        await writeCache(HOME_CACHE_KEY, {
          todayItems: plan?.items?.length
            ? plan.items
                .filter((item) => {
                  if (!item.plannedDate) return false;
                  return new Date(item.plannedDate).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                })
                .sort((a, b) => a.visitOrder - b.visitOrder)
            : [],
          lastUpdatedAt: updatedAt,
        });
      } else {
        setErrorMessage(planRes.error?.message || planRes.message || 'Günlük rota verileri alınamadı.');
        const cached = await readCache<{ todayItems: PlanItem[]; lastUpdatedAt: string }>(HOME_CACHE_KEY);
        if (cached) {
          setTodayItems(cached.todayItems);
          setLastUpdatedAt(cached.lastUpdatedAt);
          setIsShowingCachedData(true);
        }
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      setErrorMessage('Günlük rota verileri alınamadı. Ağı kontrol edip tekrar deneyin.');
      const cached = await readCache<{ todayItems: PlanItem[]; lastUpdatedAt: string }>(HOME_CACHE_KEY);
      if (cached) {
        setTodayItems(cached.todayItems);
        setLastUpdatedAt(cached.lastUpdatedAt);
        setIsShowingCachedData(true);
      }
    }
    setLoading(false);
  }, [HOME_CACHE_KEY]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openManualStart = () => {
    if (activeVisit) {
      Alert.alert('Uyarı', 'Devam eden bir ziyaretiniz var.');
      return;
    }

    navigation.navigate('StartVisit', {
      prospectId: '',
      prospectName: '',
      prospectAddress: '',
      routePlanItemId: '',
    });
  };

  const handleStartVisit = (item: PlanItem) => {
    if (activeVisit) {
      Alert.alert('Uyarı', 'Devam eden bir ziyaretiniz var. Önce onu sonlandırın.');
      return;
    }
    navigation.navigate('StartVisit', {
      prospectId: item.prospect?.id || item.prospectId,
      prospectName: item.prospect?.companyName || 'Müşteri',
      prospectAddress: item.prospect?.address || '',
      routePlanItemId: item.id,
    });
  };

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

  const completedVisits = todayItems.filter((item) => item.status === 'visited').length;
  const pendingVisits = todayItems.filter((item) => item.status === 'pending').length;
  const overdueVisits = todayItems.filter((item) => item.status === 'skipped').length;
  const heroLabel = activeVisit
    ? `${activeVisit.prospect?.companyName || 'Bir müşteri'} ziyareti devam ediyor`
    : pendingVisits > 0
      ? `${pendingVisits} ziyaret sırada`
      : 'Bugünkü plan temiz';
  const prioritizedItems = [
    ...todayItems.filter((item) => item.status === 'skipped'),
    ...todayItems.filter((item) => item.status === 'pending'),
  ];
  const completedItems = todayItems.filter((item) => item.status === 'visited');
  const visibleItems =
    selectedSegment === 'priority'
      ? prioritizedItems
      : selectedSegment === 'completed'
        ? completedItems
        : todayItems;
  const sectionSubtitle =
    selectedSegment === 'priority'
      ? `${prioritizedItems.length} kritik kayıt`
      : selectedSegment === 'completed'
        ? `${completedItems.length} tamamlanan ziyaret`
        : `${todayItems.length} ziyaret planı hazır`;

  return (
    <ScreenContainer contentStyle={styles.container}>
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProspectCard
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
                : handleStartVisit(item)
            }
            disabled={item.status === 'visited'}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <AppHeader
              eyebrow="Bugun"
              title={`Merhaba, ${user?.fullName?.split(' ')[0] || ''}`}
              subtitle={new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              trailingLabel="Çıkış"
              onTrailingPress={logout}
            />

            <SurfaceCard elevated style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Gün özeti</Text>
              <Text style={styles.heroTitle}>{heroLabel}</Text>
              <Text style={styles.heroDescription}>
                Önce aktif ziyareti yönetin, ardından bugünkü sıraya göre devam edin.
              </Text>
            </SurfaceCard>

            {errorMessage ? (
              <DataStatusBanner
                title="Rota verisi güncellenemedi"
                description={errorMessage}
                tone="warning"
                lastUpdatedAt={lastUpdatedAt}
                actionLabel="Tekrar Dene"
                onAction={() => {
                  setLoading(true);
                  fetchData();
                }}
              />
            ) : null}

            {refreshing ? (
              <DataStatusBanner
                title="Liste yenileniyor"
                description="Güncel rota birkaç saniye içinde ekrana yansıyacak."
                tone="info"
                lastUpdatedAt={lastUpdatedAt}
              />
            ) : null}

            {isShowingCachedData ? (
              <DataStatusBanner
                title="Kaydedilen veri gösteriliyor"
                description="Ağ erişimi sağlanamadığı için cihazdaki son başarılı rota kullanılıyor."
                tone="info"
                lastUpdatedAt={lastUpdatedAt}
              />
            ) : null}

            <View style={styles.statsRow}>
              <StatCard label="Planlanan" value={String(todayItems.length)} tone="primary" />
              <StatCard label="Tamamlanan" value={String(completedVisits)} tone="success" />
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Bekleyen" value={String(pendingVisits)} tone="warning" />
              <StatCard label="Geciken" value={String(overdueVisits)} tone="danger" />
            </View>

            {activeVisit ? (
              <StickyBanner
                title="Devam eden ziyaret"
                description={activeVisit.prospect?.companyName || 'Müşteri ziyareti devam ediyor'}
                badge="Canlı"
                onPress={() =>
                  navigation.navigate('ActiveVisit', {
                    visitId: activeVisit.id,
                    prospectName: activeVisit.prospect?.companyName || 'Müşteri',
                  })
                }
              />
            ) : null}

            <View style={styles.segmentRow}>
              {segments.map((segment) => {
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
              title="Bugünkü rota"
              subtitle={sectionSubtitle}
              trailing={(
                <TouchableOpacity onPress={openManualStart}>
                  <Text style={styles.trailingLink}>Manuel başlat</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <RouteListSkeleton count={4} />
          ) : (
            <EmptyState
              title="Bugün rota boş"
              description="Planlı ziyaret görünmüyor. Gerekirse manuel ziyaret başlatabilirsiniz."
              actionLabel="Manuel Ziyaret Başlat"
              onAction={openManualStart}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  listHeader: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: theme.colors.primaryStrong,
    borderColor: theme.colors.primaryStrong,
    gap: theme.spacing.sm,
  },
  heroEyebrow: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    color: '#BEECE8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: theme.typography.titleSm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
  },
  heroDescription: {
    fontSize: theme.typography.body,
    lineHeight: 22,
    color: '#D9F7F4',
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
  separator: {
    height: theme.spacing.md,
  },
  trailingLink: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryStrong,
  },
});
