import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Alert,
  View,
  Text,
} from 'react-native';
import * as Location from 'expo-location';
import { getProspect, startVisit } from '../lib/api';
import ActionButton from '../components/ui/ActionButton';
import InfoRow from '../components/ui/InfoRow';
import InlineAlert from '../components/ui/InlineAlert';
import ScreenContainer from '../components/ui/ScreenContainer';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import SurfaceCard from '../components/ui/SurfaceCard';
import { useToast } from '../context/ToastContext';
import { formatDistance, haversineDistanceMeters } from '../lib/geo';
import { theme } from '../theme';

export default function StartVisitScreen({ route, navigation }: any) {
  const { prospectId, prospectName, prospectAddress, routePlanItemId } = route.params;
  const { showToast } = useToast();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [distanceLabel, setDistanceLabel] = useState('');
  const [distanceState, setDistanceState] = useState<'unknown' | 'near' | 'far'>('unknown');

  const loadLocation = async () => {
    setLoading(true);
    setError('');

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Konum izni gereklidir. Ayarlardan izin verin.');
      setLoading(false);
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      if (prospectId) {
        const prospectRes = await getProspect(prospectId);
        const prospect = prospectRes.success ? (prospectRes.data as any) : null;
        const latitude = Number(prospect?.latitude);
        const longitude = Number(prospect?.longitude);

        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          const distance = haversineDistanceMeters(
            loc.coords.latitude,
            loc.coords.longitude,
            latitude,
            longitude,
          );
          setDistanceLabel(formatDistance(distance));
          setDistanceState(distance <= 200 ? 'near' : 'far');
        } else {
          setDistanceLabel('Koordinat bilgisi yok');
          setDistanceState('unknown');
        }
      }
    } catch (err) {
      setError('Konum alınamadı. GPS açık olduğundan emin olun.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLocation();
  }, []);

  const handleStart = async () => {
    if (!location) {
      Alert.alert('Hata', 'Konum bilgisi alınamadı');
      return;
    }
    if (!prospectId) {
      Alert.alert('Hata', 'Müşteri seçilmedi');
      return;
    }

    setStarting(true);
    setError('');

    const res = await startVisit({
      prospectId,
      routePlanItemId: routePlanItemId || undefined,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (res.success && res.data) {
      showToast('Ziyaret kaydı açıldı. Sonuç ekranına yönlendiriliyorsunuz.', {
        title: 'Ziyaret başladı',
        tone: 'success',
      });
      navigation.replace('ActiveVisit', {
        visitId: (res.data as any).id,
        prospectName,
      });
    } else {
      setError(res.error?.message || res.message || 'Ziyaret başlatılamadı');
      setStarting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.container}>
      <SurfaceCard elevated style={styles.card}>
        <SectionHeader
          title="Ziyaret başlat"
          subtitle="Konum doğrulandıktan sonra ziyaret aktif hale gelir."
        />

        <InfoRow label="Müşteri" value={prospectName || 'Seçilmedi'} />
        {prospectAddress ? <InfoRow label="Adres" value={prospectAddress} muted /> : null}

        <View style={styles.locationPanel}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationTitle}>GPS durumu</Text>
            {loading ? (
              <StatusBadge label="Konum alınıyor" tone="warning" />
            ) : location ? (
              <StatusBadge
                label={
                  distanceState === 'near'
                    ? 'Konum uygun'
                    : distanceState === 'far'
                      ? 'Uzak konum'
                      : 'Konum hazır'
                }
                tone={distanceState === 'far' ? 'warning' : 'success'}
              />
            ) : (
              <StatusBadge label="Konum yok" tone="danger" />
            )}
          </View>

          <Text style={styles.locationValue}>
            {loading
              ? 'Cihaz konumu hazırlanıyor...'
              : location
                ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
                : 'Konum alınamadı'}
          </Text>

          {distanceLabel ? (
            <Text style={styles.distanceText}>
              Müşteriye uzaklık: {distanceLabel}
            </Text>
          ) : null}

          <Text style={styles.locationHint}>
            {distanceState === 'far'
              ? 'Müşteriye henüz yeterince yakın değilsiniz. Yaklaşınca tekrar deneyin.'
              : 'Ziyaret başlatmak için müşteri noktasına yakın olmanız gerekir. Dış mekanda GPS doğruluğunu kontrol edin.'}
          </Text>
        </View>

        {error ? <InlineAlert title="Konum veya işlem hatası" message={error} tone="danger" /> : null}

        {loading ? (
          <InlineAlert
            message="GPS doğrulaması sürüyor. Açık alanda beklemek doğruluğu artırır."
            tone="info"
          />
        ) : null}

        <View style={styles.actions}>
          <ActionButton
            label="Ziyareti Başlat"
            onPress={handleStart}
            variant="success"
            disabled={!location}
            loading={starting}
          />
          <ActionButton label="Konumu Yenile" onPress={loadLocation} variant="secondary" disabled={starting} />
          <ActionButton label="Geri Dön" onPress={() => navigation.goBack()} variant="secondary" />
        </View>
      </SurfaceCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    gap: theme.spacing.lg,
  },
  locationPanel: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  locationTitle: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  locationValue: {
    fontSize: theme.typography.body,
    color: theme.colors.text,
  },
  locationHint: {
    fontSize: theme.typography.bodySm,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  distanceText: {
    fontSize: theme.typography.bodySm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
