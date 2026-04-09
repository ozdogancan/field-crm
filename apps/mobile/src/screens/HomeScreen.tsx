import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMyPlans, getCurrentWeek, getActiveVisit } from '../lib/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

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

  const fetchData = useCallback(async () => {
    try {
      const [weekRes, activeRes] = await Promise.all([
        getCurrentWeek(),
        getActiveVisit(),
      ]);

      if (activeRes.success && activeRes.data) {
        setActiveVisit(activeRes.data as ActiveVisit);
      } else {
        setActiveVisit(null);
      }

      if (weekRes.success && weekRes.data) {
        const { year, week } = weekRes.data as { year: number; week: number };
        const plansRes = await getMyPlans({ year, weekNumber: week });

        if (plansRes.success && plansRes.data) {
          const plans = plansRes.data as Plan[];
          if (plans.length > 0) {
            const today = new Date();
            const dayOfWeek = today.getDay() || 7; // 1=Mon, 7=Sun
            const todayStr = today.toISOString().split('T')[0];

            // Find today's items from all plans
            const items = plans[0].items.filter((item) => {
              if (!item.plannedDate) return false;
              const itemDate = new Date(item.plannedDate).toISOString().split('T')[0];
              return itemDate === todayStr;
            });

            setTodayItems(items.sort((a, b) => a.visitOrder - b.visitOrder));
          } else {
            setTodayItems([]);
          }
        }
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'visited': return '#22c55e';
      case 'pending': return '#3b82f6';
      case 'skipped': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'visited': return 'Ziyaret Edildi';
      case 'pending': return 'Bekliyor';
      case 'skipped': return 'Atlandı';
      default: return status;
    }
  };

  const renderItem = ({ item }: { item: PlanItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleStartVisit(item)}
      disabled={item.status === 'visited'}
    >
      <View style={styles.cardHeader}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{item.visitOrder}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.companyName}>{item.prospect?.companyName || 'Bilinmeyen'}</Text>
          <Text style={styles.contactPerson}>{item.prospect?.contactPerson}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
            {statusText(item.status)}
          </Text>
        </View>
      </View>
      {item.prospect?.address && (
        <Text style={styles.address} numberOfLines={1}>{item.prospect.address}</Text>
      )}
      {item.prospect?.sector && (
        <Text style={styles.sector}>{item.prospect.sector}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {user?.fullName?.split(' ')[0]}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {/* Active Visit Banner */}
      {activeVisit && (
        <TouchableOpacity
          style={styles.activeBanner}
          onPress={() =>
            navigation.navigate('ActiveVisit', {
              visitId: activeVisit.id,
              prospectName: activeVisit.prospect?.companyName || 'Müşteri',
            })
          }
        >
          <View style={styles.activeDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeTitle}>Devam Eden Ziyaret</Text>
            <Text style={styles.activeCompany}>{activeVisit.prospect?.companyName}</Text>
          </View>
          <Text style={styles.activeArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Today's Plan */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bugünkü Plan</Text>
        <Text style={styles.sectionCount}>{todayItems.length} ziyaret</Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Yükleniyor...</Text>
        </View>
      ) : todayItems.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Bugün için planlanmış ziyaret yok.</Text>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => {
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
            }}
          >
            <Text style={styles.manualBtnText}>Manuel Ziyaret Başlat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={todayItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1e40af',
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: '#bfdbfe', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#bfdbfe', fontSize: 14 },

  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f59e0b',
    marginRight: 12,
  },
  activeTitle: { fontSize: 12, color: '#92400e', fontWeight: '600' },
  activeCompany: { fontSize: 15, color: '#78350f', fontWeight: 'bold' },
  activeArrow: { fontSize: 20, color: '#92400e' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  sectionCount: { fontSize: 14, color: '#64748b' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  companyName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  contactPerson: { fontSize: 13, color: '#64748b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  address: { fontSize: 12, color: '#94a3b8', marginTop: 6, marginLeft: 40 },
  sector: { fontSize: 11, color: '#3b82f6', marginTop: 2, marginLeft: 40 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8' },
  manualBtn: {
    marginTop: 16,
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  manualBtnText: { color: '#fff', fontWeight: '600' },
});
