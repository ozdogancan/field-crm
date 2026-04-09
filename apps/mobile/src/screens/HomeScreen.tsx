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
import { getMyCurrentPlan, getActiveVisit } from '../lib/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import LoadingState from '../components/ui/LoadingState';
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

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [todayItems, setTodayItems] = useState<PlanItem[]>([]);
  const [activeVisit, setActiveVisit] = useState<ActiveVisit | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
      } else {
        setTodayItems([]);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      setErrorMessage('Günlük rota verileri alınamadı. Ağı kontrol edip tekrar deneyin.');
    }
    setLoading(false);
  }, []);

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
  const heroLabel = activeVisit
    ? `${activeVisit.prospect?.companyName || 'Bir müşteri'} ziyareti devam ediyor`
    : pendingVisits > 0
      ? `${pendingVisits} ziyaret sırada`
      : 'Bugünkü plan temiz';

  return (
    <ScreenContainer contentStyle={styles.container}>
      <FlatList
        data={todayItems}
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
              <InlineAlert
                title="Rota verisi güncellenemedi"
                message={errorMessage}
                tone="warning"
              />
            ) : null}

            {refreshing ? (
              <InlineAlert
                message="Liste yenileniyor. Güncel rota birkaç saniye içinde görünecek."
                tone="info"
              />
            ) : null}

            <View style={styles.statsRow}>
              <StatCard label="Planlanan" value={String(todayItems.length)} tone="primary" />
              <StatCard label="Tamamlanan" value={String(completedVisits)} tone="success" />
            </View>

            <View style={styles.statsRow}>
              <StatCard label="Bekleyen" value={String(pendingVisits)} tone="warning" />
              <StatCard label="Aktif ziyaret" value={activeVisit ? '1' : '0'} tone="info" />
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

            <SectionHeader
              title="Bugünkü rota"
              subtitle={`${todayItems.length} ziyaret planı hazır`}
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
  separator: {
    height: theme.spacing.md,
  },
  trailingLink: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primaryStrong,
  },
});
