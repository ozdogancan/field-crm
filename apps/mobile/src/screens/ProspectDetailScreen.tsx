import React, { useCallback, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import ActionButton from '../components/ui/ActionButton';
import EmptyState from '../components/ui/EmptyState';
import InfoRow from '../components/ui/InfoRow';
import InlineAlert from '../components/ui/InlineAlert';
import RouteListSkeleton from '../components/ui/RouteListSkeleton';
import ScreenContainer from '../components/ui/ScreenContainer';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import SurfaceCard from '../components/ui/SurfaceCard';
import { getProspect } from '../lib/api';
import { formatDistance, haversineDistanceMeters } from '../lib/geo';
import { theme } from '../theme';

interface ProspectDetail {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  address: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  sector?: string | null;
  notes?: string | null;
  visits?: Array<{
    id: string;
    startTime: string;
    result?: string | null;
    resultNotes?: string | null;
    status: string;
    durationMinutes?: number | null;
    user?: { fullName?: string | null } | null;
  }>;
}

export default function ProspectDetailScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const { prospectId, routePlanItemId } = route.params;
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [distanceLabel, setDistanceLabel] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const loadProspect = useCallback(async () => {
    try {
      setErrorMessage('');
      setLocationStatus('loading');
      const res = await getProspect(prospectId);
      if (res.success && res.data) {
        const nextProspect = res.data as ProspectDetail;
        setProspect(nextProspect);

        const latitude = Number(nextProspect.latitude);
        const longitude = Number(nextProspect.longitude);

        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status === 'granted') {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const distance = haversineDistanceMeters(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              latitude,
              longitude,
            );
            setDistanceLabel(formatDistance(distance));
            setLocationStatus('ready');
          } else {
            setDistanceLabel('Konum izni verilmedi');
            setLocationStatus('error');
          }
        } else {
          setDistanceLabel('Koordinat bilgisi yok');
          setLocationStatus('error');
        }
      } else {
        setProspect(null);
        setErrorMessage(res.error?.message || res.message || 'Müşteri detayı alınamadı.');
        setLocationStatus('error');
      }
    } catch {
      setErrorMessage('Müşteri detayı alınamadı.');
      setLocationStatus('error');
    }
    setLoading(false);
  }, [prospectId]);

  useFocusEffect(
    useCallback(() => {
      loadProspect();
    }, [loadProspect]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProspect();
    setRefreshing(false);
  };

  const resultLabel = (result?: string | null) => {
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

  const latestVisit = prospect?.visits?.[0];
  const recommendation = latestVisit
    ? latestVisit.result === 'positive'
      ? {
          tone: 'success' as const,
          badge: 'Sıcak fırsat',
          title: 'Takibi geciktirmeyin',
          description: 'Son görüşme olumlu görünüyor. Kısa aralıkla tekrar temas kurup ziyareti hızlıca yenileyin.',
          actionLabel: 'Yeni ziyaret başlat',
        }
      : latestVisit.result === 'neutral'
        ? {
            tone: 'warning' as const,
            badge: 'Takip gerekli',
            title: 'Kararı netleştirin',
            description: 'Son görüşme nötr kalmış. Notları gözden geçirip net bir sonraki adımla tekrar gidin.',
            actionLabel: 'Takip ziyareti başlat',
          }
        : latestVisit.result === 'negative'
          ? {
              tone: 'danger' as const,
              badge: 'Düşük potansiyel',
              title: 'Ziyareti dikkatli planlayın',
              description: 'Son görüşme olumsuz bitmiş. Tekrar gitmeden önce telefonla ön doğrulama yapmak daha güvenli olabilir.',
              actionLabel: 'Yine de ziyaret başlat',
            }
          : {
              tone: 'info' as const,
              badge: 'Geçmiş var',
              title: 'Kısa hazırlık yapın',
              description: 'Önceki kayıt var ama net sonuç görünmüyor. Notları okuyup sahaya çıkın.',
              actionLabel: 'Ziyareti başlat',
            }
    : {
        tone: 'info' as const,
        badge: 'İlk temas',
        title: 'İlk ziyaret için hazır',
        description: 'Bu müşteri için kayıtlı görüşme görünmüyor. İlk ziyaret notlarını düzenli tutun.',
        actionLabel: 'İlk ziyareti başlat',
      };

  const openPhone = async () => {
    if (!prospect?.phone) return;
    const url = `tel:${prospect.phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
    Alert.alert('Hata', 'Telefon uygulaması açılamadı.');
  };

  const openMaps = async () => {
    if (!prospect?.address) return;
    const latitude = Number(prospect.latitude);
    const longitude = Number(prospect.longitude);
    const target =
      !Number.isNaN(latitude) && !Number.isNaN(longitude)
        ? `${latitude},${longitude}`
        : encodeURIComponent(prospect.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${target}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
    Alert.alert('Hata', 'Harita açılamadı.');
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.content}
      >
        {errorMessage ? <InlineAlert title="Detay alınamadı" message={errorMessage} tone="warning" /> : null}

        {loading ? (
          <RouteListSkeleton count={3} />
        ) : !prospect ? (
          <EmptyState
            title="Müşteri bulunamadı"
            description="Kayıt silinmiş olabilir veya erişim sorunu yaşanıyor."
            actionLabel="Tekrar Dene"
            onAction={() => {
              setLoading(true);
              loadProspect();
            }}
          />
        ) : (
          <>
            <SurfaceCard elevated style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <StatusBadge label="Müşteri detayı" tone="info" />
                <StatusBadge
                  label={
                    locationStatus === 'loading'
                      ? 'Mesafe hesaplanıyor'
                      : locationStatus === 'ready'
                        ? distanceLabel
                        : 'Mesafe yok'
                  }
                  tone={locationStatus === 'ready' ? 'success' : locationStatus === 'loading' ? 'warning' : 'neutral'}
                />
              </View>
              <Text style={styles.companyName}>{prospect.companyName}</Text>
              <Text style={styles.contactName}>{prospect.contactPerson}</Text>
            </SurfaceCard>

            <SurfaceCard style={styles.section}>
              <SectionHeader title="İletişim ve konum" />
              <InfoRow label="Telefon" value={prospect.phone || '-'} />
              <InfoRow label="Adres" value={prospect.address || '-'} muted />
              <InfoRow
                label="Mesafe"
                value={distanceLabel || 'Mesafe hesaplanamadı'}
                muted={locationStatus !== 'ready'}
              />
              {prospect.sector ? <InfoRow label="Sektör" value={prospect.sector} muted /> : null}
              <View style={styles.actionStack}>
                <ActionButton label="Telefon Ara" onPress={openPhone} variant="secondary" />
                <ActionButton label="Rota Aç" onPress={openMaps} variant="secondary" />
              </View>
            </SurfaceCard>

            <SurfaceCard style={[styles.section, styles.recommendationCard]}>
              <View style={styles.recommendationHeader}>
                <StatusBadge label={recommendation.badge} tone={recommendation.tone} />
              </View>
              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              <Text style={styles.recommendationText}>{recommendation.description}</Text>
              {latestVisit?.resultNotes ? (
                <View style={styles.recommendationNoteBox}>
                  <Text style={styles.recommendationNoteLabel}>Son not</Text>
                  <Text style={styles.recommendationNoteText}>{latestVisit.resultNotes}</Text>
                </View>
              ) : null}
              <ActionButton
                label={recommendation.actionLabel}
                onPress={() =>
                  navigation.navigate('StartVisit', {
                    prospectId: prospect.id,
                    prospectName: prospect.companyName,
                    prospectAddress: prospect.address,
                    routePlanItemId: routePlanItemId || '',
                  })
                }
                variant="primary"
              />
            </SurfaceCard>

            {prospect.notes ? (
              <SurfaceCard style={styles.section}>
                <SectionHeader title="Saha notu" />
                <Text style={styles.notes}>{prospect.notes}</Text>
              </SurfaceCard>
            ) : null}

            <SurfaceCard style={styles.section}>
              <SectionHeader title="Son ziyaretler" subtitle={`${prospect.visits?.length || 0} kayıt`} />
              {prospect.visits && prospect.visits.length > 0 ? (
                <View style={styles.visitList}>
                  {prospect.visits.map((visit) => (
                    <View key={visit.id} style={styles.visitRow}>
                      <View style={styles.visitCopy}>
                        <Text style={styles.visitDate}>
                          {new Date(visit.startTime).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text style={styles.visitMeta}>
                          {resultLabel(visit.result)} · {visit.durationMinutes ? `${visit.durationMinutes} dk` : '-'}
                        </Text>
                        {visit.resultNotes ? <Text style={styles.visitNotes}>{visit.resultNotes}</Text> : null}
                      </View>
                      <StatusBadge
                        label={visit.status === 'completed' ? 'Tamamlandı' : visit.status === 'cancelled' ? 'İptal' : 'Aktif'}
                        tone={visit.status === 'completed' ? 'success' : visit.status === 'cancelled' ? 'danger' : 'warning'}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="Ziyaret geçmişi yok"
                  description="Bu müşteri için daha önce kayıtlı ziyaret bulunmuyor."
                />
              )}
            </SurfaceCard>

          </>
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
  heroCard: {
    gap: theme.spacing.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  companyName: {
    fontSize: theme.typography.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  contactName: {
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
  },
  section: {
    gap: theme.spacing.lg,
  },
  recommendationCard: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationTitle: {
    fontSize: theme.typography.titleSm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  recommendationText: {
    fontSize: theme.typography.body,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
  recommendationNoteBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  recommendationNoteLabel: {
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationNoteText: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  actionStack: {
    gap: theme.spacing.md,
  },
  notes: {
    fontSize: theme.typography.body,
    lineHeight: 22,
    color: theme.colors.textMuted,
  },
  visitList: {
    gap: theme.spacing.md,
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  visitCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  visitDate: {
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  visitMeta: {
    fontSize: theme.typography.bodySm,
    color: theme.colors.textMuted,
  },
  visitNotes: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
});
