import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { startVisit } from '../lib/api';

export default function StartVisitScreen({ route, navigation }: any) {
  const { prospectId, prospectName, prospectAddress, routePlanItemId } = route.params;
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
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
      } catch (err) {
        setError('Konum alınamadı. GPS açık olduğundan emin olun.');
      }
      setLoading(false);
    })();
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ziyaret Başlat</Text>

        <View style={styles.info}>
          <Text style={styles.label}>Müşteri</Text>
          <Text style={styles.value}>{prospectName || 'Seçilmedi'}</Text>
        </View>

        {prospectAddress ? (
          <View style={styles.info}>
            <Text style={styles.label}>Adres</Text>
            <Text style={styles.value}>{prospectAddress}</Text>
          </View>
        ) : null}

        <View style={styles.info}>
          <Text style={styles.label}>Konumunuz</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#1e40af" />
          ) : location ? (
            <Text style={styles.value}>
              {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={[styles.value, { color: '#ef4444' }]}>Konum alınamadı</Text>
          )}
        </View>

        <View style={styles.gpsNote}>
          <Text style={styles.gpsNoteText}>
            Müşteri konumuna 200m mesafede olmanız gerekmektedir.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!location || starting) && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={!location || starting}
        >
          {starting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ziyareti Başlat</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', marginBottom: 24 },
  info: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 4 },
  value: { fontSize: 16, color: '#1e293b' },
  gpsNote: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  gpsNoteText: { fontSize: 13, color: '#1e40af', textAlign: 'center' },
  error: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: '#64748b', fontSize: 15 },
});
